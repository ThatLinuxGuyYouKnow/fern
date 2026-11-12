#!/usr/bin/env bash
# fern EC2 bootstrap — runnable AWS CLI equivalent of the console launch wizard.
# Fixes what console "code" gets wrong: real SG id, subnet, IAM profile, user-data.
#
# Prereqs: awscli v2 + credentials (`aws sts get-caller-identity` works).
# Usage:
#   cp deploy/aws.env.example deploy/aws.env   # fill in
#   set -a; source deploy/aws.env; set +a
#   bash deploy/aws-bootstrap.sh
#
# Idempotent-ish: reuses SG / role / profile if they already exist.
set -euo pipefail

: "${AWS_REGION:?set AWS_REGION}"
: "${VPC_ID:?set VPC_ID}"
: "${SUBNET_ID:?set SUBNET_ID}"
: "${KEY_NAME:=}"   # optional — Session Manager doesn't need it
: "${AMI_ID:?set AMI_ID}"
: "${DOMAIN:?set DOMAIN}"
: "${ACME_EMAIL:?set ACME_EMAIL}"
: "${REPO_URL:?set REPO_URL (public git URL the box can clone)}"
: "${INSTANCE_TYPE:=t3.micro}"
: "${SG_NAME:=fern-prod-sg}"
: "${ROLE_NAME:=fern-route53}"
: "${PROFILE_NAME:=fern-route53-profile}"
: "${DNS_PROVIDER:=route53}"

if [ "$DNS_PROVIDER" = "duckdns" ]; then
  : "${DUCKDNS_TOKEN:?set DUCKDNS_TOKEN (duckdns.org account page)}"
  case "$DOMAIN" in
    *.duckdns.org) ;;
    *) echo "DOMAIN must be <name>.duckdns.org when DNS_PROVIDER=duckdns" >&2; exit 1 ;;
  esac
else
  : "${HOSTED_ZONE_ID:?set HOSTED_ZONE_ID (Route53 zone for DOMAIN), or DNS_PROVIDER=duckdns}"
fi

aws() { command aws --region "$AWS_REGION" "$@"; }
say() { printf '\n== %s\n' "$*"; }

say "0. sanity"
aws sts get-caller-identity
aws ec2 describe-images --image-ids "$AMI_ID" \
  --query 'Images[0].{Name:Name,Arch:Architecture,Platform:PlatformDetails}' --output table

say "1. security group (80/443 world; no :22 — use Session Manager)"
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)
if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
  SG_ID=$(aws ec2 create-security-group --group-name "$SG_NAME" \
    --description 'fern prod: http/https only' --vpc-id "$VPC_ID" \
    --query GroupId --output text)
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --ip-permissions \
    '{"IpProtocol":"tcp","FromPort":80,"ToPort":80,"IpRanges":[{"CidrIp":"0.0.0.0/0","Description":"http"}]}' \
    '{"IpProtocol":"tcp","FromPort":443,"ToPort":443,"IpRanges":[{"CidrIp":"0.0.0.0/0","Description":"https"}]}'
fi
echo "SG_ID=$SG_ID"

say "2. IAM role: DNS-01 + SSM (console/session access, no SSH)"
if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document \
    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
