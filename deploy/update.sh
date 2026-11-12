#!/usr/bin/env bash
# fern redeploy: pull → rebuild → restart, keep Caddy certs (caddy_data volume).
# Run on the EC2 box from /opt/fern. NEXT_PUBLIC_* changes require the rebuild
# below (baked at build time) — this script always rebuilds, so that's covered.
set -euo pipefail
cd /opt/fern
git pull --ff-only
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker image prune -f
echo "--- health (via app container; app port is not published to the host) ---"
for i in $(seq 1 24); do
  if docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T app wget -qO- http://localhost:3000/api/health; then
    echo
    break
  fi
  sleep 5
done
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
