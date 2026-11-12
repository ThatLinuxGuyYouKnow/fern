#!/usr/bin/env bash
# fern redeploy: pull → rebuild → restart, keep Caddy certs (caddy_data volume).
# Run on the EC2 box from /opt/fern. NEXT_PUBLIC_* changes require the rebuild
# below (baked at build time) — this script always rebuilds, so that's covered.
set -euo pipefail
cd /opt/fern
git pull --ff-only
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker image prune -f
echo "--- health ---"
curl -fs http://localhost:3000/api/health; echo
docker compose -f docker-compose.prod.yml ps
