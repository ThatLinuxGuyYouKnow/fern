"use client";

import { useEffect, useRef, useState } from "react";
import type { Store, Product } from "@/lib/supabase";
import { dollars } from "@/lib/supabase";

type CartLine = { id: string; name: string; price_cents: number; qty: number };

export default function StorefrontClient({
  store,
  products,
  paypalClientId,
}: {
  store: Store;
  products: Product[];
  paypalClientId: string;
}) {
  const theme = store.theme_json;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const dummy = !paypalClientId || paypalClientId.startsWith("DUMMY");

  const total = cart.reduce((s, l) => s + l.price_cents * l.qty, 0);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  // WebMCP: expose storefront tools to browser agents (progressive enhancement;
  // active only in browsers with document.modelContext, e.g. Chrome w/ flag).
  useEffect(() => {
    const doc = document as DocumentWithModelContext;
    if (!doc.modelContext) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        await doc.modelContext!.registerTool(
          {
            name: "search_products",
            description: `Search ${store.name} products by keyword. Returns id, name, price in USD, stock.`,
            inputSchema: {
              type: "object",
              properties: { query: { type: "string", description: "keyword" } },
              required: ["query"],
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: async ({ query }) => {
              const q = String(query ?? "").toLowerCase();
              const hits = products
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q)
                )
                .map((p) => ({
                  id: p.id,
                  name: p.name,
                  price_usd: dollars(p.price_cents),
                  stock: p.stock,
                }));
              return JSON.stringify(hits);
            },
          },
          { signal: ctrl.signal }
        );
        await doc.modelContext!.registerTool(
          {
            name: "add_to_cart",
            description: `Add a product of ${store.name} to the shopping cart.`,
            inputSchema: {
              type: "object",
              properties: {
                product_id: { type: "string", description: "product id from search_products" },
                qty: { type: "number", description: "quantity, default 1" },
              },
              required: ["product_id"],
            },
            execute: async ({ product_id, qty }) => {
              const p = products.find((x) => x.id === String(product_id));
              if (!p) return `product not found: ${product_id}`;
              const n = Math.max(1, Number(qty) || 1);
              setCart((c) => {
                const ex = c.find((l) => l.id === p.id);
                if (ex) return c.map((l) => (l.id === p.id ? { ...l, qty: l.qty + n } : l));
                return [...c, { id: p.id, name: p.name, price_cents: p.price_cents, qty: n }];
              });
              return `added ${n} × ${p.name} to cart`;
            },
          },
          { signal: ctrl.signal }
        );
        await doc.modelContext!.registerTool(
          {
            name: "checkout_cart",
            description: `Pay for the current cart at ${store.name} (starts PayPal checkout).`,
            inputSchema: { type: "object", properties: {} },
            annotations: { consequentialHint: true },
            execute: async () => {
              if (cartRef.current.length === 0) return "cart is empty";
              if (dummy) {
                await dummyCheckout();
                return "simulated checkout started (no PayPal keys configured)";
              }
              document.getElementById("fern-cart")?.scrollIntoView({ behavior: "smooth" });
              return "cart is ready below — buyer completes payment with the PayPal buttons (user confirmation required)";
            },
          },
          { signal: ctrl.signal }
        );
      } catch {
        /* WebMCP unavailable — page works normally */
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function add(p: Product) {
    setCart((c) => {
      const ex = c.find((l) => l.id === p.id);
      if (ex) return c.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { id: p.id, name: p.name, price_cents: p.price_cents, qty: 1 }];
    });
  }

  // Real PayPal buttons (only when real client id configured)
  useEffect(() => {
    if (dummy || cart.length === 0 || !buttonsRef.current) return;
    let cancelled = false;
    (async () => {
      const { loadScript } = await import("@paypal/paypal-js");
      const pp = await loadScript({ clientId: paypalClientId, currency: "USD" });
      if (cancelled || !pp?.Buttons || !buttonsRef.current) return;
      buttonsRef.current.innerHTML = "";
      await pp.Buttons({
        createOrder: async () => {
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store_id: store.id, items: cart }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || "order failed");
          (window as unknown as { __fernDbOrder?: string }).__fernDbOrder = j.order.id;
          return j.paypal_order_id as string;
        },
        onApprove: async () => {
          const dbId = (window as unknown as { __fernDbOrder?: string }).__fernDbOrder;
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: dbId }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || "capture failed");
          setReceipt(`Paid $${dollars(total)} — thank you!`);
          setCart([]);
        },
        onError: (e) => setError(e instanceof Error ? e.message : "paypal error"),
      }).render(buttonsRef.current);
    })().catch((e) => setError(e instanceof Error ? e.message : "paypal load failed"));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dummy, cart.length === 0]);

  // Dummy checkout: simulated capture so demo works without PayPal keys
  async function dummyCheckout() {
    setCheckingOut(true);
    setError(null);
    try {
      const r1 = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: store.id, items: cart }),
      });
      const j1 = await r1.json();
      if (!r1.ok) throw new Error(j1.error || "order failed");
      const r2 = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: j1.order.id }),
      });
      const j2 = await r2.json();
      if (!r2.ok) throw new Error(j2.error || "capture failed");
      setReceipt(`Order simulated — $${dollars(total)} (add PayPal sandbox keys for real payments)`);
      setCart([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  const grid = theme.template === "grid";
  const bold = theme.template === "bold";

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <header style={{ background: theme.primary }} className="px-6 py-10 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          {store.logo_url && <img src={store.logo_url} alt="" className="h-12 w-12 rounded bg-white object-contain p-1" />}
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70">powered by fern</p>
            <h1 className={bold ? "text-5xl font-black" : "text-3xl font-bold"}>{theme.heroTitle}</h1>
            <p className="mt-1 opacity-80">{theme.heroSubtitle}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {receipt && <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">{receipt}</div>}

        {products.length === 0 && <p className="text-neutral-500">This store has no products yet.</p>}
        <div className={grid ? "grid gap-4 sm:grid-cols-3" : "grid gap-6 sm:grid-cols-2"}>
          {products.map((p) => (
            <article key={p.id} className={`rounded-lg border p-4 ${bold ? "shadow-lg" : ""}`}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="h-44 w-full rounded object-cover" />
              ) : (
                <div className="flex h-44 w-full items-center justify-center rounded bg-neutral-100 text-neutral-400">no image</div>
              )}
              <h3 className="mt-3 font-semibold">{p.name}</h3>
              <p className="text-sm text-neutral-600">{p.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold">${dollars(p.price_cents)}</span>
                <span className="text-xs text-neutral-500">{p.stock > 0 ? `${p.stock} in stock` : "out of stock"}</span>
              </div>
              <button onClick={() => add(p)} disabled={p.stock <= 0}
                className="mt-2 w-full rounded px-3 py-2 text-white disabled:opacity-40"
                style={{ background: theme.primary }}>
                Add to cart
              </button>
            </article>
          ))}
        </div>

        {cart.length > 0 && (
          <aside id="fern-cart" className="mt-8 rounded-lg border p-5">
            <h2 className="font-semibold">Cart — ${dollars(total)}</h2>
            <ul className="mt-2 text-sm">
              {cart.map((l) => (
                <li key={l.id} className="flex justify-between py-1">
                  <span>{l.name} × {l.qty}</span>
                  <span>${dollars(l.price_cents * l.qty)}</span>
                </li>
              ))}
            </ul>
            {dummy ? (
              <button onClick={dummyCheckout} disabled={checkingOut}
                className="mt-4 w-full rounded bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
                {checkingOut ? "Processing…" : "Pay now (simulated — no PayPal keys yet)"}
              </button>
            ) : (
              <div ref={buttonsRef} className="mt-4" />
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
