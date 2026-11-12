"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/themes";
import type { ThemeJson } from "@/lib/supabase";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

type Mode = "ai" | "templates" | "quickstart";

/** Icon helper for the Material Symbols font (loaded in app/layout.tsx). */
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/** Default theme matches the "Earthy Botanical" palette from the design. */
const DEFAULT_THEME: ThemeJson = {
  template: "minimal",
  primary: "#1E3F20",
  accent: "#79AD87",
  heroTitle: "Good things grow here.",
  heroSubtitle: "Carefully cultivated specimen plants and artisanal stoneware.",
};

const CATEGORIES = [
  { icon: "potted_plant", label: "Botanical & Plants" },
  { icon: "chair", label: "Home & Living" },
  { icon: "checkroom", label: "Apparel & Goods" },
  { icon: "coffee", label: "Coffee & Roastery" },
  { icon: "spa", label: "Health & Wellness" },
  { icon: "palette", label: "Custom Craft" },
];

const PALETTES = [
  { name: "Earthy Botanical", sub: "Sage, Moss, Ivory", primary: "#1E3F20", accent: "#79AD87", swatches: ["#1E3F20", "#79AD87", "#F7FAF5"] },
  { name: "Nordic Minimal", sub: "Oat, Slate, Off-White", primary: "#424840", accent: "#737970", swatches: ["#424840", "#C2C8BE", "#F1F4EF"] },
  { name: "Warm Terracotta", sub: "Clay, Sand, Charcoal", primary: "#A85838", accent: "#E5B898", swatches: ["#A85838", "#E5B898", "#2A2320"] },
  { name: "Modern Evergreen", sub: "Deep Forest, Cream, Gold", primary: "#07290C", accent: "#C89D3C", swatches: ["#07290C", "#E6E9E4", "#C89D3C"] },
];

const TYPOGRAPHY = [
  { name: "Editorial Serif", sub: "Fraunces & Inter" },
  { name: "Modern Sans", sub: "Plus Jakarta & Inter" },
  { name: "Warm Geometric", sub: "Outfit & Space Grotesk" },
];

const MODULES = ["Hero Banner", "Product Grid", "Brand Story", "Testimonials", "Announcement Bar", "Newsletter Signup"];

const STARTERS = ["🌿 Minimalist Botanical & Greenery", "☕ Artisanal Coffee Roastery", "🏺 Handcrafted Pottery Lookbook", "🕯️ Luxury Eco Scented Goods"];

const CURATED = [
  {
    name: "Verdant Clean",
    badge: "Top Pick",
    meta: "Modern plant & lifestyle shop · 1.4k stores",
    img: "/mocks/tpl_verdant.png",
    theme: { template: "grid", primary: "#1E3F20", accent: "#79AD87", heroTitle: "Good things grow here.", heroSubtitle: "Carefully cultivated specimen plants and artisanal stoneware." } as ThemeJson,
  },
  {
    name: "Nordic Craft",
    badge: null as string | null,
    meta: "Artisan ceramics & goods · 890 stores",
    img: "/mocks/tpl_nordic.png",
    theme: { template: "minimal", primary: "#424840", accent: "#737970", heroTitle: "Slow-made ceramics", heroSubtitle: "Small batches, honest materials." } as ThemeJson,
  },
  {
    name: "Bloom Express",
    badge: null as string | null,
    meta: "Single-product fast catalog · 620 stores",
    img: "/mocks/tpl_bloom.png",
    theme: { template: "grid", primary: "#07290C", accent: "#C89D3C", heroTitle: "One perfect product", heroSubtitle: "Fast checkout, zero clutter." } as ThemeJson,
  },
];

const NICHES = [
  { emoji: "🌿", label: "Plant Nursery & Rare Foliage" },
  { emoji: "☕", label: "Specialty Coffee & Beans" },
  { emoji: "🏺", label: "Handcrafted Ceramics & Pots" },
  { emoji: "🕯️", label: "Eco Candles & Fragrance" },
];

const ARCHETYPES = [
  {
    name: "Botanical Modern",
    meta: "Forest #1E3F20 • Sage • Cream",
    dots: ["#1E3F20", "#3B6934", "#B9EEAB"],
    theme: { template: "minimal", primary: "#1E3F20", accent: "#79AD87", heroTitle: "Cultivate your sanctuary.", heroSubtitle: "Heirloom greenhouse foliage, shipped root-safe to your door." } as ThemeJson,
  },
  {
    name: "Artisanal Studio",
    meta: "Warm Terracotta • Charcoal",
    dots: ["#0C4123", "#C5EDC1", "#D8DBD6"],
    theme: { template: "minimal", primary: "#A85838", accent: "#E5B898", heroTitle: "Made by hand, fired with care.", heroSubtitle: "Small-batch studio ceramics and earthenware." } as ThemeJson,
  },
  {
    name: "Minimalist Market",
    meta: "Nordic Slate • High-density",
    dots: ["#2D312E", "#C2C8BE", "#ECEFE9"],
    theme: { template: "grid", primary: "#111827", accent: "#6b7280", heroTitle: "Everything in its place.", heroSubtitle: "A dense, price-forward market catalog." } as ThemeJson,
  },
];

const PRODUCTS_AI = [
  { img: "/mocks/prod_monstera.png", badge: "In Stock", badgeCls: "bg-surface/90 text-primary", name: "Monstera Albo Variegata", price: "$64.00" },
  { img: "/mocks/prod_planter.png", badge: "Artisan", badgeCls: "bg-secondary-container text-on-secondary-container", name: "Basalt Terracotta Vessel", price: "$38.00" },
];

const PRODUCTS_QS = [
  { img: "/mocks/prod_monstera.png", name: "Monstera Albo", price: "$75.00", meta: "In Stock", metaCls: "text-secondary" },
  { img: "/mocks/prod_fiddle.png", name: "Fiddle Leaf Fig", price: "$48.00", meta: "12 Left", metaCls: "text-on-surface-variant" },
  { img: "/mocks/prod_planter.png", name: "Clay Ribbed Planter", price: "$34.00", meta: "Eco Material", metaCls: "text-secondary" },
  { img: "/mocks/prod_tonic.png", name: "Botanical Plant Tonic", price: "$22.00", meta: "100% Organic", metaCls: "text-secondary" },
];

const NAV_ITEMS = [
  { icon: "home", label: "Home", href: "/", active: false },
  { icon: "storefront", label: "Storefront", href: "/create", active: true },
  { icon: "inventory_2", label: "Products", href: "#", active: false },
  { icon: "shopping_bag", label: "Orders", href: "#", active: false },
  { icon: "group", label: "Customers", href: "#", active: false },
  { icon: "monitoring", label: "Analytics", href: "#", active: false },
  { icon: "campaign", label: "Marketing", href: "#", active: false },
  { icon: "loyalty", label: "Discounts", href: "#", active: false },
  { icon: "settings", label: "Settings", href: "#", active: false },
];

const FERN_LOGO = (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#3b6934" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-9" />
    <path d="M12 13C7.5 13 5 9.5 5 4.5c5 0 7 3.5 7 8.5z" fill="#b9eeab" stroke="#3b6934" />
    <path d="M12 16c4.5 0 7-3.5 7-8.5-5 0-7 3.5-7 8.5z" fill="#e6f5d9" stroke="#3b6934" />
  </svg>
);

