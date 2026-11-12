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

const GREEN = "#1e6b3f";
const CREAM = "#faf9f6";
const MINT = "#edf4ec";

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
    return <main className="mx-auto max-w-3xl px-6 py-12"><p className="text-red-600">{error}</p></main>;

  return (
    <div className="flex min-h-screen text-neutral-900" style={{ background: CREAM }}>
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <a href="/" className="flex items-center gap-2 px-6 pb-1 pt-6 text-2xl font-bold" style={{ color: GREEN }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill={GREEN}><path d="M12 2C7 7 4 11 4 15a8 8 0 0 0 16 0c0-4-3-8-8-13zm0 18a6 6 0 0 1-6-6c0-.5.1-1 .2-1.5C8 14 10 16 12 20c2-4 4-6 5.8-7.5.1.5.2 1 .2 1.5a6 6 0 0 1-6 6z" /></svg>
          fern
        </a>
        <a href="/admin" className="px-6 pb-5 text-xs text-neutral-500 hover:underline">← All stores</a>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => {
            const active = tab === n.id;
            const cls = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm ${active ? "font-semibold" : "text-neutral-600 hover:bg-neutral-100"}`;
            const style = active ? { background: MINT, color: GREEN } : {};
            const icon = ICONS[n.id] ?? ICONS.home;
            if (n.id === "storefront")
              return <a key="storefront" href={storeUrl} target="_blank" className={cls} style={style}>{icon}{n.label}</a>;
            return <button key={n.id} onClick={() => setTab(n.id as Tab)} className={cls} style={style}>{icon}{n.label}</button>;
          })}
          <p className="px-3 pb-1 pt-4 text-[11px] uppercase tracking-wider text-neutral-400">Coming soon</p>
          {navSoon.map((n) => (
            <span key={n.label} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400">
              {ICONS[n.label.toLowerCase()]}{n.label}
            </span>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        {/* Topbar */}
        <header className="flex items-center gap-4 border-b border-neutral-200 bg-white px-6 py-3">
          <div className="flex max-w-xl flex-1 items-center gap-2 rounded-full bg-neutral-100 px-4 py-2">
            <span className="text-neutral-400">{ICONS.search}</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setTab("products"); }}
              placeholder="Search everything in Fern…"
              className="w-full bg-transparent text-sm outline-none" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="text-neutral-500">{ICONS.bell}</button>
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: GREEN }}>
              {(store?.name ?? slug).slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden text-sm font-medium sm:block">{store?.name ?? slug}</span>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-2 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-2 md:hidden">
          {(["home", "products", "orders", "settings"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize ${tab === t ? "font-semibold text-white" : "bg-neutral-100"}`}
              style={tab === t ? { background: GREEN } : {}}>
              {t}
            </button>
          ))}
          <a href={storeUrl} target="_blank" className="rounded-full bg-neutral-100 px-4 py-1.5 text-sm">Storefront</a>
        </nav>

        <main className="mx-auto max-w-6xl px-6 py-8">
          {error && <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {notice && <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}

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
            <div className="rounded-xl border bg-white p-12 text-center text-neutral-500">
              <p className="text-lg font-semibold text-neutral-700">Coming soon</p>
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
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-neutral-600">Welcome back, {store.name}</p>
            <h1 className="mt-1 text-4xl font-bold">Your store, your way.</h1>
            <p className="mt-2 text-sm text-neutral-500">Build, customize, and launch your online store — all in one place.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => go("settings")} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white" style={{ background: GREEN }}>
                Customize your store →
              </button>
              <a href={storeUrl} target="_blank" className="rounded-full border bg-white px-5 py-2.5 text-sm font-medium">View store</a>
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ background: MINT }}>
            <p className="text-sm font-semibold">Your store is ready!</p>
            <a href={storeUrl} target="_blank" className="text-xs underline" style={{ color: GREEN }}>{subUrl.replace(/^https?:\/\//, "")} ⧉</a>
            <ul className="mt-3 space-y-2 border-t border-green-900/10 pt-3 text-sm">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <span style={{ color: c.done ? GREEN : "#a3a3a3" }}>{ICONS.check}</span>{c.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your storefront</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => go("settings")} className="rounded-full border px-4 py-1.5 text-sm">Edit theme</button>
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border bg-neutral-50">
            <iframe title="storefront preview" src={storeUrl} className="h-[420px] w-full bg-white" loading="lazy" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-semibold">Quick actions</h3>
          <div className="mt-3 space-y-2">
            {quick.map((q) => (
              <button key={q.title} onClick={q.fn} className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-neutral-50">
                <span className="rounded-full p-2" style={{ background: MINT, color: GREEN }}>{q.icon}</span>
                <span><span className="block text-sm font-medium">{q.title}</span><span className="block text-xs text-neutral-500">{q.sub}</span></span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <button onClick={() => go("orders")} className="text-xs" style={{ color: GREEN }}>View all →</button>
          </div>
          <ul className="mt-3 space-y-3">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-neutral-100 p-2 text-neutral-500">{ICONS.orders}</span>
                <span><span className="block font-medium">{a.title}</span><span className="block text-xs text-neutral-500">{a.sub}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl p-5" style={{ background: MINT }}>
          <p className="text-sm font-semibold">Need help?</p>
          <p className="mt-1 text-xs text-neutral-600">CSV template, PayPal sandbox, and agent shopping docs are in the README.</p>
          <a href="/api/csv-template" className="mt-3 inline-block rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: GREEN, color: GREEN }}>
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
    { field: "name", flex: 2, filter: true, sortable: true },
    { headerName: "Price", valueGetter: (p) => (p.data ? `$${dollars(p.data.price_cents)}` : ""), width: 110, sortable: true },
    { field: "stock", width: 100, sortable: true },
    { field: "description", flex: 2, filter: true },
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
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Products ({products.length})</h2>
          <div className="ag-theme-quartz mt-3" style={{ height: 380 }}>
            <AgGridReact<Product>
              rowData={products} columnDefs={cols} rowSelection="single"
              onGridReady={(e) => { setGridApi(e.api); e.api.setGridOption("quickFilterText", query); }}
              onSelectionChanged={(e) => setSelectedId(e.api.getSelectedRows()[0]?.id ?? null)}
            />
          </div>
          <button
            onClick={async () => {
              if (!selectedId) return;
              await fetch(`/api/products?id=${selectedId}`, { method: "DELETE" });
              setSelectedId(null); notify("Product deleted"); reload();
            }}
            disabled={!selectedId}
            className="mt-3 rounded-full border border-red-300 px-4 py-1.5 text-sm text-red-600 disabled:opacity-40">
            Delete selected
          </button>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Bulk import via CSV</h2>
          <p className="mt-1 text-sm text-neutral-600">
            <a href="/api/csv-template" className="underline" style={{ color: GREEN }}>Download the template CSV</a>, fill it with your stock, then upload it here.
          </p>
          <input type="file" accept=".csv" disabled={csvBusy} className="mt-3 text-sm disabled:opacity-50"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleCsv(f); }} />
          {csvBusy && <p className="mt-2 text-sm text-neutral-500">Importing…</p>}
          {csvReport && <ul className="mt-3 rounded bg-neutral-50 p-3 text-sm">{csvReport.map((r, i) => <li key={i}>{r}</li>)}</ul>}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Add a product</h2>
        <div className="mt-3 space-y-3">
          <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Name" className="w-full rounded border px-3 py-2 text-sm" />
          <input value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="Price (e.g. 12.50)" inputMode="decimal" className="w-full rounded border px-3 py-2 text-sm" />
          <input value={pImg} onChange={(e) => setPImg(e.target.value)} placeholder="Image URL (or upload →)" className="w-full rounded border px-3 py-2 text-sm" />
          <input type="file" accept="image/*" className="text-sm" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            try { setPImg(await uploadImage(f)); } catch (err) { fail(err instanceof Error ? err.message : "upload failed"); }
          }} />
          {pImg && <img src={pImg} alt="" className="h-16 w-16 rounded border object-cover" />}
          <input value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Description" className="w-full rounded border px-3 py-2 text-sm" />
          <input value={pStock} onChange={(e) => setPStock(e.target.value)} placeholder="Stock" inputMode="numeric" className="w-full rounded border px-3 py-2 text-sm" />
          <button onClick={addProduct} disabled={saving} className="w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: GREEN }}>
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
    { field: "status", width: 110, filter: true, sortable: true },
    { headerName: "Total", valueGetter: (p) => (p.data ? `$${dollars(p.data.total_cents)} ${p.data.currency}` : ""), width: 130, sortable: true },
    { headerName: "Items", valueGetter: (p) => (p.data ? p.data.items.map((i) => `${i.name}×${i.qty}`).join(", ") : ""), flex: 2 },
    { headerName: "When", valueGetter: (p) => (p.data ? new Date(p.data.created_at).toLocaleString() : ""), width: 200, sortable: true },
  ], []);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Revenue (paid)", `$${dollars(paidTotal)}`], ["Orders", String(orders.length)], ["Paid", String(orders.filter((o) => o.status === "paid").length)]].map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-neutral-500">{k}</p>
            <p className="mt-1 text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Orders ({orders.length})</h2>
        <div className="ag-theme-quartz mt-3" style={{ height: 400 }}>
          <AgGridReact<Order> rowData={orders} columnDefs={cols} />
        </div>
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
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Theme</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => {
            const active = theme.template === t.theme.template && theme.primary === t.theme.primary && theme.style?.bg === t.theme.style?.bg;
            return (
              <button key={t.name} onClick={() => setTheme(t.theme)}
                className={`rounded-lg border p-1.5 text-left ${active ? "ring-2" : ""}`}
                style={active ? ({ ["--tw-ring-color" as string]: GREEN } as React.CSSProperties) : {}}>
                <TemplatePreview theme={t.theme} storeName={t.name} />
                <span className="mt-1 block px-0.5 text-xs font-medium">{t.name}{active ? " ✓" : ""}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-neutral-500">Picking a preset replaces layout, fonts and colours. Editing the brand colour below keeps the preset layout.</p>
        <div className="mt-3 space-y-3">
          <label className="block text-sm">Brand color
            <input type="color" value={theme.primary} onChange={(e) => setTheme({ ...theme, primary: e.target.value })} className="ml-2 h-8 w-12 align-middle" />
          </label>
          <input value={theme.heroTitle} onChange={(e) => setTheme({ ...theme, heroTitle: e.target.value })} placeholder="Hero title" className="w-full rounded border px-3 py-2 text-sm" />
          <input value={theme.heroSubtitle} onChange={(e) => setTheme({ ...theme, heroSubtitle: e.target.value })} placeholder="Hero subtitle" className="w-full rounded border px-3 py-2 text-sm" />
          <button onClick={() => save({ theme_json: theme }, "Theme saved — storefront updated")}
            className="w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white" style={{ background: GREEN }}>
            Save theme
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Domains</h2>
          <p className="mt-2 text-sm">Subdomain: <span className="underline">{subUrl}</span></p>
          <p className="text-sm">Path URL: <a className="underline" style={{ color: GREEN }} href={`/s/${store.slug}`} target="_blank">/s/{store.slug}</a></p>
          <p className="mt-2 text-xs text-neutral-500">Custom domains land here post-hackathon.</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Settlement</h2>
          <input value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)} placeholder="PayPal payout email" className="mt-3 w-full rounded border px-3 py-2 text-sm" />
          <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="PayPal merchant ID (direct settlement)" className="mt-2 w-full rounded border px-3 py-2 text-sm" />
          <button onClick={() => save({ payout_email: payoutEmail.trim() || null, paypal_merchant_id: merchantId.trim() || null }, "Settlement saved")}
            className="mt-3 w-full rounded-full bg-neutral-900 px-4 py-2 text-sm text-white">Save settlement</button>
          <p className="mt-2 text-xs text-neutral-500">No merchant ID → platform settles, sellers paid to payout email. With one → PayPal settles directly to the seller.</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Automation webhook (Zapier)</h2>
          <div className="mt-3 flex gap-2">
            <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/hooks/catch/…" className="flex-1 rounded border px-3 py-2 text-sm" />
            <button onClick={() => {
              if (webhookUrl.trim() && !/^https?:\/\//.test(webhookUrl.trim())) { fail("webhook must start with http(s)://"); return; }
              save({ webhook_url: webhookUrl.trim() || null }, "Webhook saved");
            }} className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-white">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
