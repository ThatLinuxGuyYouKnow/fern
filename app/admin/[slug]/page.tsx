"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, type ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { supabase, type Store, type Product, type Order, dollars } from "@/lib/supabase";
import { validateCsvRecord, normalizeHeader, type CsvRow } from "@/lib/csv";
import { TEMPLATES } from "@/lib/themes";
import TemplatePreview from "@/components/TemplatePreview";
import type { ThemeJson } from "@/lib/supabase";

ModuleRegistry.registerModules([AllCommunityModule]);

const CARD = "fern-card p-5 sm:p-6";

type Tab = "home" | "products" | "orders" | "settings" | "soon";

function timeAgo(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  return `${Math.round(h / 24)} day${Math.round(h / 24) === 1 ? "" : "s"} ago`;
}

const ICONS: Record<string, JSX.Element> = {
  home: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10.5 12 3l9 7.5V21H3z" /><path d="M9 21v-6h6v6" /></svg>),
  storefront: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16l-1.5 13h-13z" /><path d="M8 7a4 4 0 0 1 8 0" /></svg>),
  products: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /></svg>),
  orders: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m8 12 3 3 5-6" /></svg>),
  customers: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5 6.5-5s5.7 1.5 6.5 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 15c2.8.2 4.7 1.6 5.5 4.5" /></svg>),
  analytics: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>),
  marketing: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11v3l4 1 2 5h2l-1-5 8-4-8-3-2 4z" /><circle cx="18" cy="6" r="2" /></svg>),
  discounts: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12v8H4V4h8" /><path d="m19 5-9 9" /><circle cx="7.5" cy="7.5" r="1" /><circle cx="16.5" cy="16.5" r="1" /></svg>),
  settings: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" /></svg>),
  bell: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>),
  search: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg>),
  plus: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>),
  swatch: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10" r="1" fill="currentColor" /><circle cx="14" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="14" r="1" fill="currentColor" /><path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 1.5-2-.5-1.5.5-3 2-3H18a3 3 0 0 0 3-3c0-4-4-10-9-10z" /></svg>),
  chart: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>),
  globe: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" /></svg>),
  check: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m4 12 5 5L20 7" /></svg>),
};