fi
if [ "$DNS_PROVIDER" = "route53" ]; then
  aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name route53-dns01 --policy-document \
    "{\"Version\":\"2012-10-17\",\"Statement\":[
       {\"Effect\":\"Allow\",\"Action\":[\"route53:ChangeResourceRecordSets\"],\"Resource\":\"arn:aws:route53:::hostedzone/$HOSTED_ZONE_ID\"},
       {\"Effect\":\"Allow\",\"Action\":[\"route53:ListHostedZones\",\"route53:ListResourceRecordSets\"],\"Resource\":\"*\"}]}"
fi
aws iam attach-role-policy --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
if ! aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" >/dev/null 2>&1; then
  aws iam create-instance-profile --instance-profile-name "$PROFILE_NAME" >/dev/null
fi
# Attach role (idempotent) and wait for IAM→EC2 propagation before RunInstances.
aws iam add-role-to-instance-profile --instance-profile-name "$PROFILE_NAME" --role-name "$ROLE_NAME" 2>/dev/null || true
for i in $(seq 1 12); do
  ROLES=$(aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" \
    --query 'InstanceProfile.Roles[].RoleName' --output text 2>/dev/null || true)
  case " $ROLES " in *" $ROLE_NAME "*) break ;; esac
  echo "waiting for instance profile propagation ($i/12)..."
  sleep 5
done

say "3. user-data (env baked into first boot)"
# Same CONFIG block as deploy/ec2-user-data.sh — exported vars override defaults there.
UD=$(mktemp)
{
  echo '#!/usr/bin/env bash'
  printf 'export DNS_PROVIDER=%q\n' "$DNS_PROVIDER"
  printf 'export DOMAIN=%q\n' "$DOMAIN"
  printf 'export ACME_EMAIL=%q\n' "$ACME_EMAIL"
  printf 'export DUCKDNS_TOKEN=%q\n' "${DUCKDNS_TOKEN:-}"
  printf 'export AWS_REGION=%q\n' "$AWS_REGION"
  printf 'export REPO_URL=%q\n' "$REPO_URL"
  printf 'export NEXT_PUBLIC_SUPABASE_URL=%q\n' "${NEXT_PUBLIC_SUPABASE_URL:-}"
  printf 'export NEXT_PUBLIC_SUPABASE_ANON_KEY=%q\n' "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
  printf 'export PAYPAL_CLIENT_ID=%q\n' "${PAYPAL_CLIENT_ID:-DUMMY_CLIENT_ID}"
  printf 'export PAYPAL_CLIENT_SECRET=%q\n' "${PAYPAL_CLIENT_SECRET:-DUMMY_CLIENT_SECRET}"
  printf 'export PAYPAL_MODE=%q\n' "${PAYPAL_MODE:-sandbox}"
  printf 'export NEXT_PUBLIC_PAYPAL_CLIENT_ID=%q\n' "${NEXT_PUBLIC_PAYPAL_CLIENT_ID:-}"
  printf 'export NEXT_PUBLIC_ROOT_DOMAIN=%q\n' "${NEXT_PUBLIC_ROOT_DOMAIN:-$DOMAIN}"
  printf 'export DEEPSEEK_API_KEY=%q\n' "${DEEPSEEK_API_KEY:-}"
  echo '# ---- repo script body ----'
  grep -v '^#!' deploy/ec2-user-data.sh
} > "$UD"

say "4. launch instance"
KEY_ARGS=()
[ -n "$KEY_NAME" ] && KEY_ARGS=(--key-name "$KEY_NAME")
# Retry once or twice: brand-new IAM profiles can take a few seconds to propagate.
RUN_ERR=$(mktemp)
for attempt in 1 2 3 4; do
  if INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" --instance-type "$INSTANCE_TYPE" "${KEY_ARGS[@]+"${KEY_ARGS[@]}"}" \
    --subnet-id "$SUBNET_ID" --security-group-ids "$SG_ID" --associate-public-ip-address \
    --iam-instance-profile Name="$PROFILE_NAME" \
    --user-data "file://$UD" \
    --credit-specification '{"CpuCredits":"unlimited"}' \
    --tag-specifications '[{"ResourceType":"instance","Tags":[{"Key":"Name","Value":"fern"}]}]' \
    --metadata-options '{"HttpEndpoint":"enabled","HttpPutResponseHopLimit":2,"HttpTokens":"required"}' \
    --query 'Instances[0].InstanceId' --output text 2>"$RUN_ERR"); then
    break
  fi
  if grep -q "Invalid IAM Instance Profile" "$RUN_ERR" && [ "$attempt" -lt 4 ]; then
    echo "IAM profile not propagated yet — retry $attempt/4 in 15s..."
    sleep 15
  else
    cat "$RUN_ERR" >&2
    exit 1
  fi
done
echo "INSTANCE_ID=$INSTANCE_ID"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"

say "5. elastic IP (stable address for DNS)"
ALLOC_ID=$(aws ec2 allocate-address --domain vpc --query AllocationId --output text)
aws ec2 associate-address --instance-id "$INSTANCE_ID" --allocation-id "$ALLOC_ID" >/dev/null
EIP=$(aws ec2 describe-addresses --allocation-ids "$ALLOC_ID" --query 'Addresses[0].PublicIp' --output text)
echo "EIP=$EIP"

say "6. DNS: apex + wildcard A records"
if [ "$DNS_PROVIDER" = "duckdns" ]; then
  SUB="${DOMAIN%.duckdns.org}"
  RES=$(curl -fsS "https://www.duckdns.org/update?domains=${SUB},*.${SUB}&token=${DUCKDNS_TOKEN}&ip=${EIP}" || echo "KO")
  echo "DuckDNS: ${SUB} + *.${SUB} -> ${EIP} : ${RES} (expect OK)"
  [ "$RES" = "OK" ] || echo "WARN: DuckDNS update failed — check DUCKDNS_TOKEN and that '<name>' + '*.<name>' exist in the dashboard"
else
  HOSTED_ZONE_NAME=$(aws route53 get-hosted-zone --id "$HOSTED_ZONE_ID" --query 'HostedZone.Name' --output text)
  CHANGES=$(cat <<JSON
{"Comment":"fern apex+wildcard","Changes":[
 {"Action":"UPSERT","ResourceRecordSet":{"Name":"$DOMAIN","Type":"A","TTL":60,"ResourceRecords":[{"Value":"$EIP"}]}},
 {"Action":"UPSERT","ResourceRecordSet":{"Name":"*.$DOMAIN","Type":"A","TTL":60,"ResourceRecords":[{"Value":"$EIP"}]}}]}
JSON
  )
  aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" --change-batch "$CHANGES" >/dev/null
  echo "DNS: $DOMAIN + *.$DOMAIN -> $EIP (zone $HOSTED_ZONE_NAME)"
fi

cat <<EOF

=== done ===
instance : $INSTANCE_ID
elastic ip: $EIP
dns      : $DNS_PROVIDER ($DOMAIN + *.$DOMAIN)
console  : EC2 > Instances > fern > Connect > Session Manager
boot log : sudo tail -f /var/log/cloud-init-output.log
app log  : cd /opt/fern && docker compose -f docker-compose.prod.yml logs -f
url      : https://$DOMAIN  (tenant: https://<slug>.$DOMAIN)
EOF
