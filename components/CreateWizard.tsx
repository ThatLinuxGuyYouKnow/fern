"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TEMPLATES, textOn } from "@/lib/themes";
import TemplatePreview from "@/components/TemplatePreview";
import type { ThemeJson } from "@/lib/supabase";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

type Mode = "ai" | "templates" | "quickstart";

const DEFAULT_THEME: ThemeJson = TEMPLATES[0].theme;

const PALETTES = [
  { name: "Earthy Botanical", primary: "#1E3F20", accent: "#79AD87" },
  { name: "Nordic Minimal", primary: "#424840", accent: "#737970" },
  { name: "Warm Terracotta", primary: "#A85838", accent: "#E5B898" },
  { name: "Modern Evergreen", primary: "#07290C", accent: "#C89D3C" },
];

const STARTERS = [
  "Minimalist botanical & greenery shop, airy and calm",
  "Artisanal coffee roastery, warm and earthy",
  "Handcrafted pottery lookbook, slow-made studio feel",
  "Luxury eco scented goods, soft and premium",
];

const ARCHETYPES = ["Verdant Atelier", "Sunrise Market", "Noir Drop"].map((name) => {
  const t = TEMPLATES.find((x) => x.name === name)!;
  return { name: t.name, meta: t.tagline, theme: t.theme };
});

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "quickstart", label: "⚡ Quick Start", hint: "Preset theme, live in ~60s" },
  { id: "ai", label: "✦ Describe to AI", hint: "One sentence → theme" },
  { id: "templates", label: "▦ Templates", hint: "Pick a curated layout" },
];

