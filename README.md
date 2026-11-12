# fern — zero-code multi-tenant storefronts (PayPal AI Hackathon)

Pick a template or describe it to AI, upload a logo + products (form or CSV),
get a live storefront at `<slug>.domain` or `/s/<slug>`, check out with PayPal.

## Live demo

- Apex/app: `https://YOUR-DOMAIN/` (create a store)
- Storefront: `https://YOUR-DOMAIN/s/muse` or `https://muse.YOUR-DOMAIN` (wildcard via Caddy)

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```

Stores created locally are viewable at `http://localhost:3000/s/<slug>`.
Subdomain mode locally: `http://<slug>.lvh.me:3000` (lvh.me resolves to localhost).

## Env vars

| var | notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase backend (Postgres + Storage) |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_MODE=sandbox` | PayPal **business (merchant)** sandbox REST app |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | same as `PAYPAL_CLIENT_ID` (public, used by checkout buttons) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | apex domain for tenant routing (`localhost:3000`, `fern.onrender.com`, `x.duckdns.org`) |

**No PayPal keys?** Leave the `DUMMY_*` placeholders — checkout runs in
simulated mode end-to-end (create + capture + order record) so judges can click
through without sandbox accounts. Drop in real sandbox keys and it uses
PayPal Orders API v2 + JS buttons with no code change.

## Database

Schema + open-demo RLS + public `store-assets` bucket: `supabase/schema.sql`.
Applied via session pooler:
`psql "host=aws-1-eu-west-3.pooler.supabase.com port=5432 dbname=postgres user=postgres.tieoxujfbrojeiqpneji" -f supabase/schema.sql`
(or paste into the Supabase dashboard SQL editor).

## CSV stock import

`GET /api/csv-template` downloads `fern-stock-template.csv`
(`name,price,image_url,description,stock`). Upload it in the seller dashboard —
rows are validated client-side, errors reported per line, then bulk-inserted.

## AI theme generation

`POST /api/ai/generate-theme {description, storeName}` → `ThemeJson`
(same schema as the template picker). Current provider is a **mock**
(keyword → template/colors); swap the route body for an LLM call later —
client and DB schema are unchanged. This satisfies the hackathon's AI-track
interface while keeping the build runnable offline.

## Agentic commerce: agents can shop

Every fern store is agent-buyable two ways (same PayPal checkout underneath):

1. **Remote MCP server** — `POST /api/mcp` (Streamable HTTP, `mcp-handler`).
   Tools: `get_store`, `list_products`, `search_products`, `create_order`,
   `pay_order`. Point any MCP client at `https://YOUR-DOMAIN/api/mcp`:
   ```json
   { "fern-shop": { "url": "https://YOUR-DOMAIN/api/mcp" } }
   ```
   Agent flow: `search_products` → `create_order` (stock-checked, PayPal order
   created) → buyer approves in PayPal → `pay_order` captures and records the
   `paid` order. Without PayPal keys both steps simulate end-to-end.
2. **WebMCP (browser agents)** — every storefront registers `search_products`
   (read-only), `add_to_cart`, and `checkout_cart` (consequential) via
   `document.modelContext` as a progressive enhancement. Test with
   `chrome://flags/#enable-webmcp-testing` + the MCP inspector extension.
   Agent-side payment uses the same PayPal flow, compatible with the
   [PayPal Agent Toolkit](https://github.com/paypal/agent-toolkit) / PayPal MCP
   server pattern.

## Sponsor integrations

| Sponsor | How fern uses it |
|---|---|
| PayPal + Agentic Commerce | Orders API v2 checkout + MCP/WebMCP agent shopping (above) |
| AG Grid | Seller dashboard products + orders tables: sort/filter/select (`ag-grid-react`) |
| Zapier | Per-store `webhook_url`: every `paid` order POSTs `order.paid` JSON (works with catch hooks) |
| Render | `render.yaml` Docker deploy (fallback demo URL `/s/<slug>`) |
| Postman | API collection for the demo video (to add at submission) |

## Deploy: EC2 + Route53 + Caddy (primary — one wildcard cert, unlimited tenants)

1. Route53: `A DOMAIN → elastic IP`, `A *.DOMAIN → same IP`. SG: `tcp:80,443` open.
2. EC2 instance role with `route53:ChangeResourceRecordSets` on the zone
   (Caddy DNS-01 needs no static AWS keys).
3. On the box: fill CONFIG in `deploy/ec2-user-data.sh`
   (or paste it as EC2 user-data), which writes `.env.prod` and runs
   `docker compose -f docker-compose.prod.yml up -d --build`.
   Caddy (`deploy/Caddy.Dockerfile` = stock Caddy + route53 plugin) issues
   **2 certs total** — apex + `*.DOMAIN` — and auto-renews. The Next
   middleware parses `Host: <slug>.DOMAIN` → store lookup → rewrite to `/s/<slug>`.

## Deploy: GCE + DuckDNS + Caddy (cheap alt, same wildcard model)

1. Reserve a static external IP, open firewall `tcp:80,443`.
2. Create `fernshop.duckdns.org` → static IP (DuckDNS dashboard).
3. On the VM: set env (`DUCKDNS_TOKEN`, app env), run `bash deploy/gce-startup.sh`.
   Caddy (duckdns-DNS-01 build) issues one `*.duckdns.org` cert; the Next
   middleware parses `Host: <slug>.domain` → store lookup → rewrite to `/s/<slug>`.

## Deploy: Render (fallback, path routing)

`render.yaml` (Docker). Wildcard `*.onrender.com` is not possible on the free
`onrender.com` domain, so the judged demo URL is `https://fern.onrender.com/s/<slug>` —
same code, subdomain logic activates automatically behind a custom domain.

## PayPal test flow (sandbox)

1. Seller creates store + products (apex UI).
2. Buyer opens storefront, adds to cart, clicks PayPal / simulated Pay button.
3. Order recorded in `orders` (`created` → `paid`), visible in seller dashboard.

## Settlement (who gets the money)

Two modes, per store:

1. **Platform settlement (current default)** — all payments land in the one
   PayPal business account (`PAYPAL_CLIENT_ID`). Per-store balances come from
   `orders WHERE status='paid'` (shown in the dashboard Settlement panel), and
   sellers are paid out to their `payout_email` (manual or via PayPal Payouts
   API later). Correct for the hackathon; reconciliation is exact.
2. **Direct settlement (production)** — once a seller completes PayPal merchant
   onboarding, store their `paypal_merchant_id` (dashboard Settlement panel).
   `create-order` then passes `payee.merchant_id` on the PayPal order, so money
   settles straight into the seller's account and never touches the platform.
   Platform fees can ride on the same order via `payment_instruction`.

## License

MIT
