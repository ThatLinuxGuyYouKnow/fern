# Demo filming script — Sunrise Fresh Market

The perfect path, rehearsed field-by-field. Every value below is typed,
clicked, or uploaded exactly as written — no improvisation, no dead ends.

**Business:** Sunrise Fresh Market — fresh groceries & pantry staples
**Template:** Sunrise Market (built for this business: deep market green
`#14532D`, sunrise amber `#F59E0B`, banner hero, compact price-forward grid)
**Listings file:** `demo/sunrise-fresh-market.csv` (8 products, images in
`public/demo/market/` — bundled in the repo, so they always load)

## Shot 1 — Create the store (Quick Start)

1. Open `/create?mode=quickstart`
2. **Store name:** `Sunrise Fresh Market`
   (slug auto-fills to `sunrise-fresh-market`)
3. Click **Generate from name** — logo becomes an `S` on the theme green
4. Under **Pick a look**, click **Sunrise Market**
   (live preview on the right switches to the grocery grid)
5. Click **⚡ Launch my store** → lands in the admin dashboard

## Shot 2 — Stock the shelves (CSV import)

1. In admin, click **Products**
2. Under **Bulk import via CSV**, choose `demo/sunrise-fresh-market.csv`
3. Expected on screen: "imported 8 products", grid fills with:
   Heirloom Tomatoes $4.99 · Free-Range Eggs $6.50 · Sourdough $5.25 ·
   Avocados $7.99 · Honey $11.50 · Cheddar $9.75 · Olive Oil $13.99 ·
   Basil $2.99 (stock 3 — highlighted as low stock)

## Shot 3 — The storefront

1. Click **Storefront** (or View store) — banner reads
   *"Fresh this morning, fair all day"*
2. Scroll the 8-product grid — all images, prices, and stock badges render
   (Basil shows "3 left")
3. Add to cart: **Heirloom Tomatoes ×1, Free-Range Eggs ×1, Sourdough ×1**
   — cart total **$16.74**
4. Check out with PayPal (sandbox buyer) — or, with dummy keys, the
   simulated checkout confirms the order

## Shot 4 — Back in admin

1. Click **Orders** — the paid order is listed, revenue updates
2. Click **Settings → Theme** to show the store can be restyled live
   (Sunrise Market is the selected preset)

## If a retake is needed

The slug is unique per store. For take 2, change the store name to
`Sunrise Fresh Market 2` (new slug) and repeat — the CSV imports the
same way every time.
