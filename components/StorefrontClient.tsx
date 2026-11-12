"use client";

import { useEffect, useRef, useState } from "react";
import type { Store, Product } from "@/lib/supabase";
import { dollars } from "@/lib/supabase";
import { FONT_STACKS, RADIUS, resolveStyle, textOn } from "@/lib/themes";

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

  const s = resolveStyle(theme);
  const radius = RADIUS[s.radius];
  const onPrimary = textOn(theme.primary);
  const onAccent = textOn(theme.accent);
  const isDark = s.hero === "split" || s.bg === "#0A0A0B" || s.bg === "#060B16";
  const heroProduct = products[0];
  const compact = s.density === "compact";

  const cardStyle: React.CSSProperties =
    s.card === "brutal"
      ? { background: s.surface, border: `2px solid ${s.ink}`, borderRadius: radius, boxShadow: `5px 5px 0 ${s.ink}` }
      : s.card === "bordered"
        ? { background: s.surface, border: `1px solid ${s.ink}30`, borderRadius: radius, boxShadow: s.font === "mono" ? `0 0 0 1px ${theme.accent}22, 0 6px 24px ${theme.accent}14` : undefined }
        : s.card === "flat"
          ? { background: "transparent", borderTop: `1px solid ${s.ink}45`, borderRadius: 0 }
          : { background: s.surface, borderRadius: radius, boxShadow: "0 10px 30px rgba(20,20,20,0.10)" };

  const btnStyle: React.CSSProperties =
    s.card === "brutal"
      ? { background: theme.accent, color: onAccent, border: `2px solid ${s.ink}`, borderRadius: radius, boxShadow: `3px 3px 0 ${s.ink}` }
      : { background: theme.primary, color: onPrimary, borderRadius: radius };

  const heroCta = (
    <a href="#shop" className="inline-block px-5 py-2.5 text-sm font-bold" style={s.hero === "centered" ? { background: theme.primary, color: onPrimary, borderRadius: radius } : { background: theme.accent, color: onAccent, borderRadius: radius }}>
      Shop the collection
    </a>
  );

  return (
    <main className="min-h-screen" style={{ background: s.bg, color: s.ink, fontFamily: FONT_STACKS[s.font] }}>
      {/* store bar */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
        {store.logo_url ? (
          <img src={store.logo_url} alt="" className="h-9 w-9 object-contain" style={{ borderRadius: radius }} />
        ) : (
          <span
            className="flex h-9 w-9 items-center justify-center text-sm font-bold"
            style={{ background: theme.primary, color: onPrimary, borderRadius: radius }}
            aria-hidden
          >
            {(store.name.trim()[0] || "F").toUpperCase()}
          </span>
        )}
        <span className="font-bold tracking-tight">{store.name}</span>
        <span className="text-[11px] uppercase tracking-[0.18em] opacity-50">powered by fern</span>
        {cart.length > 0 && (
          <a href="#fern-cart" className="ml-auto px-3 py-1.5 text-xs font-bold" style={{ background: theme.accent, color: onAccent, borderRadius: radius }}>
            Cart · {cart.reduce((n, l) => n + l.qty, 0)} · ${dollars(total)}
          </a>
        )}
      </div>

      {/* hero — treatment depends on preset */}
      {s.hero === "centered" && (
        <header className="mx-auto max-w-3xl px-6 pb-4 pt-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: theme.accent }}>{theme.heroSubtitle}</p>
          <h1 className={`mt-3 font-bold leading-[1.05] ${s.font === "serif" ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"}`}>{theme.heroTitle}</h1>
          <div className="mt-6">{heroCta}</div>
        </header>
      )}
      {s.hero === "banner" && (
        <header className="px-6 pb-2 pt-2">
          <div className="mx-auto max-w-6xl px-6 py-8" style={{ background: theme.primary, color: onPrimary, borderRadius: radius }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-70">{store.name}</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{theme.heroTitle}</h1>
            <p className="mt-1 opacity-80">{theme.heroSubtitle}</p>
            <div className="mt-5">{heroCta}</div>
          </div>
        </header>
      )}
      {s.hero === "split" && (
        <header className="px-6 pb-2 pt-2">
          <div className="mx-auto grid max-w-6xl overflow-hidden sm:grid-cols-2" style={{ background: theme.primary, color: onPrimary, borderRadius: radius }}>
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: theme.accent }}>{theme.heroSubtitle}</p>
              <h1 className="mt-3 text-4xl font-bold uppercase leading-[0.95] sm:text-6xl">{theme.heroTitle}</h1>
              <div className="mt-6">{heroCta}</div>
            </div>
            {heroProduct?.image_url ? (
              <img src={heroProduct.image_url} alt={heroProduct.name} className="h-56 w-full object-cover sm:h-full" />
            ) : (
              <div className="flex h-56 items-center justify-center text-sm opacity-60 sm:h-full" style={{ background: `${theme.accent}30` }}>New season loading</div>
            )}
          </div>
          <div className="mx-auto mt-3 max-w-6xl overflow-hidden whitespace-nowrap py-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ background: theme.accent, color: onAccent, borderRadius: radius }}>
            <span className="px-4">{Array(4).fill(`${theme.heroSubtitle}  ·  ${store.name}  ·  `).join("")}</span>
          </div>
        </header>
      )}
      {s.hero === "cover" && (
        <header className="relative overflow-hidden">
          {heroProduct?.image_url ? (
            <img src={heroProduct.image_url} alt={heroProduct.name} className="h-[52vh] w-full object-cover" />
          ) : (
            <div className="h-[52vh] w-full" style={{ background: theme.primary }} />
          )}
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-8 text-white">
            <div className="mx-auto w-full max-w-6xl">
              <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">{theme.heroTitle}</h1>
              <p className="mt-1 text-white/80">{theme.heroSubtitle}</p>
            </div>
          </div>
        </header>
      )}

      <div className={`mx-auto max-w-6xl px-6 ${compact ? "py-6" : "py-10"}`}>
        {error && <div className="mb-4 border border-red-400 bg-red-50 p-3 text-sm text-red-700" style={{ borderRadius: radius }}>{error}</div>}
        {receipt && <div className="mb-4 border border-green-500 bg-green-50 p-3 text-sm text-green-800" style={{ borderRadius: radius }}>{receipt}</div>}

        <div id="shop" className="flex items-baseline justify-between gap-3">
          <h2 className={`font-bold ${s.font === "mono" ? "text-sm uppercase tracking-[0.2em]" : "text-xl"}`}>
            {s.font === "mono" ? `Index — ${products.length} items` : "Shop the collection"}
          </h2>
          <span className="text-xs opacity-60">{products.filter((p) => p.stock > 0).length} in stock</span>
        </div>

        {products.length === 0 && <p className="mt-6 opacity-60">This store has no products yet.</p>}
        <div className={`mt-5 grid ${compact ? "gap-3 sm:grid-cols-3 lg:grid-cols-4" : s.density === "airy" ? "gap-8 sm:grid-cols-2" : "gap-5 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {products.map((p, i) => (
            <article key={p.id} className={compact ? "p-3" : "p-4"} style={cardStyle}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className={`w-full object-cover ${compact ? "h-32" : "h-52"}`} style={{ borderRadius: s.card === "flat" ? 0 : radius }} />
              ) : (
                <div className={`flex w-full items-center justify-center text-sm opacity-50 ${compact ? "h-32" : "h-52"}`} style={{ background: `${s.ink}10`, borderRadius: s.card === "flat" ? 0 : radius }}>no image</div>
              )}
              <div className="mt-3 flex items-start justify-between gap-2">
                <h3 className={`font-semibold leading-snug ${s.font === "mono" ? "text-sm" : ""}`}>
                  {s.card === "flat" && s.font === "mono" && <span className="mr-1.5 opacity-50">{String(i + 1).padStart(2, "0")}</span>}
                  {p.name}
                </h3>
                {p.stock <= 0 ? (
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "#dc2626", color: "#fff", borderRadius: radius }}>Sold out</span>
                ) : compact ? (
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: `${theme.accent}30`, color: s.ink, borderRadius: radius }}>{p.stock} left</span>
                ) : null}
              </div>
              {!compact && p.description && <p className="mt-1 text-sm leading-relaxed opacity-65">{p.description}</p>}
              <div className="mt-2 flex items-center justify-between">
                <span className={`font-bold ${compact ? "text-base" : "text-lg"}`} style={{ color: s.card === "brutal" || s.card === "flat" ? s.ink : theme.accent }}>${dollars(p.price_cents)}</span>
                {!compact && <span className="text-xs opacity-55">{p.stock > 0 ? `${p.stock} in stock` : "out of stock"}</span>}
              </div>
              <button onClick={() => add(p)} disabled={p.stock <= 0}
                className="mt-3 w-full px-3 py-2.5 text-sm font-bold disabled:opacity-40"
                style={btnStyle}>
                Add to cart
              </button>
            </article>
          ))}
        </div>

        {cart.length > 0 && (
          <aside id="fern-cart" className="mt-10 p-5" style={{ background: s.surface, border: `1px solid ${s.ink}30`, borderRadius: radius, color: s.ink }}>
            <h2 className="font-bold">Cart — ${dollars(total)}</h2>
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
                className="mt-4 w-full px-4 py-3 font-bold disabled:opacity-50" style={btnStyle}>
                {checkingOut ? "Processing…" : "Pay now (simulated — no PayPal keys yet)"}
              </button>
            ) : (
              <div ref={buttonsRef} className="mt-4" />
            )}
          </aside>
        )}

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-2 border-t pt-5 text-xs opacity-60" style={{ borderColor: `${s.ink}30` }}>
          <span className="font-bold" style={{ color: s.ink }}>{store.name}</span>
          <span>{theme.heroSubtitle} · powered by fern</span>
          {isDark && <span className="uppercase tracking-[0.2em]">Est. online · ships worldwide</span>}
        </footer>
      </div>
    </main>
  );
}