/** Simple letter-mark logo generated from the store name. */
function initialsLogo(name: string) {
  const ch = (name.trim()[0] || "F").toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><rect width='512' height='512' rx='96' fill='#1E3F20'/><text x='50%' y='54%' fill='#C5EDC1' font-family='Plus Jakarta Sans, Arial, sans-serif' font-size='260' font-weight='700' text-anchor='middle' dominant-baseline='central'>${ch}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ------------------------------------------------------------------ */
/* App shell: sidebar + topbar                                         */
/* ------------------------------------------------------------------ */

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col justify-between bg-surface-container-low p-gutter shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
      <div className="flex flex-col gap-space-lg">
        <div className="flex items-center gap-space-sm px-space-xs">
          {FERN_LOGO}
          <span className="font-headline-md font-bold tracking-tight text-primary">Fern</span>
        </div>
        <nav className="flex flex-col gap-space-xs">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`flex items-center gap-space-sm rounded-full px-space-md py-space-sm font-label-lg transition-all ${
                item.active
                  ? "bg-primary-container font-semibold text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <Icon name={item.icon} className="text-[20px]" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
      <div className="relative flex flex-col gap-space-sm overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-[0_4px_20px_-2px_rgba(27,48,28,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="eco" className="text-[18px]" />
          </div>
          <span className="font-label-sm font-semibold uppercase text-secondary">Pro</span>
        </div>
        <div className="flex flex-col gap-space-xs">
          <span className="font-headline-sm text-on-surface">Grow your brand with Fern</span>
          <span className="font-caption text-on-surface-variant">Unlock multi-tenant channels, botanical themes, and custom domains.</span>
        </div>
        <a href="#" className="mt-space-xs inline-flex items-center justify-center rounded-full bg-primary-container px-space-md py-space-xs text-center font-label-md text-on-primary transition-colors hover:bg-primary">
          Upgrade
        </a>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between bg-surface/85 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-64 lg:px-space-lg">
      <div className="flex max-w-lg flex-1 items-center gap-space-md">
        <div className="relative w-full">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search everything in Fern..."
            className="h-10 w-full rounded-full bg-surface-container-low pl-10 pr-space-md font-body-sm text-on-surface transition-colors placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-space-md">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container-high">
          <Icon name="notifications" className="text-[20px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary" />
        </button>
        <div className="flex cursor-pointer items-center gap-space-sm rounded-full bg-surface-container-low py-space-xs pl-space-sm pr-space-md transition-colors hover:bg-surface-container-high">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Icon name="person" className="text-[18px] text-on-primary" />
          </div>
          <span className="hidden font-label-md text-on-surface sm:inline-block">Jamie Doe</span>
          <Icon name="arrow_drop_down" className="text-[18px] text-on-surface-variant" />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Right-rail previews                                                 */
/* ------------------------------------------------------------------ */

/** Browser chrome shared by both preview variants. */
function BrowserFrame({ tabLabel, url, children, stickyHeader }: { tabLabel: string; url: string; children: React.ReactNode; stickyHeader?: React.ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-low shadow-inner">
      {/* Tab row */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 px-3 pb-1.5 pt-2">
        <div className="flex items-center gap-1.5 pr-2">
          <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/20" />
        </div>
        <div className="flex max-w-[200px] items-center gap-1.5 rounded-t-lg border-x border-t border-outline-variant/30 bg-surface px-3 py-1 text-[11px] text-on-surface shadow-sm">
          <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-primary-container text-secondary-fixed">
            <Icon name="spa" className="text-[11px]" />
          </div>
          <span className="truncate font-medium">{tabLabel}</span>
          <Icon name="close" className="ml-auto cursor-pointer text-[12px] text-on-surface-variant hover:text-on-surface" />
        </div>
        <Icon name="add" className="cursor-pointer px-1 text-on-surface-variant hover:text-on-surface" />
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <Icon name="arrow_back" className="text-[15px] opacity-60" />
          <Icon name="arrow_forward" className="text-[15px] opacity-60" />
          <Icon name="refresh" className="text-[15px]" />
        </div>
        <div className="mx-1 flex flex-1 items-center justify-center gap-1 truncate rounded-full bg-surface-container-lowest px-3 py-0.5 text-center font-mono text-[11px] text-on-surface-variant">
          <Icon name="lock" className="text-[13px] text-secondary" />
          <span className="truncate">{url}</span>
        </div>
      </div>
      {stickyHeader}
      {/* Body */}
      {children}
    </div>
  );
}

function MiniStoreHeader({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-2 py-1 shadow-sm">
      <div className="flex min-w-0 items-center gap-1.5">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-container text-secondary-fixed shadow-sm">
          {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Icon name="spa" className="text-[13px]" />}
        </div>
        <span className="truncate font-headline-sm font-bold tracking-tight text-primary">{name || "Sylvan Living"}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
        <span>Shop</span>
        <span>Foliage</span>
        <span>Care</span>
      </div>
      <div className="flex items-center gap-1">
        <Icon name="search" className="text-[16px] text-on-surface" />
        <Icon name="shopping_bag" className="text-[16px] text-on-surface" />
      </div>
    </div>
  );
}

/** "Describe to AI" / templates mode preview — Real-Time Synthesis Preview. */
function AiPreviewCard({ name, slug, logoUrl, theme, onMinimize }: { name: string; slug: string; logoUrl: string | null; theme: ThemeJson; onMinimize: () => void }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  return (
    <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center justify-between gap-2 px-space-xs pt-space-xs">
        <div className="flex min-w-0 items-center gap-space-xs">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-secondary" />
          <span className="truncate font-label-md font-semibold text-on-surface">Real-Time Synthesis Preview</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="flex items-center rounded-full bg-surface-container p-0.5">
            <button
              onClick={() => setDevice("desktop")}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${device === "desktop" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              <Icon name="desktop_windows" className="text-[16px]" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${device === "mobile" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              <Icon name="smartphone" className="text-[16px]" />
            </button>
          </div>
          <button
            type="button"
            onClick={onMinimize}
            title="Minimize preview"
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="unfold_less" className="text-[16px]" />
          </button>
        </div>
      </div>

      <BrowserFrame
        tabLabel={`${name || "Sylvan Living"} – Botanical`}
        url={`https://${slug || "sylvan-living"}.fern.store`}
      >
        <div className={`flex flex-col gap-3 bg-surface p-3 ${device === "mobile" ? "mx-auto w-[260px]" : ""}`}>
          {/* Quick Start chip */}
          <div className="flex items-center justify-between gap-2 rounded-lg border border-secondary-container bg-secondary-container/50 px-2.5 py-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <Icon name="bolt" className="shrink-0 text-[16px] text-secondary" />
              <span className="truncate text-[11px] font-semibold text-on-secondary-container">⚡ Quick Start Mode: 3-step setup with curated botanical presets</span>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-surface-container-lowest px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
              <span className="whitespace-nowrap">Catalog Seed: 42 ready</span>
            </div>
          </div>
          {/* Announcement bar */}
          <div className="flex items-center justify-center gap-1 rounded-md bg-tertiary-container px-3 py-1 text-[10px] font-medium text-on-tertiary-container">
            <span>🌿 Complimentary organic plant food on all orders over $48</span>
          </div>
          <MiniStoreHeader name={name} logoUrl={logoUrl} />
          {/* Hero */}
          <div className="relative flex min-h-[140px] flex-col justify-end overflow-hidden rounded-xl p-4 text-white shadow-sm" style={{ background: theme.primary }}>
            <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-secondary-fixed/20 blur-xl" />
            <span className="mb-1 w-max rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/90">New Summer Harvest</span>
            <h3 className="font-headline-md font-bold leading-tight">{theme.heroTitle}</h3>
            <p className="mt-1 line-clamp-1 text-[11px] text-primary-fixed-dim">{theme.heroSubtitle}</p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold text-on-secondary-container">
                Shop Collection
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] text-white">Read Journal</span>
            </div>
          </div>
          {/* Product cards */}
          <div className="grid grid-cols-2 gap-2">
            {PRODUCTS_AI.map((p) => (
              <div key={p.name} className="flex flex-col gap-1.5 rounded-xl bg-surface-container-lowest p-2 shadow-sm">
                <div className="relative h-20 w-full overflow-hidden rounded-lg bg-surface-container">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                  <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-medium ${p.badgeCls}`}>{p.badge}</span>
                </div>
                <div className="flex flex-col">
                  <span className="truncate text-[11px] font-semibold text-on-surface">{p.name}</span>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-secondary">{p.price}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container text-on-surface">
                      <Icon name="add" className="text-[12px]" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Brand tokens */}
          <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-2 shadow-sm">
            <span className="text-[11px] font-medium text-on-surface-variant">Synthesized Brand Tokens:</span>
            <div className="flex items-center gap-1.5">
              {[theme.primary, theme.accent, "#07290C", "#B9EEAB", "#F1F4EF"].map((c, i) => (
                <div key={i} className="h-4 w-4 rounded-full" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </BrowserFrame>

      <div className="flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3">
        <Icon name="neurology" className="mt-0.5 shrink-0 text-[18px] text-secondary" />
        <p className="font-caption text-on-surface-variant">
          <strong className="font-semibold text-on-surface">Synthesized with 42 catalog items:</strong> Botanical e-commerce layout configured with instant stock ingestion, 4-column adaptive catalog, organic typography, and sustainability credential tags.
        </p>
      </div>
    </section>
  );
}

/** Quick Start mode preview — Live Sync simulation. */
function QsPreviewCard({ name, slug, logoUrl, theme, seedMode, onMinimize }: { name: string; slug: string; logoUrl: string | null; theme: ThemeJson; seedMode: "ai" | "sample"; onMinimize: () => void }) {
  const items = seedMode === "ai" ? 36 : 24;
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl">
      {/* Browser header */}
      <div className="flex items-center justify-between gap-space-sm bg-surface-container px-space-md py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-error/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-secondary-fixed-dim" />
          <div className="h-2.5 w-2.5 rounded-full bg-primary-fixed-dim" />
        </div>
        <div className="mx-auto flex min-w-0 max-w-xs flex-1 items-center justify-center gap-1 rounded-full bg-surface-container-lowest px-space-sm py-1 font-mono text-[11px] text-on-surface-variant shadow-sm">
          <Icon name="lock" className="shrink-0 text-[13px] text-secondary" />
          <span className="truncate">https://{slug || "verdant-botanica"}.fern.store</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onMinimize}
            title="Minimize preview"
            className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          >
            <Icon name="unfold_less" className="text-[16px]" />
          </button>
          <Icon name="open_in_new" className="cursor-pointer text-[16px] text-on-surface-variant hover:text-on-surface" />
        </div>
      </div>
      {/* Sync banner */}
      <div className="flex items-center justify-between bg-secondary-container/60 px-space-md py-1.5 text-on-secondary-container">
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
          <span>Real-time Live Sync active</span>
        </div>
        <span className="font-caption">{items} Items Ready</span>
      </div>
      {/* Storefront body */}
      <div className="flex max-h-[580px] flex-col gap-space-sm overflow-y-auto bg-surface p-space-sm">
        <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-2.5 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-container text-secondary">
              {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Icon name="potted_plant" className="text-[20px] text-secondary" />}
            </div>
            <span className="truncate font-headline-sm font-bold tracking-tight text-primary">{name || "Verdant Botanica"}</span>
          </div>
          <div className="hidden items-center gap-space-sm text-[11px] text-on-surface-variant sm:flex">
            <span className="font-semibold text-primary">Shop Plants</span>
            <span>Rare Foliage</span>
            <span>Planters</span>
            <span>Care</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="search" className="text-[18px] text-on-surface-variant" />
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-surface-container">
              <Icon name="shopping_bag" className="text-[16px] text-primary" />
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-on-secondary">0</span>
            </div>
          </div>
        </div>
        {/* Hero */}
        <div className="relative flex min-h-[160px] flex-col justify-end overflow-hidden rounded-xl p-space-md text-white shadow-sm" style={{ background: theme.primary }}>
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-secondary opacity-20 blur-xl" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="w-max rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90">Spring Drop 2026</span>
            <h3 className="font-headline-lg font-bold leading-tight">{theme.heroTitle}</h3>
            <p className="line-clamp-1 font-body-sm text-primary-fixed-dim">{theme.heroSubtitle}</p>
            <div className="mt-1">
              <span className="rounded-full bg-surface-container-lowest px-3 py-1 font-label-sm font-bold text-primary shadow-sm">Explore Rare Plants</span>
            </div>
          </div>
        </div>
        {/* Feature micro-pills */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] text-on-surface-variant">
          <div className="flex items-center justify-center gap-1 rounded-md bg-surface-container-lowest px-1 py-1.5 shadow-sm">
            <Icon name="local_shipping" className="text-[13px] text-secondary" />
            <span>Carbon-neutral</span>
          </div>
          <div className="flex items-center justify-center gap-1 rounded-md bg-surface-container-lowest px-1 py-1.5 shadow-sm">
            <Icon name="verified_user" className="text-[13px] text-secondary" />
            <span>30-Day Root Care</span>
          </div>
          <div className="flex items-center justify-center gap-1 rounded-md bg-surface-container-lowest px-1 py-1.5 shadow-sm">
            <Icon name="spa" className="text-[13px] text-secondary" />
            <span>Organic Soil</span>
          </div>
        </div>
        {/* Curated selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary">Curated Live Selection</span>
            <span className="font-caption font-semibold text-secondary">View Catalog ({items})</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCTS_QS.map((p) => (
              <div key={p.name} className="flex flex-col gap-1.5 rounded-lg bg-surface-container-lowest p-2 shadow-sm">
                <div className="h-28 w-full overflow-hidden rounded-md bg-surface-container-high">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="truncate text-[11px] font-semibold text-on-surface">{p.name}</span>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="font-headline-sm font-bold text-primary">{p.price}</span>
                    <span className={`text-[10px] font-medium ${p.metaCls}`}>{p.meta}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Store Readiness Health checklist (Quick Start rail). */
function ReadinessCard({ name, slug }: { name: string; slug: string }) {
  const pct = name.trim() && slug ? 92 : name.trim() ? 76 : 58;
  const checks = [
    { label: "Multi-tenant routing & Edge SSL Provisioned", status: "Active" },
    { label: name.trim() && slug ? "36 catalog products indexed with botanical tags" : "Catalog seed queued with botanical tags", status: "Ready" },
    { label: "Stripe, Apple Pay & Klarna gateways pre-linked", status: "Linked" },
    { label: "Responsive mobile viewport rendered", status: "Verified" },
  ];
  return (
    <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon name="task_alt" className="text-[20px] text-secondary" />
          <span className="font-headline-sm font-bold text-on-surface">Store Readiness Health</span>
        </div>
        <span className="font-label-md font-bold text-secondary">{pct}% Ready</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-secondary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ul className="flex flex-col gap-1.5 pt-1">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center justify-between gap-2 font-caption text-on-surface">
            <div className="flex min-w-0 items-center gap-2">
              <Icon name="check_circle" className="shrink-0 text-[16px] text-secondary" />
              <span className="truncate">{c.label}</span>
            </div>
            <span className="shrink-0 whitespace-nowrap font-mono text-[11px] font-semibold text-secondary">{c.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Or start with a curated theme" dock (AI / templates rail). */
function CuratedThemesCard({ onPick }: { onPick: (t: ThemeJson, name: string) => void }) {
  return (
    <section className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center justify-between px-space-xs">
        <div>
          <h3 className="font-headline-sm font-semibold text-on-surface">Or start with a curated theme</h3>
          <p className="font-caption text-on-surface-variant">Pre-tuned layouts designed for botanical commerce</p>
        </div>
        <span className="shrink-0 whitespace-nowrap text-right font-label-sm font-semibold text-secondary">24 ready</span>
      </div>
      <div className="flex flex-col gap-space-sm">
        {CURATED.map((t) => (
          <button
            key={t.name}
            onClick={() => onPick(t.theme, t.name)}
            className="group flex cursor-pointer items-center justify-between rounded-xl bg-surface-container-low p-2.5 text-left transition-all hover:bg-surface-container"
          >
            <div className="flex min-w-0 items-center gap-space-sm">
              <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-container-highest shadow-sm">
                <img src={t.img} alt={t.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-label-md font-semibold text-on-surface">{t.name}</span>
                  {t.badge && (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-secondary-container px-1.5 py-0.5 text-[10px] font-medium text-on-secondary-container">{t.badge}</span>
                  )}
                </div>
                <span className="truncate font-caption text-on-surface-variant">{t.meta}</span>
              </div>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface transition-all group-hover:bg-primary group-hover:text-on-primary">
              <Icon name="arrow_forward" className="text-[16px]" />
            </span>
          </button>
        ))}
      </div>
      <a href="#" className="inline-flex items-center justify-center gap-1.5 py-1 text-center font-label-md font-semibold text-secondary transition-colors hover:text-primary">
        <span>Browse all 24 curated themes</span>
        <Icon name="arrow_forward" className="text-[16px]" />
      </a>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function StepBadge({ n, tone = "low" }: { n: number; tone?: "low" | "secondary" }) {
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full font-label-md font-bold ${
        tone === "secondary" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-low text-primary"
      }`}
    >
      {n}
    </span>
  );
}

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 font-label-sm font-medium ${className}`}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function CreateWizard({ initialMode = "ai" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);

  // shared wizard state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState<ThemeJson>(DEFAULT_THEME);
  const [pickedLabel, setPickedLabel] = useState("Custom");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // ai mode
  const [category, setCategory] = useState(0);
  const [describe, setDescribe] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotes, setAiNotes] = useState<string[]>([]);
  const [moodboard, setMoodboard] = useState<{ url: string; name: string; size: string; note: string } | null>({
    url: "/mocks/moodboard.png",
    name: "storefront_moodboard_v1.png",
    size: "1.2 MB",
    note: "Extracted 6 color tokens & modular card layout",
  });
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [typeIdx, setTypeIdx] = useState(1);
  const [modules, setModules] = useState<boolean[]>([true, true, true, true, true, false]);
  const [csvName, setCsvName] = useState<string | null>(null);

  // quickstart mode
  const [nicheIdx, setNicheIdx] = useState(0);
  const [archIdx, setArchIdx] = useState(0);
  const [seedMode, setSeedMode] = useState<"ai" | "sample">("ai");
  const [previewOpen, setPreviewOpen] = useState(false);

  const logoInput = useRef<HTMLInputElement>(null);
  const moodInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);

  const onName = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
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
      if (!res.ok) throw new Error(j.error || "upload failed");
      setLogoUrl(j.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "upload failed");
    } finally {
      setUploading(false);
    }
  }

  /** Calls the real AI theme endpoint; falls back to current theme when the prompt is empty. */
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
      if (!res.ok) throw new Error(j.error || "create failed");
      router.push(`/admin/${slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "create failed");
      setCreating(false);
    }
  }

  const canCreate = name.trim() && slug && !creating;

  const onGenerateAi = async () => {
    if (!canCreate) return;
    const t = await runAi();
    await doCreate(t);
  };

  const pickMoodboard = (f: File) => {
    setMoodboard({
      url: URL.createObjectURL(f),
      name: f.name,
      size: `${(f.size / 1e6).toFixed(1)} MB`,
      note: "Analyzing color tokens & layout density…",
    });
  };

  /* ---------------- mode switcher ---------------- */

  const switcher = (
    <div className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-full bg-surface-container p-1.5 shadow-sm">
      <button
        onClick={() => setMode("ai")}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-space-md py-1.5 font-label-sm transition-all ${
          mode === "ai" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        }`}
      >
        <Icon name="auto_awesome" className="text-[16px]" />
        <span className="hidden sm:inline">Describe to AI</span>
        <span className="rounded-full bg-surface-container-highest px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">AI</span>
      </button>
      <button
        onClick={() => setMode("templates")}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-space-md py-1.5 font-label-sm transition-all ${
          mode === "templates" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        }`}
      >
        <Icon name="dashboard_customize" className="text-[16px]" />
        <span className="hidden sm:inline">Curated Templates</span>
        <span className="hidden sm:inline-block rounded-full bg-surface-container-highest px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Popular</span>
        <span className="sm:hidden">Templates</span>
      </button>
      <button
        onClick={() => setMode("quickstart")}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-space-md py-1.5 font-label-sm transition-all ${
          mode === "quickstart" ? "bg-primary-container font-semibold text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        }`}
      >
        <Icon name="bolt" className={`text-[16px] ${mode === "quickstart" ? "text-secondary-fixed" : "text-secondary"}`} />
        <span className="hidden md:inline">Quick Start (60s)</span>
        <span className="md:hidden">Quick Start</span>
        <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${
          mode === "quickstart" ? "bg-secondary text-on-secondary" : "bg-secondary-fixed/20 text-secondary"
        }`}>
          {mode === "quickstart" ? "⚡ ACTIVE" : "60s"}
        </span>
      </button>
    </div>
  );

  /* ---------------- form bodies ---------------- */

  const aiForm = (
    <>
      {/* Card 1: Store Identity & Domain */}
      <section className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <StepBadge n={1} />
            <h2 className="font-headline-md text-on-surface">Store Identity & Domain</h2>
          </div>
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap font-caption font-medium text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Multi-Tenant Ready
          </span>
        </div>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-on-surface">Store Name</label>
            <input
              value={name}
              onChange={(e) => onName(e.target.value)}
              placeholder="e.g. Sylvan Ceramics"
              className="w-full rounded-xl bg-surface-container-low px-space-md py-2.5 font-body-md text-on-surface transition-colors focus:bg-surface-container-lowest focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-on-surface">Store URL (Free Slug)</label>
            <div className="flex items-center rounded-xl bg-surface-container-low px-space-md py-2.5 font-body-sm text-on-surface">
              <span className="select-none text-on-surface-variant">https://</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                }}
                className="max-w-[140px] flex-1 truncate bg-transparent px-1 font-label-md font-medium text-primary focus:outline-none"
              />
              <span className="select-none text-on-surface-variant">.fern.store</span>
            </div>
          </div>
        </div>
        {/* Category pills */}
        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-on-surface">Industry & Botanical Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCategory(i)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label-sm transition-colors ${
                  category === i
                    ? "bg-primary-container text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <Icon name={c.icon} className="text-[16px]" />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Icon & Favicon */}
        <div className="flex flex-col gap-space-sm border-t border-outline-variant/30 pt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1.5 font-label-md font-semibold text-on-surface">
                <Icon name="photo_size_select_actual" className="text-[18px] text-secondary" />
                Storefront Icon & Favicon
              </span>
              <span className="font-caption text-on-surface-variant">Defines your store brand avatar across channels, checkout, and browser bookmarks</span>
            </div>
            <button
              type="button"
              onClick={() => setLogoUrl(initialsLogo(name))}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-secondary-container/50 px-2.5 py-1 font-label-sm font-semibold text-secondary transition-colors hover:bg-secondary-container"
            >
              <Icon name="auto_awesome" className="text-[15px]" />
              <span>AI Generate from Name</span>
            </button>
          </div>
          <div className="mt-1 grid grid-cols-1 gap-space-md md:grid-cols-2">
            {/* Brand icon card */}
            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-secondary-container/30 bg-primary-container text-on-primary shadow-sm">
                {logoUrl ? (
                  <img src={logoUrl} alt="store icon" className="h-full w-full object-cover" />
                ) : (
                  <Icon name="spa" className="text-[28px] text-secondary-fixed" />
                )}
                {logoUrl && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-sm">
                    <Icon name="check" className="text-[12px]" />
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-label-sm font-semibold text-on-surface">Store Brand Icon</span>
                  <span className="shrink-0 whitespace-nowrap text-[10px] text-on-surface-variant">512x512 PNG</span>
                </div>
                <p className="truncate text-[11px] text-on-surface-variant">{name ? `${name} Botanical Mark (Auto)` : "Sage Botanical Mark (Auto)"}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <button type="button" onClick={() => logoInput.current?.click()} className="text-[11px] font-semibold text-secondary hover:text-primary">
                    {uploading ? "Uploading…" : "Upload Custom"}
                  </button>
                  <input
                    ref={logoInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
                  />
                </div>
              </div>
            </div>
            {/* Favicon card */}
            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
                {logoUrl ? <img src={logoUrl} alt="favicon" className="h-8 w-8 rounded object-contain" /> : <Icon name="html" className="text-[24px] text-secondary" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-label-sm font-semibold text-on-surface">Browser Favicon</span>
                  <Chip className="bg-secondary-container/40 text-secondary">Synced</Chip>
                </div>
                <p className="text-[11px] text-on-surface-variant">32x32 · .ico / .svg</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-on-surface-variant">
                  <Icon name="sync" className="text-[13px] text-secondary" />
                  Auto-sync favicon with Store Icon
                </p>
                <p className="text-[10px] text-on-surface-variant/80">Appears in browser tabs, favorites & bookmarks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card 2: Storefront Prompt Vision */}
      <section className="relative flex flex-col gap-space-md overflow-hidden rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <StepBadge n={2} tone="secondary" />
            <h2 className="font-headline-md text-on-surface">Storefront Prompt Vision</h2>
          </div>
          <Chip className="flex items-center gap-1 bg-secondary-container/60 text-secondary">
            <Icon name="psychology" className="text-[14px]" />
            Fern LLM Engine v4.2
          </Chip>
        </div>
        <div className="flex flex-col">
          <textarea
            value={describe}
            onChange={(e) => setDescribe(e.target.value)}
            rows={4}
            placeholder="Describe your dream storefront aesthetic, layout style, target audience, and key sections (e.g., 'A minimalist Scandinavian ceramic studio featuring warm earthy tones, full-bleed hero banner, customer reviews carousel, curated weekly drops, and sticky cart preview...')."
            className="w-full resize-none rounded-xl bg-surface-container-low p-space-md font-body-md text-on-surface transition-colors focus:bg-surface-container-lowest focus:outline-none placeholder:text-on-surface-variant/70"
          />
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="font-caption text-on-surface-variant">Press chips below to prepend design criteria</span>
            <span className="font-caption font-medium text-secondary">{describe.length} characters</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Quick Prompt Starters</span>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setDescribe(
                    `A brand inspired by ${s.replace(/^[^\w\s]+/, "").trim()}, featuring an airy organic layout, calm botanical palette, bespoke product gallery, and story-driven storytelling.`
                  )
                }
                className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 font-body-sm text-on-surface transition-colors hover:bg-secondary-container"
              >
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>
        {pickedLabel === "AI generated" && aiNotes.length > 0 && (
          <div className="rounded-lg bg-surface-container-low p-2 font-caption text-on-surface-variant">
            AI theme applied: {aiNotes.join(" · ")}
          </div>
        )}
      </section>

      {/* Card 3: Visual Reference & Moodboard */}
      <section className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-space-sm">
            <StepBadge n={3} />
            <div className="min-w-0">
              <h2 className="whitespace-nowrap font-headline-md text-on-surface">Visual Reference & Moodboard</h2>
              <p className="font-caption text-on-surface-variant">Fern will analyze colors, layout density, and spatial rhythm from your uploads</p>
            </div>
          </div>
          <Chip className="bg-surface-container text-on-surface-variant">Optional</Chip>
        </div>
        {moodboard && (
          <div className="flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm sm:flex-row">
            <div className="flex w-full min-w-0 items-center gap-space-md sm:w-auto">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container-highest shadow-sm">
                <img src={moodboard.url} alt="Uploaded storefront moodboard reference" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 right-1 flex items-center rounded bg-primary/80 p-0.5 text-on-primary backdrop-blur-sm">
                  <Icon name="verified" className="text-[12px]" />
                </span>
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-label-md font-semibold text-on-surface">{moodboard.name}</span>
                  <span className="shrink-0 whitespace-nowrap font-caption text-on-surface-variant">{moodboard.size}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  <span className="font-caption font-medium text-secondary">{moodboard.note}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => moodInput.current?.click()}
                className="rounded-full bg-surface-container-lowest px-3 py-1.5 font-label-sm text-on-surface transition-colors hover:bg-surface-container"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setMoodboard(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
              >
                <Icon name="delete" className="text-[18px]" />
              </button>
            </div>
          </div>
        )}
        <div
          onClick={() => moodInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) pickMoodboard(f);
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-surface-container/50 p-space-lg text-center transition-colors hover:bg-surface-container-high"
        >
          <div className="mb-space-xs flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-secondary shadow-sm">
            <Icon name="cloud_upload" className="text-[24px]" />
          </div>
          <p className="font-label-md text-on-surface">Drop additional moodboards, screenshots, or SVG brand guides</p>
          <p className="mt-0.5 font-caption text-on-surface-variant">Supports PNG, JPG, WEBP, SVG up to 25MB each</p>
        </div>
        <input ref={moodInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pickMoodboard(e.target.files[0])} />
      </section>

      {/* Card 4: Brand Style & Personality */}
      <section className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex items-center gap-space-sm">
          <StepBadge n={4} />
          <h2 className="font-headline-md text-on-surface">Brand Style & Personality</h2>
        </div>
        {/* Color palette */}
        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-on-surface">Color Palette & Atmosphere</label>
          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
            {PALETTES.map((p, i) => {
              const active = paletteIdx === i;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setPaletteIdx(i);
                    setTheme((t) => ({ ...t, primary: p.primary, accent: p.accent }));
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-xl p-3 shadow-sm transition-colors ${
                    active ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-space-sm">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ background: active ? p.swatches[1] : "#e0e3de", boxShadow: active ? "0 0 0 2px #ffffff" : undefined }}
                    />
                    <div className="min-w-0 text-left">
                      <div className="truncate font-label-md font-semibold">{p.name}</div>
                      <div className={`truncate font-caption ${active ? "text-on-primary-container" : "text-on-surface-variant"}`}>{p.sub}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {p.swatches.map((c) => (
                      <span key={c} className="h-3.5 w-3.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Typography */}
        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-on-surface">Typography Pairing</label>
          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-3">
            {TYPOGRAPHY.map((t, i) => {
              const active = typeIdx === i;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setTypeIdx(i)}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl p-3 text-left transition-colors ${
                    active ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="flex items-center justify-between gap-1 font-label-md font-semibold">
                    <span className="truncate">{t.name}</span>
                    {active && <Icon name="check_circle" className="shrink-0 text-[16px]" />}
                  </span>
                  <span className={`truncate font-caption ${active ? "text-on-primary-container" : "text-on-surface-variant"}`}>{t.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Layout modules */}
        <div className="flex flex-col gap-space-xs">
          <label className="font-label-md text-on-surface">Include Initial Layout Modules</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MODULES.map((m, i) => (
              <label
                key={m}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface-container-low p-2.5 transition-colors hover:bg-surface-container"
              >
                <input
                  type="checkbox"
                  checked={modules[i]}
                  onChange={(e) => setModules((arr) => arr.map((v, j) => (j === i ? e.target.checked : v)))}
                  className="h-4 w-4 shrink-0 rounded accent-secondary"
                />
                <span className="whitespace-nowrap text-xs font-medium leading-tight text-on-surface">{m}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Card 5: Product Catalog & Stock */}
      <section className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-space-sm">
            <StepBadge n={5} />
            <div className="min-w-0">
              <h2 className="whitespace-nowrap font-headline-md text-on-surface">Product Catalog & Stock</h2>
              <p className="font-caption text-on-surface-variant">Seed your storefront with real inventory immediately or start with placeholder botanical goods.</p>
            </div>
          </div>
          <Chip className="bg-surface-container text-on-surface-variant">Optional</Chip>
        </div>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          {/* Standard template */}
          <div className="flex flex-col justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon name="table_view" className="shrink-0 text-[20px] text-secondary" />
                  <span className="whitespace-nowrap font-label-md font-semibold text-on-surface">Standard Template</span>
                </div>
                <span className="shrink-0 whitespace-nowrap font-caption font-medium text-secondary">CSV / XLSX</span>
              </div>
              <p className="font-caption text-on-surface-variant">Use our pre-structured botanical template with SKU, Title, Price, Stock & Category tags.</p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="/api/csv-template"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-2 font-label-sm text-on-surface shadow-sm transition-colors hover:bg-surface-container"
              >
                <Icon name="download" className="text-[16px] text-secondary" />
                <span>Download Template (.CSV)</span>
              </a>
              <button
                type="button"
                onClick={() => csvInput.current?.click()}
                className="rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest/60 p-3 text-center transition-colors hover:bg-surface-container-low"
              >
                <Icon name="upload_file" className="mx-auto mb-1 text-[20px] text-on-surface-variant" />
                <p className="font-label-sm text-on-surface">{csvName ?? "Drop filled template here"}</p>
                <p className="font-caption text-on-surface-variant">{csvName ? "Ready to parse on launch" : "or click to browse files"}</p>
              </button>
              <input ref={csvInput} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && setCsvName(e.target.files[0].name)} />
            </div>
          </div>
          {/* AI Stock Ingestion */}
          <div className="flex flex-col justify-between gap-space-sm rounded-xl bg-secondary-container/30 p-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon name="auto_awesome" className="shrink-0 text-[20px] text-secondary" />
                  <span className="whitespace-nowrap font-label-md font-semibold text-on-surface">AI Stock Ingestion</span>
                </div>
                <Chip className="bg-secondary-container text-on-secondary-container">Auto-Mapping</Chip>
              </div>
              <p className="font-caption text-on-surface-variant">Drop any supplier sheet. Fern AI automatically normalizes columns, creates tags & botanical copy.</p>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-lowest p-3 shadow-sm">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-secondary-fixed">
                  <Icon name="description" className="text-[24px]" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-label-sm font-semibold text-on-surface">autumn_inventory.csv</span>
                  <span className="whitespace-nowrap font-caption text-on-surface-variant">42 items detected & mapped</span>
                </div>
              </div>
              <Chip className="bg-secondary-container text-on-secondary-container">Ready</Chip>
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 font-caption text-on-surface-variant">
                <Icon name="check_circle" className="text-[14px] text-secondary" />
                <span>AI Schema matched 100%</span>
              </div>
              <button type="button" className="font-label-sm font-semibold text-secondary hover:text-primary">Preview 42 Items</button>
            </div>
          </div>
        </div>
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-md border-t border-outline-variant/30 pt-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-secondary">
              <Icon name="bolt" className="text-[20px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md font-semibold text-on-surface">Instant Generative Render</span>
              <span className="font-caption text-on-surface-variant">Typically builds responsive layouts in ~25s</span>
            </div>
          </div>
          <div className="flex w-full items-center justify-end gap-space-sm sm:w-auto">
            <button
              type="button"
              onClick={() => canCreate && doCreate(theme)}
              disabled={!canCreate}
              className="rounded-full bg-surface-container px-space-md py-2.5 font-label-md text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={onGenerateAi}
              disabled={!canCreate}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary-container px-6 py-2.5 font-label-md text-on-primary shadow-md transition-all hover:bg-primary hover:shadow-lg disabled:opacity-50 sm:flex-none"
            >
              {aiLoading || creating ? (
                <>
                  <Icon name="refresh" className="animate-spin text-[18px]" />
                  <span>Synthesizing Storefront...</span>
                </>
              ) : (
                <>
                  <Icon name="auto_awesome" className="text-[18px]" />
                  <span>Generate Storefront with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </>
  );

  const templatesForm = (
    <section className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-space-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-primary">
            <Icon name="dashboard_customize" className="text-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="whitespace-nowrap font-headline-md text-on-surface">Pick from Curated Templates</h2>
            <p className="font-caption text-on-surface-variant">Battle-tested layouts — pick one, tweak the palette, launch.</p>
          </div>
        </div>
        <Chip className="bg-secondary-container text-on-secondary-container">Popular</Chip>
      </div>
      <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const active = pickedLabel === t.name;
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => {
                setTheme(t.theme);
                setPickedLabel(t.name);
              }}
              className={`group flex cursor-pointer flex-col gap-2 rounded-xl p-space-sm text-left transition-all hover:shadow-md ${
                active ? "bg-surface-container-low ring-2 ring-secondary" : "bg-surface-container-low"
              }`}
            >
              <div className="relative h-20 w-full overflow-hidden rounded-lg p-2" style={{ background: t.theme.primary }}>
                <div className="flex items-center justify-between">
                  <div className="h-2 w-10 rounded-full bg-white/60" />
                  <div className="flex gap-1">
                    <div className="h-1.5 w-3 rounded-full bg-white/40" />
                    <div className="h-1.5 w-3 rounded-full bg-white/40" />
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <div className="h-9 w-1/3 rounded bg-white/30" />
                  <div className="h-9 w-1/3 rounded bg-white/30" />
                  <div className="h-9 w-1/3 rounded bg-white/30" />
                </div>
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-primary shadow-sm">
                    <Icon name="check" className="text-[14px]" />
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-label-md font-bold text-on-surface">{t.name}</span>
                <span className="font-caption font-medium text-secondary">{t.tagline}</span>
                <span className="font-caption text-on-surface-variant">{t.vibe}</span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setMode("ai")}
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-surface-container py-2 font-label-md font-semibold text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
      >
        <Icon name="auto_awesome" className="text-[16px]" />
        <span>Or describe it to AI instead</span>
      </button>
      <div className="flex items-center justify-between border-t border-outline-variant/30 pt-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-secondary">
            <Icon name="bolt" className="text-[20px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-label-md font-semibold text-on-surface">Ready when you are</span>
            <span className="font-caption text-on-surface-variant">Template picked: {pickedLabel}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => canCreate && doCreate(theme)}
          disabled={!canCreate}
          className="flex items-center gap-2 rounded-full bg-primary-container px-6 py-2.5 font-label-md text-on-primary shadow-md transition-all hover:bg-primary hover:shadow-lg disabled:opacity-50"
        >
          <Icon name="storefront" className="text-[18px]" />
          <span>{creating ? "Creating…" : "Create Storefront"}</span>
        </button>
      </div>
    </section>
  );

  const quickstartForm = (
    <>
      {/* Express banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-container p-space-md text-on-primary shadow-md">
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-secondary opacity-20 blur-xl" />
        <div className="relative z-10 flex items-start gap-space-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/30 text-secondary-fixed">
            <Icon name="electric_bolt" className="text-[24px]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm font-bold text-on-primary">Express Setup Pipeline</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 font-label-sm font-semibold text-on-secondary">T-minus 60s</span>
            </div>
            <p className="font-body-sm text-primary-fixed-dim">
              Pre-tuned botanical architecture configured automatically. Every parameter updates the live multi-tenant storefront preview instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Instant Store Identity */}
      <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-space-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-sm font-bold text-on-primary">1</span>
            <h2 className="truncate font-headline-md font-bold text-primary">Instant Store Identity</h2>
          </div>
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-surface-container-low px-2.5 py-1 font-caption font-semibold text-secondary">
            <Icon name="check_circle" className="text-[14px]" /> Auto-resolving
          </span>
        </div>
        <div className="flex flex-col gap-space-sm">
          <label className="font-label-md font-semibold text-on-surface">Store Name</label>
          <div className="relative">
            <Icon name="storefront" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
            <input
              value={name}
              onChange={(e) => onName(e.target.value)}
              placeholder="e.g. Verdant Botanica"
              className="h-11 w-full rounded-lg bg-surface-container-low pl-11 pr-space-md font-body-md text-on-surface transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2.5">
            <div className="flex min-w-0 items-center gap-1.5 font-label-sm">
              <span className="shrink-0 text-on-surface-variant">Global Edge URL:</span>
              <span className="truncate font-mono font-semibold text-primary" title={`${slug || "your-store"}.fern.store`}>{slug || "your-store"}.fern.store</span>
            </div>
            <div className="flex shrink-0 items-center gap-1 whitespace-nowrap font-label-sm font-semibold text-secondary">
              <Icon name="verified" className="text-[16px]" />
              <span>Available globally</span>
            </div>
          </div>
        </div>
        {/* Niche archetypes */}
        <div className="mt-1 flex flex-col gap-space-xs">
          <label className="font-label-md font-medium text-on-surface-variant">Express Niche Archetype (Autoloads typography, tone, & sample taxonomy)</label>
          <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
            {NICHES.map((n, i) => {
              const active = nicheIdx === i;
              return (
                <button
                  key={n.label}
                  type="button"
                  onClick={() => setNicheIdx(i)}
                  className={`flex items-center justify-between gap-2 rounded-lg p-3 text-left font-label-sm transition-colors ${
                    active ? "bg-secondary-container font-semibold text-on-secondary-container shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-[18px]">{n.emoji}</span>
                    <span className="whitespace-nowrap">{n.label}</span>
                  </div>
                  <Icon name={active ? "radio_button_checked" : "radio_button_unchecked"} className={`shrink-0 text-[18px] ${active ? "" : "text-outline"}`} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Step 2: Instant Theme & Archetype */}
      <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-space-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-sm font-bold text-on-primary">2</span>
            <h2 className="truncate font-headline-md font-bold text-primary">Instant Theme & Archetype</h2>
          </div>
          <span className="shrink-0 whitespace-nowrap font-caption text-on-surface-variant">Switch anytime with 0 data loss</span>
        </div>
        <div className="grid grid-cols-1 gap-space-sm md:grid-cols-3">
          {ARCHETYPES.map((a, i) => {
            const active = archIdx === i;
            return (
              <button
                key={a.name}
                type="button"
                onClick={() => {
                  setArchIdx(i);
                  setTheme(a.theme);
                }}
                className={`relative flex cursor-pointer flex-col gap-2 rounded-xl p-space-sm text-left transition-all hover:shadow-md ${
                  active ? "bg-surface-container-low shadow-sm" : "bg-surface-container-lowest hover:bg-surface-container-low"
                }`}
              >
                {/* Miniature preview thumb */}
                <div className="flex h-20 w-full flex-col justify-between overflow-hidden rounded-lg p-2" style={{ background: active ? "#1E3F20" : "#E6E9E4" }}>
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-10 rounded-full" style={{ background: active ? "rgba(255,255,255,0.6)" : "rgba(115,121,112,0.5)" }} />
                    <div className="flex gap-1">
                      <div className="h-1.5 w-3 rounded-full" style={{ background: active ? "rgba(255,255,255,0.4)" : "rgba(115,121,112,0.4)" }} />
                      <div className="h-1.5 w-3 rounded-full" style={{ background: active ? "rgba(255,255,255,0.4)" : "rgba(115,121,112,0.4)" }} />
                    </div>
                  </div>
                  {i === 0 ? (
                    <div className="flex gap-1.5">
                      <div className="h-9 w-1/3 rounded bg-white/30" />
                      <div className="h-9 w-1/3 rounded bg-white/30" />
                      <div className="h-9 w-1/3 rounded bg-white/30" />
                    </div>
                  ) : i === 1 ? (
                    <div className="flex h-9 w-full items-center justify-center rounded bg-white/40">
                      <Icon name="palette" className="text-[16px] text-outline" />
                    </div>
                  ) : (
                    <div className="grid h-9 grid-cols-2 gap-1">
                      <div className="rounded bg-white/40" />
                      <div className="rounded bg-white/40" />
                    </div>
                  )}
                </div>
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                    <Icon name="check" className="text-[14px]" />
                  </span>
                )}
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold ${active ? "text-primary" : "text-on-surface"}`}>{a.name}</span>
                  <span className="line-clamp-1 font-caption text-on-surface-variant">{a.meta}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {a.dots.map((c) => (
                    <span key={c} className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: c }} />
                  ))}
                  {active && <span className="ml-auto text-[10px] font-medium text-on-surface-variant">Selected</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 3: Inventory Seed & AI Stocking */}
      <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-space-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-sm font-bold text-on-primary">3</span>
            <h2 className="truncate font-headline-md font-bold text-primary">Inventory Seed & AI Stocking</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-surface-container p-1 font-label-sm">
            <button
              type="button"
              onClick={() => setSeedMode("ai")}
              className={`whitespace-nowrap rounded-full px-space-sm py-1 ${seedMode === "ai" ? "bg-surface-container-lowest font-semibold text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              AI Auto-Ingest
            </button>
            <button
              type="button"
              onClick={() => setSeedMode("sample")}
              className={`whitespace-nowrap rounded-full px-space-sm py-1 ${seedMode === "sample" ? "bg-surface-container-lowest font-semibold text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Instant Sample Pack
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-lowest p-space-sm shadow-sm">
            <div className="flex min-w-0 items-center gap-space-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                <Icon name="description" className="text-[24px]" />
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[11px] font-bold text-on-surface">{seedMode === "ai" ? "supplier_plants_2026.csv" : "fern_demo_botanicals.csv"}</span>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">AI PARSED</span>
                </div>
                <span className="font-caption text-on-surface-variant">
                  {seedMode === "ai" ? "36 products detected • 4 categories mapped • Auto-tagged botanical images" : "24 demo products loaded • 4 categories mapped • Botanical copy included"}
                </span>
              </div>
            </div>
            <button type="button" className="shrink-0 whitespace-nowrap rounded-full bg-surface-container px-space-md py-1.5 font-label-sm font-semibold text-primary transition-colors hover:bg-surface-container-high">
              Review Map
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap font-caption font-medium text-secondary">
              <Icon name="auto_awesome" className="text-[16px]" />
              <span>AI generated SEO titles, alt texts, & care guides</span>
            </div>
            <button type="button" className="flex items-center gap-1 font-label-sm font-semibold text-primary hover:underline">
              <Icon name="autorenew" className="text-[16px]" />
              <span>{seedMode === "ai" ? "Load 24 Demo Botanicals Instead" : "Switch to Supplier CSV Ingest"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Action bar */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={() => canCreate && doCreate(theme)}
            disabled={!canCreate}
            className="flex items-center gap-2 rounded-full bg-primary-container px-space-lg py-2.5 font-label-lg font-bold text-on-primary shadow-md transition-all hover:bg-primary disabled:opacity-50"
          >
            <Icon name="bolt" className="text-[20px] text-secondary-fixed" />
            <span>{creating ? "Launching…" : "Launch Storefront in 60s"}</span>
          </button>
          <button
            type="button"
            onClick={() => canCreate && doCreate(theme)}
            disabled={!canCreate}
            className="rounded-full bg-surface-container px-space-md py-2.5 font-label-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
          >
            Save as Draft
          </button>
        </div>
        <button type="button" onClick={() => setMode("ai")} className="flex items-center gap-1 font-label-sm font-medium text-on-surface-variant transition-colors hover:text-primary">
          <span>Switch to Deep Customizer</span>
          <Icon name="chevron_right" className="text-[16px]" />
        </button>
      </div>
    </>
  );

  /* ---------------- render ---------------- */

  return (
    <main className="relative min-h-screen bg-surface font-body-md text-on-surface">
      <Sidebar />
      <Topbar />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-[1440px] px-4 pb-space-xl pt-20 lg:px-space-lg lg:pt-16">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex min-w-0 flex-wrap items-center gap-space-xs font-label-md text-on-surface-variant">
              <a href="/" className="flex items-center gap-1 transition-colors hover:text-primary">
                <Icon name="arrow_back" className="text-[16px]" />
                <span>Back to Storefronts</span>
              </a>
              <span className="text-outline-variant">/</span>
              <span className="font-semibold text-on-surface">Storefront Builder</span>
              {mode === "quickstart" && (
                <>
                  <span className="mx-1 inline-block h-1 w-1 rounded-full bg-outline" />
                  <span className="shrink-0 rounded-full bg-secondary-container px-2 py-0.5 font-label-sm font-semibold text-on-secondary-container">Tenant Node #84</span>
                </>
              )}
            </div>
            {mode === "quickstart" && (
              <div className="flex shrink-0 items-center gap-space-xs whitespace-nowrap font-caption text-on-surface-variant">
                <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                <span>Autosaved just now</span>
              </div>
            )}
          </div>

          {/* Title + mode switcher */}
          <div className="mt-6 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div className="min-w-0">
              <h1 className="font-headline-xl font-bold tracking-tight text-primary">Create your new storefront</h1>
              <p className="mt-1 max-w-2xl font-body-md text-on-surface-variant">
                Launch a bespoke, multi-tenant digital store in minutes. Choose how you want to build:
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {switcher}
              <button
                type="button"
                onClick={() => setPreviewOpen((v) => !v)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-label-sm shadow-sm transition-all ${
                  previewOpen ? "bg-primary-container text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon name={previewOpen ? "unfold_less" : "visibility"} className="text-[16px]" />
                <span className="whitespace-nowrap">{previewOpen ? "Hide preview" : "Show preview"}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-space-md rounded-xl border border-error/30 bg-error-container/60 p-3 font-body-sm text-on-error-container">{error}</div>
          )}

          {/* Workspace */}
          <div className="mt-8 grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
            <div className={`flex min-w-0 flex-col gap-space-lg ${previewOpen ? "lg:col-span-7" : "w-full lg:col-span-12 lg:mx-auto lg:max-w-5xl"}`}>
              {mode === "ai" && aiForm}
              {mode === "templates" && templatesForm}
              {mode === "quickstart" && quickstartForm}
            </div>
            <div className={`min-w-0 flex-col gap-space-md ${previewOpen ? "flex lg:sticky lg:top-20 lg:col-span-5" : "hidden"}`}>
              {mode === "quickstart" ? (
                <>
                  <QsPreviewCard name={name} slug={slug} logoUrl={logoUrl} theme={theme} seedMode={seedMode} onMinimize={() => setPreviewOpen(false)} />
                  <ReadinessCard name={name} slug={slug} />
                </>
              ) : (
                <>
                  <AiPreviewCard name={name} slug={slug} logoUrl={logoUrl} theme={theme} onMinimize={() => setPreviewOpen(false)} />
                  <CuratedThemesCard onPick={(t, n) => { setTheme(t); setPickedLabel(n); }} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {!previewOpen && (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-primary-container px-5 py-3 font-label-md text-on-primary shadow-xl transition-all hover:bg-primary"
        >
          <Icon name="visibility" className="text-[18px]" />
          <span className="whitespace-nowrap">Live preview</span>
        </button>
      )}
    </main>
  );
}
