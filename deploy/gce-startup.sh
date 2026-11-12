#!/usr/bin/env bash
# GCE startup script: Docker + fern + Caddy (duckdns build) on e2-micro (Debian/Ubuntu).
# Set DUCKDNS_DOMAIN + DUCKDNS_TOKEN + env vars below before running.
set -euo pipefail

DUCKDNS_DOMAIN="${DUCKDNS_DOMAIN:-fernshop.duckdns.org}"
APP_PORT=3000

# --- docker ---
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
fi

# --- app env (fill in!) ---
# export NEXT_PUBLIC_SUPABASE_URL=...
# export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# export PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... PAYPAL_MODE=sandbox
# export NEXT_PUBLIC_PAYPAL_CLIENT_ID=... NEXT_PUBLIC_ROOT_DOMAIN="$DUCKDNS_DOMAIN"

# --- run fern ---
docker pull ghcr.io/you/fern:latest || docker build -t fern /opt/fern
docker rm -f fern || true
docker run -d --name fern --restart unless-stopped -p 127.0.0.1:${APP_PORT}:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL -e NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -e PAYPAL_CLIENT_ID -e PAYPAL_CLIENT_SECRET -e PAYPAL_MODE \
  -e NEXT_PUBLIC_PAYPAL_CLIENT_ID -e NEXT_PUBLIC_ROOT_DOMAIN \
  fern

# --- caddy with duckdns plugin ---
if ! command -v caddy >/dev/null; then
  curl -sL "https://caddyserver.com/api/download?os=linux&arch=amd64&p=github.com%2Fcaddy-dns%2Fduckdns" -o /tmp/caddy
  sudo install -m 0755 /tmp/caddy /usr/bin/caddy
fi
sed "s/fernshop.duckdns.org/${DUCKDNS_DOMAIN}/g" /opt/fern/Caddyfile | sudo tee /etc/caddy/Caddyfile >/dev/null
echo "DUCKDNS_TOKEN=${DUCKDNS_TOKEN:-}" | sudo tee /etc/caddy/duckdns.env >/dev/null
sudo systemctl enable --now caddy || (caddy fmt --overwrite /etc/caddy/Caddyfile && sudo systemctl restart caddy)
echo "fern up: https://${DUCKDNS_DOMAIN}"
