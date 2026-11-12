#!/usr/bin/env bash
# fern EC2 user-data / first-boot: Docker + compose stack (app + Caddy wildcard TLS).
# Tested target: Ubuntu 22.04/24.04 t3.micro+. Run once; re-runnable.
#
# DNS_PROVIDER picks the TLS/DNS path:
#   route53 — custom domain. Requires IAM instance role with
#             route53:ChangeResourceRecordSets on the hosted zone (no AWS keys).
#             Route53: A DOMAIN → EIP ; A *.DOMAIN → EIP.
#   duckdns — free <name>.duckdns.org. Requires DUCKDNS_TOKEN. Create both
#             "<name>" and "*.<name>" subdomains in the DuckDNS dashboard; this
#             script points them at the instance's public IP automatically.
# Security group: tcp 80 + 443 world (no :22 needed — use Session Manager).
#
# Fill the CONFIG block below (or inject via EC2 user-data env), then run.
# deploy/aws-bootstrap.sh generates this automatically.
set -euo pipefail

# ============ CONFIG — fill in ============
DNS_PROVIDER="${DNS_PROVIDER:-route53}"   # route53 | duckdns
DOMAIN="${DOMAIN:-fernshop.com}"          # duckdns: <name>.duckdns.org
ACME_EMAIL="${ACME_EMAIL:-admin@fernshop.com}"
DUCKDNS_TOKEN="${DUCKDNS_TOKEN:-}"        # duckdns only
AWS_REGION="${AWS_REGION:-us-east-1}"
REPO_URL="${REPO_URL:-https://github.com/YOU/fern.git}"
APP_DIR="/opt/fern"
# Server-only + public env for the compose stack:
NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
PAYPAL_CLIENT_ID="${PAYPAL_CLIENT_ID:-DUMMY_CLIENT_ID}"
PAYPAL_CLIENT_SECRET="${PAYPAL_CLIENT_SECRET:-DUMMY_CLIENT_SECRET}"
PAYPAL_MODE="${PAYPAL_MODE:-sandbox}"
NEXT_PUBLIC_PAYPAL_CLIENT_ID="${NEXT_PUBLIC_PAYPAL_CLIENT_ID:-$PAYPAL_CLIENT_ID}"
NEXT_PUBLIC_ROOT_DOMAIN="${NEXT_PUBLIC_ROOT_DOMAIN:-$DOMAIN}"
DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-}"
# ===========================================

export DEBIAN_FRONTEND=noninteractive

# --- Caddyfile selection (tracked file stays untouched → clean `git pull`) ---
if [ "$DNS_PROVIDER" = "duckdns" ]; then
  CADDYFILE="deploy/Caddyfile.duckdns"
else
  CADDYFILE="Caddyfile"
fi

# --- docker ---
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y docker-compose-plugin
fi
systemctl enable --now docker

# --- app checkout ---
if [ ! -d "$APP_DIR/.git" ]; then
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR" || cp -r /home/ubuntu/fern "$APP_DIR"
fi
cd "$APP_DIR"
git pull --ff-only || true

# --- env file for compose (NOT committed; perms 600) ---
umask 077
cat > .env.prod <<EOF
DOMAIN=$DOMAIN
ACME_EMAIL=$ACME_EMAIL
AWS_REGION=$AWS_REGION
DUCKDNS_TOKEN=$DUCKDNS_TOKEN
CADDYFILE=$CADDYFILE
NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=$PAYPAL_CLIENT_SECRET
PAYPAL_MODE=$PAYPAL_MODE
NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID
NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY
EOF
chmod 600 .env.prod

# --- DuckDNS: point the apex at this instance (sub-subdomains inherit it) ---
if [ "$DNS_PROVIDER" = "duckdns" ] && [ -n "$DUCKDNS_TOKEN" ]; then
  SUB="${DOMAIN%.duckdns.org}"
  curl -fsS "https://www.duckdns.org/update?domains=${SUB}&token=${DUCKDNS_TOKEN}" \
    || echo "WARN: duckdns update failed — rerun: curl 'https://www.duckdns.org/update?domains=${SUB}&token=<token>'"
fi

# --- up ---
CADDYFILE="$CADDYFILE" docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo "--- waiting for app health ---"
for i in $(seq 1 24); do
  if curl -fs -o /dev/null "http://localhost:3000/api/health"; then break; fi
  sleep 5
done
echo "--- caddy certs (expect 2: apex + wildcard) ---"
docker compose -f docker-compose.prod.yml exec caddy caddy list-certificates || true
echo "fern up: https://$DOMAIN  (tenant: https://<slug>.$DOMAIN)"