function initialsLogo(name: string, primary: string) {
  const raw = (name.trim()[0] || "F").toUpperCase();
  const ch = /[A-Z0-9]/.test(raw) ? raw : "F";
  const fg = textOn(primary);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><rect width='512' height='512' rx='96' fill='${primary}'/><text x='50%' y='54%' fill='${fg}' font-family='Arial, sans-serif' font-size='260' font-weight='700' text-anchor='middle' dominant-baseline='central'>${ch}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const inputCls =
  "w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-on-surface transition-colors focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary/40";
const cardCls = "rounded-2xl bg-surface-container-lowest p-6 shadow-sm";
const labelCls = "text-sm font-semibold text-on-surface";

export default function CreateWizard({ initialMode = "quickstart" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoAuto, setLogoAuto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState<ThemeJson>(DEFAULT_THEME);
  const [pickedLabel, setPickedLabel] = useState(TEMPLATES[0].name);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [describe, setDescribe] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotes, setAiNotes] = useState<string[]>([]);

  const logoInput = useRef<HTMLInputElement>(null);
  const busy = creating || aiLoading;
  const canCreate = Boolean(name.trim() && slug && !busy);

  const onName = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
    if (logoAuto) setLogoUrl(initialsLogo(v || "F", theme.primary));
  };

  const applyTheme = (t: ThemeJson, label: string) => {
    setTheme(t);
    setPickedLabel(label);
    if (logoAuto) setLogoUrl(initialsLogo(name || "F", t.primary));
  };

  const generateFromName = () => {
    setLogoUrl(initialsLogo(name || "F", theme.primary));
    setLogoAuto(true);
  };

  async function uploadLogo(f: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("slug", slug || "new-store");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Upload failed");
      setLogoUrl(j.url);
      setLogoAuto(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function runAi(): Promise<ThemeJson> {
    if (!describe.trim()) return theme;
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: describe, storeName: name || "My Store" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "AI failed");
      setTheme(j.theme);
      setAiNotes(j.notes ?? []);
      setPickedLabel("AI generated");
      if (logoAuto) setLogoUrl(initialsLogo(name || "F", (j.theme as ThemeJson).primary));
      return j.theme;
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI failed");
      return theme;
    } finally {
      setAiLoading(false);
    }
  }

  async function doCreate(t: ThemeJson) {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, logo_url: logoUrl, theme: t }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Create failed");
      router.push(`/admin/${slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
      setCreating(false);
    }
  }

  const createWithAi = async () => {
    if (!canCreate) return;
    await doCreate(await runAi());
  };

  const previewOnlyAi = async () => {
    if (describe.trim()) await runAi();
  };

  /* ------------------------------ bodies ------------------------------ */

  const identity = (
    <section className={cardCls}>
      <h2 className="font-headline-md font-bold text-on-surface">1 · Your store</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="store-name">Store name</label>
          <input id="store-name" value={name} onChange={(e) => onName(e.target.value)} placeholder="e.g. Sylvan Ceramics" className={`mt-1.5 ${inputCls}`} />
        </div>
        <div>
          <label className={labelCls} htmlFor="store-slug">Store URL</label>
          <div className={`mt-1.5 flex items-center ${inputCls} !py-0`}>
            <span className="select-none text-sm text-on-surface-variant">https://</span>
            <input
              id="store-slug"
              value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
              placeholder="your-store"
              className="min-w-0 flex-1 bg-transparent px-1 py-2.5 font-semibold text-primary focus:outline-none"
            />
            <span className="select-none text-sm text-on-surface-variant">.fern.store</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-lg font-bold"
          style={{ background: theme.primary, color: textOn(theme.primary) }}
        >
          {logoUrl ? <img src={logoUrl} alt="Store logo" className="h-full w-full object-cover" /> : (name.trim()[0] || "F").toUpperCase()}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => logoInput.current?.click()} className="rounded-full bg-surface-container px-3.5 py-1.5 text-sm font-semibold hover:bg-surface-container-high">
            {uploading ? "Uploading…" : "Upload logo"}
          </button>
          <button type="button" onClick={generateFromName} title="Initial on your current theme colour" className="rounded-full bg-surface-container px-3.5 py-1.5 text-sm font-semibold hover:bg-surface-container-high">
            Generate from name{logoAuto ? " ✓" : ""}
          </button>
          {logoUrl && (
            <button type="button" onClick={() => { setLogoUrl(null); setLogoAuto(false); }} className="rounded-full px-3.5 py-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface">
              Remove
            </button>
          )}
        </div>
        <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
        <span className="text-xs text-on-surface-variant">
          {logoAuto ? "Theme-matched initial — recolours itself when you change theme or name." : "Optional — you can change it later in admin."}
        </span>
      </div>
    </section>
  );

  const aiBody = (
    <section className={cardCls}>
      <h2 className="font-headline-md font-bold text-on-surface">2 · Describe your store</h2>
      <p className="mt-1 text-sm text-on-surface-variant">One or two sentences is enough. AI picks the template, colours and hero copy — you can tweak the palette below.</p>
      <textarea
        value={describe}
        onChange={(e) => setDescribe(e.target.value)}
        rows={3}
        placeholder="e.g. A minimalist Scandinavian ceramic studio with warm earthy tones and lots of whitespace…"
        className={`mt-4 resize-none ${inputCls}`}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <button key={s} type="button" onClick={() => setDescribe(s)} className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium hover:bg-secondary-container">
            {s}
          </button>
        ))}
      </div>

      <p className={`${labelCls} mt-5`}>Palette</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PALETTES.map((p) => {
          const active = theme.primary === p.primary && pickedLabel !== "AI generated";
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => applyTheme({ ...theme, primary: p.primary, accent: p.accent }, p.name)}
              className={`flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-sm font-medium ${active ? "bg-primary-container text-on-primary" : "bg-surface-container hover:bg-surface-container-high"}`}
            >
              <span className="flex -space-x-1">
                <i className="h-4 w-4 rounded-full border border-white" style={{ background: p.primary }} />
                <i className="h-4 w-4 rounded-full border border-white" style={{ background: p.accent }} />
              </span>
              {p.name}
            </button>
          );
        })}
      </div>

      {aiNotes.length > 0 && <p className="mt-3 rounded-lg bg-surface-container-low p-2.5 text-xs text-on-surface-variant">AI applied: {aiNotes.join(" · ")}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-outline-variant/40 pt-4">
        <button type="button" onClick={createWithAi} disabled={!canCreate} className="rounded-full bg-primary-container px-6 py-2.5 font-semibold text-on-primary hover:bg-primary disabled:opacity-50">
          {busy ? "Creating…" : "✦ Generate & create store"}
        </button>
        <button type="button" onClick={previewOnlyAi} disabled={!describe.trim() || busy} className="rounded-full bg-surface-container px-4 py-2.5 text-sm font-semibold hover:bg-surface-container-high disabled:opacity-50">
          Preview theme first
        </button>
        {!name.trim() && <span className="text-xs text-on-surface-variant">Add a store name above to continue.</span>}
      </div>
    </section>
  );

  const templatesBody = (
    <section className={cardCls}>
      <h2 className="font-headline-md font-bold text-on-surface">2 · Pick a template</h2>
      <p className="mt-1 text-sm text-on-surface-variant">Tweak colours and copy later in admin — the layout is what matters here.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const active = pickedLabel === t.name;
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => applyTheme(t.theme, t.name)}
              className={`rounded-xl p-2.5 text-left transition hover:shadow-md ${active ? "bg-surface-container-low ring-2 ring-secondary" : "bg-surface-container-low"}`}
            >
              <TemplatePreview theme={t.theme} storeName={t.name} />
              <p className="mt-2.5 text-sm font-bold text-on-surface">{t.name} {active && <span className="text-secondary">✓ selected</span>}</p>
              <p className="text-xs leading-relaxed text-on-surface-variant">{t.blurb}</p>
              <p className="mt-1.5 flex flex-wrap gap-1">
                {t.bestFor.map((b) => <span key={b} className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">{b}</span>)}
              </p>
            </button>
          );
        })}
      </div>
      <div className="mt-6 border-t border-outline-variant/40 pt-4">
        <button type="button" onClick={() => canCreate && doCreate(theme)} disabled={!canCreate} className="rounded-full bg-primary-container px-6 py-2.5 font-semibold text-on-primary hover:bg-primary disabled:opacity-50">
          {creating ? "Creating…" : `Create store with ${pickedLabel}`}
        </button>
      </div>
    </section>
  );

  const quickstartBody = (
    <section className={cardCls}>
      <h2 className="font-headline-md font-bold text-on-surface">2 · Pick a look</h2>
      <p className="mt-1 text-sm text-on-surface-variant">That&apos;s it — a starter catalogue and checkout are set up for you. Restyle or restock anytime.</p>
      <p className="mt-2 text-sm text-on-surface-variant">Have your own stock? <a href="/api/csv-template" className="font-semibold text-secondary underline">Download the CSV template</a>, fill it in, and import it from your admin dashboard after launch.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {ARCHETYPES.map((a) => {
          const active = theme.heroTitle === a.theme.heroTitle && theme.primary === a.theme.primary;
          return (
            <button
              key={a.name}
              type="button"
              onClick={() => applyTheme(a.theme, a.name)}
              className={`rounded-xl p-3 text-left transition hover:shadow-md ${active ? "bg-surface-container-low ring-2 ring-secondary" : "bg-surface-container-low"}`}
            >
              <TemplatePreview theme={a.theme} storeName={a.name} />
              <p className="mt-2 text-sm font-bold text-on-surface">{a.name} {active && <span className="text-secondary">✓</span>}</p>
              <p className="text-xs text-on-surface-variant">{a.meta}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-6 border-t border-outline-variant/40 pt-4">
        <button type="button" onClick={() => canCreate && doCreate(theme)} disabled={!canCreate} className="rounded-full bg-primary-container px-6 py-2.5 font-semibold text-on-primary hover:bg-primary disabled:opacity-50">
          {creating ? "Launching…" : "⚡ Launch my store"}
        </button>
        {!name.trim() && <span className="ml-3 text-xs text-on-surface-variant">Add a store name above to launch.</span>}
      </div>
    </section>
  );

  const preview = (
    <aside className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm lg:sticky lg:top-6">
      <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-2.5 text-xs text-on-surface-variant">
        <span className="font-semibold">Live preview</span>
        <span className="truncate font-mono">{slug || "your-store"}.fern.store</span>
      </div>
      <div className="p-4">
        <TemplatePreview theme={theme} storeName={name || "Your store"} logoUrl={logoUrl} />
        <dl className="mt-3 space-y-1.5 text-xs text-on-surface-variant">
          <div className="flex justify-between"><dt>Style</dt><dd className="font-semibold text-on-surface">{pickedLabel}</dd></div>
          <div className="flex justify-between"><dt>Layout</dt><dd className="font-semibold capitalize text-on-surface">{theme.template}</dd></div>
          <div className="flex items-center justify-between">
            <dt>Colours</dt>
            <dd className="flex gap-1.5">
              <i className="h-4 w-4 rounded-full border" style={{ background: theme.primary }} title={theme.primary} />
              <i className="h-4 w-4 rounded-full border" style={{ background: theme.accent }} title={theme.accent} />
            </dd>
          </div>
        </dl>
        <p className="mt-3 border-t border-outline-variant/30 pt-3 text-xs leading-relaxed text-on-surface-variant">
          After launch you&apos;ll add products (form or <a href="/api/csv-template" className="underline">CSV import — get the template</a>) and take PayPal payments from your admin dashboard.
        </p>
      </div>
    </aside>
  );

  /* ------------------------------ render ------------------------------ */

  return (
    <main className="min-h-screen bg-surface font-body-md text-on-surface">
      <header className="border-b border-outline-variant/30 bg-surface-container-lowest">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-headline-md font-bold text-primary">
            <span aria-hidden>🌿</span> fern
            <span className="hidden font-body-sm font-normal text-on-surface-variant sm:inline">/ Create a store</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-on-surface-variant hover:text-primary">← Back home</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-headline-xl font-bold tracking-tight text-primary">Create your store</h1>
        <p className="mt-1 text-on-surface-variant">Two things: name it, style it. Products and payments come right after, in admin.</p>

        {/* Mode switcher */}
        <div className="mt-6 flex w-fit max-w-full flex-wrap gap-1 rounded-full bg-surface-container p-1.5" role="tablist" aria-label="How to build your store">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              title={m.hint}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${mode === m.id ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">{MODES.find((m) => m.id === mode)?.hint}</p>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-error/30 bg-error-container/60 p-3 text-sm text-on-error-container">{error}</div>
        )}

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            {identity}
            {mode === "ai" && aiBody}
            {mode === "templates" && templatesBody}
            {mode === "quickstart" && quickstartBody}
          </div>
          {preview}
        </div>
      </div>
    </main>
  );
}