export default function AdminPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>("home");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setError(null);
    const { data: s, error: e1 } = await supabase.from("stores").select("*").eq("slug", slug).single();
    if (e1 || !s) { setError("store not found"); return; }
    setStore(s);
    const { data: p } = await supabase.from("products").select("*").eq("store_id", s.id).order("position");
    setProducts(p ?? []);
    const { data: o } = await supabase.from("orders").select("*").eq("store_id", s.id).order("created_at", { ascending: false }).limit(50);
    setOrders(o ?? []);
  }
  useEffect(() => { load(); }, [slug]);

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const proto = root.startsWith("localhost") ? "http" : "https";
  const storeUrl = `/s/${slug}`;
  const subUrl = `${proto}://${slug}.${root}`;
  const paypalLive = !(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "DUMMY").startsWith("DUMMY");

  const paidTotal = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total_cents, 0);

  const nav: { id: Tab | "storefront"; label: string; soon?: boolean }[] = [
    { id: "home", label: "Home" },
    { id: "storefront", label: "Storefront" },
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "settings", label: "Settings" },
  ];
  const navSoon = [
    { label: "Customers" }, { label: "Analytics" }, { label: "Marketing" }, { label: "Discounts" },
  ];

  if (error && !store)
    return <main className="mx-auto max-w-3xl px-6 py-12"><p className="font-medium text-red-700">{error}</p></main>;

  return (
    <div className="flex min-h-screen text-fernink">
      {/* Sidebar — deep fern panel, sticky full height */}
      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col bg-gradient-to-b from-[#0e3520] via-ferndeep to-[#071c10] text-white md:flex">
        <a href="/" className="flex items-center gap-2.5 px-6 pb-1 pt-7 font-display text-[28px] font-semibold leading-none tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fern-200 text-ferndeep shadow-glow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 7 4 11 4 15a8 8 0 0 0 16 0c0-4-3-8-8-13zm0 18a6 6 0 0 1-6-6c0-.5.1-1 .2-1.5C8 14 10 16 12 20c2-4 4-6 5.8-7.5.1.5.2 1 .2 1.5a6 6 0 0 1-6 6z" /></svg>
          </span>
          fern
        </a>
        <a href="/admin" className="px-6 pb-6 pt-2 text-xs font-medium text-white/50 transition hover:text-white">← All stores</a>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3.5">
          {nav.map((n) => {
            const active = tab === n.id;
            const cls = `flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${active ? "bg-white/[0.13] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-white/65 hover:bg-white/[0.06] hover:text-white"}`;
            const icon = <span className={active ? "text-fern-200" : "text-white/45"}>{ICONS[n.id] ?? ICONS.home}</span>;
            if (n.id === "storefront")
              return <a key="storefront" href={storeUrl} target="_blank" className={cls}>{icon}{n.label}<span className="ml-auto text-[10px] text-white/40">↗</span></a>;
            return <button key={n.id} onClick={() => setTab(n.id as Tab)} className={cls}>{icon}{n.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-fern-200" />}</button>;
          })}
          <p className="px-3.5 pb-1.5 pt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Coming soon</p>
          {navSoon.map((n) => (
            <span key={n.label} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-white/35">
              <span className="text-white/30">{ICONS[n.label.toLowerCase()]}</span>{n.label}
            </span>
          ))}
        </nav>
        <div className="p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> Store is live</p>
            <a href={storeUrl} target="_blank" className="mt-1 block truncate text-xs text-white/55 underline-offset-2 hover:underline">{subUrl.replace(/^https?:\/\//, "")}</a>
          </div>
        </div>
      </aside>

      {/* Main column — fluid width, no centred max-w gutter */}
      <div className="min-w-0 flex-1">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#dde6cf]/80 bg-[#f6f8f0]/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="flex max-w-2xl flex-1 items-center gap-2.5 rounded-full border border-[#d8e2c6] bg-white px-4 py-2.5 shadow-sm transition focus-within:border-fern-800/50 focus-within:ring-4 focus-within:ring-fern-800/10">
            <span className="text-[#8a9a7d]">{ICONS.search}</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setTab("products"); }}
              placeholder="Search everything in Fern…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
            {query && <button onClick={() => setQuery("")} className="text-xs font-semibold text-fern-800 hover:underline">Clear</button>}
          </div>
          <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
            <a href={storeUrl} target="_blank" className="fern-btn-ghost hidden !px-4 !py-2 text-xs lg:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> View store</a>
            <button aria-label="Notifications" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8e2c6] bg-white text-[#5b6b58] shadow-sm transition hover:text-fern-800">{ICONS.bell}</button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fern-800 to-fern-950 text-xs font-bold text-white shadow-glow">
              {(store?.name ?? slug).slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden text-sm font-semibold sm:block">{store?.name ?? slug}</span>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-2 overflow-x-auto border-b border-[#dde6cf] bg-white/70 px-4 py-2.5 backdrop-blur md:hidden">
          {(["home", "products", "orders", "settings"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize ${tab === t ? "bg-fern-800 font-semibold text-white shadow-glow" : "border border-[#d8e2c6] bg-white"}`}>
              {t}
            </button>
          ))}
          <a href={storeUrl} target="_blank" className="rounded-full border border-[#d8e2c6] bg-white px-4 py-1.5 text-sm">Storefront</a>
        </nav>

        <main className="w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {error && <div className="mb-5 flex gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-sm"><span aria-hidden>⚠</span>{error}</div>}
          {notice && <div className="mb-5 flex gap-2.5 rounded-2xl border border-fern-800/25 bg-fern-50 px-4 py-3 text-sm font-medium text-fern-900 shadow-sm"><span className="text-fern-800">{ICONS.check}</span>{notice}</div>}

          {tab === "home" && store && (
            <Overview
              store={store} products={products} orders={orders}
              storeUrl={storeUrl} subUrl={subUrl} paypalLive={paypalLive} paidTotal={paidTotal}
              go={(t) => setTab(t)}
            />
          )}
          {tab === "products" && store && (
            <ProductsTab store={store} products={products} query={query} reload={load} notify={setNotice} fail={setError} />
          )}
          {tab === "orders" && (
            <OrdersTab orders={orders} paidTotal={paidTotal} />
          )}
          {tab === "settings" && store && (
            <SettingsTab store={store} subUrl={subUrl} reload={load} notify={setNotice} fail={setError} />
          )}
          {tab === "soon" && (
            <div className="fern-card p-12 text-center text-neutral-500">
              <p className="font-display text-2xl font-semibold text-fernink">Coming soon</p>
              <p className="mt-1 text-sm">This section is on the roadmap — Products, Orders and Settings are live today.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ================= Overview (Home) ================= */

function Overview({ store, products, orders, storeUrl, subUrl, paypalLive, paidTotal, go }: {
  store: Store; products: Product[]; orders: Order[];
  storeUrl: string; subUrl: string; paypalLive: boolean; paidTotal: number;
  go: (t: Tab) => void;
}) {
  const checks = [
    { label: products.length > 0 ? "Storefront published" : "Add your first product", done: products.length > 0 },
    { label: paypalLive ? "Payment methods active" : "Simulated payments (add PayPal keys)", done: paypalLive },
    { label: "Domain connected", done: true },
  ];
  const activity: { title: string; sub: string }[] = [];
  orders.slice(0, 2).forEach((o) =>
    activity.push({ title: `New order · ${o.status}`, sub: `$${dollars(o.total_cents)} · ${timeAgo(o.created_at)}` }));
  products.slice(0, 2).forEach((p) =>
    activity.push({ title: "Product published", sub: `${p.name} · $${dollars(p.price_cents)}` }));
  if (activity.length === 0)
    activity.push({ title: "Store created", sub: "Add your first product to get going" });

  const quick = [
    { icon: ICONS.plus, title: "Add product", sub: "List a new product", fn: () => go("products") },
    { icon: ICONS.swatch, title: "Edit theme", sub: "Customize your store's look", fn: () => go("settings") },
    { icon: ICONS.chart, title: "View analytics", sub: `$${dollars(paidTotal)} paid to date`, fn: () => go("orders") },
    { icon: ICONS.globe, title: "Manage domains", sub: "Connect or buy a domain", fn: () => go("settings") },
  ];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="flex flex-col justify-center py-2">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-fern-800"><span className="h-1.5 w-1.5 rounded-full bg-fern-800" /> Welcome back, {store.name}</p>
            <h1 className="mt-3 font-display text-[42px] font-semibold leading-[1.04] tracking-tight text-fern-950 sm:text-5xl">Your store,<br />your way.</h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#5b6b58]">Build, customize, and launch your online store — all in one place.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => go("settings")} className="fern-btn-primary !px-6 !py-3">Customize your store →</button>
              <a href={storeUrl} target="_blank" className="fern-btn-ghost !px-6 !py-3">View store</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-2 text-sm">
              <span><strong className="tnum font-display text-xl font-semibold text-fern-950">{products.length}</strong> <span className="text-[#5b6b58]">products</span></span>
              <span><strong className="tnum font-display text-xl font-semibold text-fern-950">{orders.length}</strong> <span className="text-[#5b6b58]">orders</span></span>
              <span><strong className="tnum font-display text-xl font-semibold text-fern-950">${dollars(paidTotal)}</strong> <span className="text-[#5b6b58]">paid out</span></span>
            </div>
          </div>
          <div className="rounded-[20px] border border-fern-800/15 bg-gradient-to-br from-fern-100 via-[#f2f7e7] to-cream p-6 shadow-card">
            <p className="font-jakarta text-[15px] font-bold text-fern-950">Your store is ready!</p>
            <a href={storeUrl} target="_blank" className="mt-0.5 inline-block break-all text-xs font-medium text-fern-800 underline decoration-fern-800/30 underline-offset-2 hover:decoration-fern-800">{subUrl.replace(/^https?:\/\//, "")} ⧉</a>
            <ul className="mt-4 space-y-2.5 border-t border-fern-900/10 pt-4 text-sm">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-fern-800 text-white" : "bg-black/10 text-white"}`}><span className="[&>svg]:h-3 [&>svg]:w-3">{ICONS.check}</span></span><span className={c.done ? "text-fern-950" : "text-neutral-500"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-jakarta text-base font-bold text-fern-950">Your storefront</h2>
              <p className="text-xs text-[#7a8a72]">Live preview — exactly what customers see</p>
            </div>
            <button onClick={() => go("settings")} className="fern-btn-ghost !px-4 !py-2 text-xs">Edit theme</button>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#e0e8d0] bg-neutral-50 shadow-inner">
            <iframe title="storefront preview" src={storeUrl} className="h-[480px] w-full bg-white" loading="lazy" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className={CARD}>
          <h3 className="font-jakarta text-sm font-bold text-fern-950">Quick actions</h3>
          <div className="mt-3.5 space-y-2">
            {quick.map((q) => (
              <button key={q.title} onClick={q.fn} className="group flex w-full items-center gap-3 rounded-2xl border border-[#e6edda] p-3.5 text-left transition hover:border-fern-800/35 hover:bg-fern-50 hover:shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fern-100 text-fern-800 transition group-hover:bg-fern-800 group-hover:text-white">{q.icon}</span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-fern-950">{q.title}</span><span className="block truncate text-xs text-[#7a8a72]">{q.sub}</span></span>
                <span className="ml-auto text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-fern-800">→</span>
              </button>
            ))}
          </div>
        </div>
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <h3 className="font-jakarta text-sm font-bold text-fern-950">Recent activity</h3>
            <button onClick={() => go("orders")} className="text-xs font-semibold text-fern-800 hover:underline">View all →</button>
          </div>
          <ul className="mt-2 divide-y divide-[#eef2e2]">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-3 text-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fern-50 text-fern-800">{ICONS.orders}</span>
                <span className="min-w-0"><span className="block truncate font-medium text-fern-950">{a.title}</span><span className="block truncate text-xs text-[#7a8a72]">{a.sub}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[20px] bg-gradient-to-br from-fern-900 to-fern-950 p-6 text-white shadow-lift">
          <p className="font-jakarta text-sm font-bold">Need help?</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">CSV template, PayPal sandbox, and agent shopping docs are in the README.</p>
          <a href="/api/csv-template" className="mt-4 inline-block rounded-full bg-fern-200 px-4 py-2 text-xs font-bold text-fern-950 transition hover:bg-white">
            Get stock template
          </a>
        </div>
      </div>
    </div>
  );
}

/* ================= Products ================= */

function ProductsTab({ store, products, query, reload, notify, fail }: {
  store: Store; products: Product[]; query: string;
  reload: () => void; notify: (s: string) => void; fail: (s: string) => void;
}) {
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pStock, setPStock] = useState("10");
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [csvReport, setCsvReport] = useState<string[] | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gridApi, setGridApi] = useState<any>(null);

  useEffect(() => { gridApi?.setGridOption?.("quickFilterText", query); }, [query, gridApi]);

  const cols = useMemo<ColDef<Product>[]>(() => [
    { field: "name", headerName: "Name", flex: 2, minWidth: 180, filter: true, sortable: true, cellClass: "font-medium" },
    { headerName: "Price", valueGetter: (p) => (p.data ? `$${dollars(p.data.price_cents)}` : ""), width: 120, sortable: true, cellClass: "tnum font-semibold" },
    { field: "stock", headerName: "Stock", width: 110, sortable: true, cellClass: "tnum",
      cellStyle: (p) => (typeof p.value === "number" && p.value <= 5 ? { color: "#b45309", fontWeight: 700 } : undefined) },
    { field: "description", headerName: "Description", flex: 3, minWidth: 220, filter: true, cellClass: "text-neutral-500" },
  ], []);

  async function uploadImage(f: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", f);
    fd.append("slug", store.slug);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "upload failed");
    return j.url as string;
  }

  async function addProduct() {
    setSaving(true);
    try {
      const price = Number(pPrice);
      if (!pName.trim() || !Number.isFinite(price) || price < 0) throw new Error("name + valid price required");
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          products: [{ name: pName.trim(), price_cents: Math.round(price * 100), image_url: pImg.trim() || null, description: pDesc.trim(), stock: parseInt(pStock || "0", 10) || 0 }],
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "save failed");
      setPName(""); setPPrice(""); setPImg(""); setPDesc(""); setPStock("10");
      notify("Product added");
      reload();
    } catch (e) { fail(e instanceof Error ? e.message : "save failed"); }
    finally { setSaving(false); }
  }

  async function handleCsv(f: File) {
    setCsvReport(null);
    setCsvBusy(true);
    Papa.parse<Record<string, string>>(f, {
      header: true, skipEmptyLines: true, encoding: "UTF-8",
      transformHeader: normalizeHeader,
      complete: async (results) => {
        try {
          const rows: CsvRow[] = [];
          const errs: string[] = [];
          results.data.forEach((r, i) => {
            const { row, error } = validateCsvRecord(r, i + 2);
            if (row) rows.push(row); else if (error) errs.push(error);
          });
          if (rows.length === 0) { setCsvReport(errs.length ? errs : ["no valid rows found — check the template headers: name,price,image_url,description,stock"]); return; }
          const res = await fetch("/api/products", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store_id: store.id, products: rows }),
          });
          const j = await res.json();
          if (!res.ok) { fail(j.error || "import failed"); return; }
          setCsvReport([
            `imported ${rows.length} product${rows.length === 1 ? "" : "s"}`,
            ...errs.slice(0, 10),
            ...(errs.length > 10 ? [`…plus ${errs.length - 10} more skipped rows`] : []),
          ]);
          reload();
        } finally { setCsvBusy(false); }
      },
      error: (e) => { setCsvBusy(false); setCsvReport([`could not read file: ${e.message}`]); },
    });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        <div className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-[26px] font-semibold leading-tight text-fern-950">Products <span className="tnum ml-1 align-middle font-sans text-xs font-bold text-fern-800 bg-fern-100 rounded-full px-2.5 py-1">{products.length}</span></h1>
              <p className="mt-0.5 text-xs text-[#7a8a72]">Select a row to manage it · low stock (≤5) is highlighted</p>
            </div>
            <button
              onClick={async () => {
                if (!selectedId) return;
                await fetch(`/api/products?id=${selectedId}`, { method: "DELETE" });
                setSelectedId(null); notify("Product deleted"); reload();
              }}
              disabled={!selectedId}
              className="rounded-full border border-red-200 bg-red-50/60 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
              Delete selected
            </button>
          </div>
          <div className="ag-theme-quartz mt-4" style={{ height: 520 }}>
            <AgGridReact<Product>
              rowData={products} columnDefs={cols} rowSelection="single"
              onGridReady={(e) => { setGridApi(e.api); e.api.setGridOption("quickFilterText", query); }}
              onSelectionChanged={(e) => setSelectedId(e.api.getSelectedRows()[0]?.id ?? null)}
            />
          </div>
          {products.length === 0 && <p className="mt-3 text-sm text-neutral-500">No products yet — add your first one on the right, or bulk-import below.</p>}
        </div>
        <div className={CARD}>
          <h2 className="font-jakarta text-base font-bold text-fern-950">Bulk import via CSV</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#5b6b58]">
            <a href="/api/csv-template" className="font-semibold text-fern-800 underline decoration-fern-800/30 underline-offset-2 hover:decoration-fern-800">Download the template CSV</a>, fill it with your stock, then upload it here.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-[#b9cda0] bg-fern-50/60 px-4 py-4">
            <input type="file" accept=".csv" disabled={csvBusy} className="fern-file"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleCsv(f); }} />
          </div>
          {csvBusy && <p className="mt-3 text-sm text-neutral-500">Importing…</p>}
          {csvReport && <ul className="mt-3 space-y-1 rounded-2xl bg-fern-50 px-4 py-3 text-sm text-fern-950">{csvReport.map((r, i) => <li key={i}>{r}</li>)}</ul>}
        </div>
      </div>
      <div className={`${CARD} xl:sticky xl:top-24`}>
        <h2 className="font-jakarta text-base font-bold text-fern-950">Add a product</h2>
        <p className="mt-0.5 text-xs text-[#7a8a72]">It goes live on your storefront instantly.</p>
        <div className="mt-4 space-y-3.5">
          <div><label className="fern-label" htmlFor="p-name">Name</label><input id="p-name" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Shea Butter 250g" className="fern-input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="fern-label" htmlFor="p-price">Price (USD)</label><input id="p-price" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="12.50" inputMode="decimal" className="fern-input tnum" /></div>
            <div><label className="fern-label" htmlFor="p-stock">Stock</label><input id="p-stock" value={pStock} onChange={(e) => setPStock(e.target.value)} placeholder="10" inputMode="numeric" className="fern-input tnum" /></div>
          </div>
          <div><label className="fern-label" htmlFor="p-desc">Description</label><textarea id="p-desc" value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="What makes it special?" rows={3} className="fern-input resize-none" /></div>
          <div>
            <label className="fern-label" htmlFor="p-img">Image URL</label>
            <input id="p-img" value={pImg} onChange={(e) => setPImg(e.target.value)} placeholder="https://… (or upload below)" className="fern-input" />
            <input type="file" accept="image/*" className="fern-file mt-2.5" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              try { setPImg(await uploadImage(f)); } catch (err) { fail(err instanceof Error ? err.message : "upload failed"); }
            }} />
            {pImg && <img src={pImg} alt="" className="mt-3 h-36 w-full rounded-2xl border border-[#e0e8d0] object-cover" />}
          </div>
          <button onClick={addProduct} disabled={saving} className="fern-btn-primary w-full !py-3">
            {saving ? "Saving…" : "Add product"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Orders ================= */

function OrdersTab({ orders, paidTotal }: { orders: Order[]; paidTotal: number }) {
  const cols = useMemo<ColDef<Order>[]>(() => [
    { field: "status", headerName: "Status", width: 130, filter: true, sortable: true, cellClass: "font-semibold capitalize" },
    { headerName: "Total", valueGetter: (p) => (p.data ? `$${dollars(p.data.total_cents)} ${p.data.currency}` : ""), width: 150, sortable: true, cellClass: "tnum font-semibold" },
    { headerName: "Items", valueGetter: (p) => (p.data ? p.data.items.map((i) => `${i.name}×${i.qty}`).join(", ") : ""), flex: 2, minWidth: 220, cellClass: "text-neutral-500" },
    { headerName: "When", valueGetter: (p) => (p.data ? new Date(p.data.created_at).toLocaleString() : ""), width: 210, sortable: true, cellClass: "tnum text-neutral-500" },
  ], []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[26px] font-semibold text-fern-950">Orders</h1>
        <p className="mt-0.5 text-sm text-[#7a8a72]">Revenue and fulfilment at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Revenue (paid)", `$${dollars(paidTotal)}`], ["Orders", String(orders.length)], ["Paid", String(orders.filter((o) => o.status === "paid").length)]].map(([k, v], i) => (
          <div key={k} className={i === 0 ? "rounded-[20px] bg-gradient-to-br from-fern-900 to-fern-950 p-6 text-white shadow-lift" : `${CARD}`}>
            <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${i === 0 ? "text-white/55" : "text-[#7a8a72]"}`}>{k}</p>
            <p className="tnum mt-2 font-display text-[34px] font-semibold leading-none">{v}</p>
          </div>
        ))}
      </div>
      <div className={CARD}>
        <h2 className="font-jakarta text-base font-bold text-fern-950">Orders <span className="tnum ml-1 rounded-full bg-fern-100 px-2.5 py-1 align-middle font-sans text-xs font-bold text-fern-800">{orders.length}</span></h2>
        <div className="ag-theme-quartz mt-4">
          <AgGridReact<Order> rowData={orders} columnDefs={cols} domLayout="autoHeight" />
        </div>
        {orders.length === 0 && <p className="mt-3 text-sm text-neutral-500">No orders yet — share your store link to make the first sale.</p>}
      </div>
    </div>
  );
}

/* ================= Settings (theme, settlement, domains, automation) ================= */

function SettingsTab({ store, subUrl, reload, notify, fail }: {
  store: Store; subUrl: string; reload: () => void;
  notify: (s: string) => void; fail: (s: string) => void;
}) {
  const [theme, setTheme] = useState<ThemeJson>(store.theme_json);
  const [payoutEmail, setPayoutEmail] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("webhook_url,payout_email,paypal_merchant_id").eq("id", store.id).single();
      const t = data as { webhook_url?: string; payout_email?: string; paypal_merchant_id?: string } | null;
      setWebhookUrl(t?.webhook_url ?? "");
      setPayoutEmail(t?.payout_email ?? "");
      setMerchantId(t?.paypal_merchant_id ?? "");
    })();
  }, [store.id]);

  async function save(patch: Record<string, unknown>, msg: string) {
    const { error } = await supabase.from("stores").update(patch).eq("id", store.id);
    if (error) fail(error.message);
    else { notify(msg); reload(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[26px] font-semibold text-fern-950">Settings</h1>
        <p className="mt-0.5 text-sm text-[#7a8a72]">Theme, domains, settlement and automation for {store.name}.</p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className={CARD}>
        <h2 className="font-jakarta text-base font-bold text-fern-950">Theme</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const active = theme.template === t.theme.template && theme.primary === t.theme.primary && theme.style?.bg === t.theme.style?.bg;
            return (
              <button key={t.name} onClick={() => setTheme(t.theme)}
                className={`rounded-2xl border p-2 text-left transition hover:shadow-card ${active ? "border-fern-800 ring-2 ring-fern-800/25" : "border-[#e0e8d0]"}`}>
                <TemplatePreview theme={t.theme} storeName={t.name} />
                <span className="mt-1.5 block px-1 pb-0.5 text-xs font-semibold text-fern-950">{t.name}{active ? " ✓" : ""}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#7a8a72]">Picking a preset replaces layout, fonts and colours. Editing the brand colour below keeps the preset layout.</p>
        <div className="mt-4 space-y-3.5">
          <div>
            <span className="fern-label">Brand color</span>
            <span className="flex items-center gap-3">
              <input type="color" value={theme.primary} onChange={(e) => setTheme({ ...theme, primary: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-[#d8e2c6] bg-white p-1" />
              <span className="tnum rounded-lg bg-fern-50 px-2.5 py-1.5 font-mono text-xs font-semibold text-fern-950">{theme.primary}</span>
            </span>
          </div>
          <div><label className="fern-label" htmlFor="s-hero">Hero title</label><input id="s-hero" value={theme.heroTitle} onChange={(e) => setTheme({ ...theme, heroTitle: e.target.value })} placeholder="Hero title" className="fern-input" /></div>
          <div><label className="fern-label" htmlFor="s-sub">Hero subtitle</label><input id="s-sub" value={theme.heroSubtitle} onChange={(e) => setTheme({ ...theme, heroSubtitle: e.target.value })} placeholder="Hero subtitle" className="fern-input" /></div>
          <button onClick={() => save({ theme_json: theme }, "Theme saved — storefront updated")} className="fern-btn-primary w-full !py-3">
            Save theme
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className={CARD}>
          <h2 className="font-jakarta text-base font-bold text-fern-950">Domains</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div><dt className="fern-label !mb-0.5">Subdomain</dt><dd className="break-all font-medium text-fern-800 underline decoration-fern-800/30 underline-offset-2">{subUrl}</dd></div>
            <div><dt className="fern-label !mb-0.5">Path URL</dt><dd><a className="font-medium text-fern-800 underline decoration-fern-800/30 underline-offset-2 hover:decoration-fern-800" href={`/s/${store.slug}`} target="_blank">/s/{store.slug}</a></dd></div>
          </dl>
          <p className="mt-3 text-xs text-[#7a8a72]">Custom domains land here post-hackathon.</p>
        </div>
        <div className={CARD}>
          <h2 className="font-jakarta text-base font-bold text-fern-950">Settlement</h2>
          <div className="mt-3.5 space-y-3">
            <div><label className="fern-label" htmlFor="s-email">PayPal payout email</label><input id="s-email" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)} placeholder="you@example.com" className="fern-input" /></div>
            <div><label className="fern-label" htmlFor="s-merchant">PayPal merchant ID <span className="font-medium normal-case tracking-normal text-neutral-400">(direct settlement)</span></label><input id="s-merchant" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="Optional" className="fern-input" /></div>
          </div>
          <button onClick={() => save({ payout_email: payoutEmail.trim() || null, paypal_merchant_id: merchantId.trim() || null }, "Settlement saved")}
            className="fern-btn-primary mt-4 w-full">Save settlement</button>
          <p className="mt-2.5 text-xs leading-relaxed text-[#7a8a72]">No merchant ID → platform settles, sellers paid to payout email. With one → PayPal settles directly to the seller.</p>
        </div>
        <div className={CARD}>
          <h2 className="font-jakarta text-base font-bold text-fern-950">Automation webhook (Zapier)</h2>
          <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
            <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/hooks/catch/…" className="fern-input flex-1" />
            <button onClick={() => {
              if (webhookUrl.trim() && !/^https?:\/\//.test(webhookUrl.trim())) { fail("webhook must start with http(s)://"); return; }
              save({ webhook_url: webhookUrl.trim() || null }, "Webhook saved");
            }} className="fern-btn-primary shrink-0">Save</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
