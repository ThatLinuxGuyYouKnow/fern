# Caddy with the Route53 DNS-01 plugin (needed for *.DOMAIN wildcard on EC2).
# Build: docker build -f deploy/Caddy.Dockerfile -t fern-caddy .
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/caddy-dns/route53

FROM caddy:2
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
