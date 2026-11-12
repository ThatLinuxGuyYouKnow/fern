# Caddy with BOTH DNS-01 plugins:
#  - route53 (custom domain, DNS_PROVIDER=route53)
#  - duckdns (free domain, DNS_PROVIDER=duckdns)
# One image serves either — selected by which Caddyfile is mounted.
# Build: docker build -f deploy/Caddy.Dockerfile -t fern-caddy .
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/caddy-dns/route53 --with github.com/caddy-dns/duckdns

FROM caddy:2
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
