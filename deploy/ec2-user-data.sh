#!/usr/bin/env bash
# fern EC2 user-data / first-boot: Docker + compose stack (app + Caddy w/ Route53 wildcard).
# Tested target: Ubuntu 22.04/24.04 t3.micro+. Run once; re-runnable.
#
# 1. Attach an IAM instance role with route53:ChangeResourceRecordSets on your
#    hosted zone (preferred — Caddy DNS-01 needs no static AWS keys).
#    Minimal policy: route53:ChangeResourceRecordSets + ListHostedZones +
#    ListResourceRecordSets on the zone. (No AWS keys in env needed.)
# 2. Route53: A  DOMAIN → elastic IP ; A  *.DOMAIN → same elastic IP.
#    Security group: tcp 22 (you), 80 + 443 (world).
# 3. Fill the CONFIG block below (or inject via EC2 user-data env), then run.
# 4. Paste this file into EC2 > Launch instance > Advanced > User data, or run
#    it over SSH on an existing box.
set -euo pipefail

# ============ CONFIG — fill in ============
DOMAIN="${DOMAIN:-fernshop.com}"
ACME_EMAIL="${ACME_EMAIL:-admin@fernshop.com}"
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
OPENCODE_GO_API_KEY="${OPENCODE_GO_API_KEY:-}"
# ===========================================

export DEBIAN_FRONTEND=noninteractive

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
NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=$PAYPAL_CLIENT_SECRET
PAYPAL_MODE=$PAYPAL_MODE
NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID
NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
OPENCODE_GO_API_KEY=$OPENCODE_GO_API_KEY
EOF
chmod 600 .env.prod

# --- up ---
DOMAIN="$DOMAIN" docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo "--- waiting for app health ---"
for i in $(seq 1 24); do
  if curl -fs -o /dev/null "http://localhost:3000/api/health"; then break; fi
  sleep 5
done
echo "--- caddy certs (expect 2: apex + wildcard) ---"
docker compose -f docker-compose.prod.yml exec caddy caddy list-certificates || true
echo "fern up: https://$DOMAIN  (tenant: https://<slug>.$DOMAIN)"
