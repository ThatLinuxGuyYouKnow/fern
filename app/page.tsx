import Link from "next/link";
import { TEMPLATES } from "@/lib/themes";

const GREEN = "#1e6b3f";

const STEPS = [
  { n: "1", t: "Name it", s: "Pick a store name and get a free your-store.fern.store subdomain. Add a logo or generate one from your initials." },
  { n: "2", t: "Style it", s: "Describe your vibe to AI, pick a curated template, or launch in 60 seconds with Quick Start presets." },
  { n: "3", t: "Stock & sell", s: "Add products by form or CSV bulk import, then share the link. PayPal checkout is built in." },
];

const MODES = [
  { mode: "quickstart", icon: "⚡", t: "Quick Start — 60s", s: "Answer almost nothing. Preset theme + starter catalog, live in a minute.", cta: "Start in 60s" },
  { mode: "ai", icon: "✦", t: "Describe to AI", s: "One sentence about your shop — Fern picks the layout, colours and hero copy.", cta: "Describe your store" },
  { mode: "templates", icon: "▦", t: "Curated templates", s: "Battle-tested layouts for markets, fashion, wellness, tech and more.", cta: "Browse templates" },
];

const FEATURES = [
  { t: "Free subdomain", s: "Every store gets a live *.fern.store address instantly — no DNS, no hosting setup." },
  { t: "PayPal checkout", s: "Customers pay by PayPal or card through PayPal. No payment integration to wire up." },
  { t: "CSV bulk import", s: "Download the template, fill your catalogue in a spreadsheet, import it in one go from admin." },
  { t: "AI theming", s: "Describe the mood in plain words and get a matching template, palette and hero text." },
  { t: "Agent-ready (MCP)", s: "Stores expose an MCP endpoint, so AI agents can browse and shop your catalogue too." },
  { t: "Admin dashboard", s: "Manage products, prices and stock after launch — your storefront updates live." },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-[#faf9f6]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-2xl font-bold" style={{ color: GREEN }}>fern</span>
          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
            <a href="#how" className="hover:text-neutral-900">How it works</a>
            <a href="#templates" className="hover:text-neutral-900">Templates</a>
            <a href="#features" className="hover:text-neutral-900">Features</a>
          </nav>
          <Link href="/create?mode=quickstart" className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: GREEN }}>
            Create your store →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-14 md:grid-cols-2 md:items-center">
        <div>
          <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold" style={{ color: GREEN }}>
            Free subdomain · PayPal checkout · No code
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight">
            Your store,<br />your way.
          </h1>
          <p className="mt-4 max-w-md text-lg text-neutral-600">
            Name it, pick a template or describe it to AI, add products — and get a live storefront in minutes.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/create?mode=quickstart" className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: GREEN }}>
              ⚡ Start in 60 seconds
            </Link>
            <Link href="/create?mode=ai" className="rounded-full border bg-white px-6 py-3 text-sm font-medium hover:bg-neutral-50">
              Describe it to AI
            </Link>
          </div>
          <p className="mt-4 text-sm text-neutral-500">No account wall to start. You can restyle and restock anytime from admin.</p>
        </div>

        {/* Mini storefront mock */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b bg-neutral-50 px-4 py-2.5 text-xs text-neutral-500">
            <span className="flex gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-neutral-300" /><i className="h-2.5 w-2.5 rounded-full bg-neutral-300" /><i className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            </span>
            <span className="mx-auto rounded-full bg-white px-3 py-0.5 font-mono">sylvan-living.fern.store</span>
          </div>
          <div className="p-4">
            <div className="rounded-xl p-5 text-white" style={{ background: "#1E3F20" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">New summer harvest</p>
              <p className="mt-1 text-2xl font-bold leading-tight">Good things grow here.</p>
              <p className="mt-1 text-sm text-white/80">Carefully cultivated specimen plants and artisanal stoneware.</p>
              <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold" style={{ color: "#1E3F20" }}>Shop collection</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { img: "/mocks/prod_monstera.png", n: "Monstera Albo", p: "$64.00" },
                { img: "/mocks/prod_fiddle.png", n: "Fiddle Leaf Fig", p: "$48.00" },
                { img: "/mocks/prod_planter.png", n: "Clay Planter", p: "$34.00" },
              ].map((x) => (
                <div key={x.n} className="rounded-xl border p-2">
                  <img src={x.img} alt={x.n} className="h-20 w-full rounded-lg object-cover" />
                  <p className="mt-1.5 truncate text-xs font-semibold">{x.n}</p>
                  <p className="text-xs font-bold" style={{ color: GREEN }}>{x.p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ways to start */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {MODES.map((m) => (
            <Link key={m.mode} href={`/create?mode=${m.mode}`} className="group rounded-2xl border bg-white p-5 transition hover:shadow-md">
              <span className="text-xl" aria-hidden>{m.icon}</span>
              <h3 className="mt-2 font-bold">{m.t}</h3>
              <p className="mt-1 text-sm text-neutral-600">{m.s}</p>
              <span className="mt-3 inline-block text-sm font-semibold group-hover:underline" style={{ color: GREEN }}>{m.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl bg-[#faf9f6] p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: GREEN }}>{s.n}</span>
                <h3 className="mt-3 font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-neutral-600">{s.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Start from a template</h2>
            <p className="mt-1 text-neutral-600">Pick one in the wizard, tweak the colours, launch. Switch anytime.</p>
          </div>
          <Link href="/create?mode=templates" className="text-sm font-semibold hover:underline" style={{ color: GREEN }}>Browse in the wizard →</Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <Link key={t.name} href="/create?mode=templates" className="group rounded-2xl border bg-white p-3 transition hover:shadow-md">
              <div className="rounded-xl p-3" style={{ background: t.theme.primary }}>
                <div className="h-2 w-10 rounded-full bg-white/60" />
                <p className="mt-3 truncate font-bold text-white">{t.theme.heroTitle}</p>
                <p className="truncate text-xs text-white/80">{t.theme.heroSubtitle}</p>
                <div className="mt-3 flex gap-1.5">
                  <span className="h-8 flex-1 rounded bg-white/25" /><span className="h-8 flex-1 rounded bg-white/25" /><span className="h-8 flex-1 rounded bg-white/25" />
                </div>
              </div>
              <div className="flex items-center justify-between px-1 pt-3">
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.tagline}</p>
                </div>
                <span className="flex gap-1">
                  <i className="h-3.5 w-3.5 rounded-full border" style={{ background: t.theme.primary }} />
                  <i className="h-3.5 w-3.5 rounded-full border" style={{ background: t.theme.accent }} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold tracking-tight">Everything included</h2>
          <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.t}>
                <h3 className="font-bold"><span style={{ color: GREEN }}>✓</span> {f.t}</h3>
                <p className="mt-1 text-sm text-neutral-600">{f.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Your store could be live in a minute.</h2>
        <p className="mx-auto mt-2 max-w-md text-neutral-600">Start with Quick Start, restyle it later. Nothing to install, nothing to host.</p>
        <Link href="/create?mode=quickstart" className="mt-6 inline-block rounded-full px-7 py-3 text-sm font-semibold text-white" style={{ background: GREEN }}>
          Create your store →
        </Link>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-neutral-500">
          <span className="font-bold" style={{ color: GREEN }}>fern</span>
          <span>Instant storefronts with PayPal checkout — also shoppable by AI agents via MCP.</span>
          <Link href="/create" className="font-semibold hover:underline" style={{ color: GREEN }}>Create a store</Link>
        </div>
      </footer>
    </main>
  );
}
