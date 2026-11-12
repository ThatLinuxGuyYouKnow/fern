import type { ThemeJson, ThemeStyle } from "./supabase";

export type Preset = {
  id: ThemeJson["template"];
  name: string;
  blurb: string;
  tagline: string;
  vibe: string;
  bestFor: string[];
  theme: ThemeJson;
};

/**
 * Preset templates. A preset is a full design — layout (hero/card/density),
 * typeface, page background and ink — not just two colors on the same page.
 * The `template` field stays the coarse layout family for backwards compat
 * (AI generator + old stores); `style` carries the rest.
 */
export const TEMPLATES: Preset[] = [
  {
    id: "minimal",
    name: "Verdant Atelier",
    blurb: "Serif editorial on warm cream, centered hero, room to breathe.",
    tagline: "Plants, ceramics & slow goods",
    vibe: "Gallery-calm. Big serif headlines, soft cards, gold details.",
    bestFor: ["Plants", "Ceramics", "Handmade"],
    theme: {
      template: "minimal",
      primary: "#1E3F20",
      accent: "#B07D3C",
      heroTitle: "Good things grow here",
      heroSubtitle: "Specimen plants and stoneware, shipped with care",
      style: { font: "serif", bg: "#FAF6EE", surface: "#FFFFFF", ink: "#1C2A1E", hero: "centered", card: "soft", radius: "soft", density: "airy" },
    },
  },
  {
    id: "minimal",
    name: "Rose Boutique",
    blurb: "Blush tones, elegant serif, pillowy cards and soft shadows.",
    tagline: "Beauty & wellness",
    vibe: "Boutique shelf energy. Bordeaux and rose, unhurried and premium.",
    bestFor: ["Skincare", "Candles", "Wellness"],
    theme: {
      template: "minimal",
      primary: "#7C2D3E",
      accent: "#C98A9B",
      heroTitle: "Small rituals, every day",
      heroSubtitle: "Cold-process soaps, oils and bath goods in small batches",
      style: { font: "serif", bg: "#FBF3F0", surface: "#FFFFFF", ink: "#3A2027", hero: "centered", card: "soft", radius: "round", density: "airy" },
    },
  },
  {
    id: "bold",
    name: "Noir Drop",
    blurb: "Near-black canvas, huge grotesk type, acid accent, hard shadows.",
    tagline: "Streetwear & limited drops",
    vibe: "Drop culture. Oversized uppercase headlines, split hero, no rounded corners.",
    bestFor: ["Streetwear", "Sneakers", "Limited drops"],
    theme: {
      template: "bold",
      primary: "#101012",
      accent: "#D7FF3E",
      heroTitle: "Next drop lands Friday",
      heroSubtitle: "Limited runs. No restocks, no exceptions",
      style: { font: "grotesk", bg: "#0A0A0B", surface: "#17171A", ink: "#F4F4EF", hero: "split", card: "brutal", radius: "sharp", density: "regular" },
    },
  },
  {
    id: "bold",
    name: "Sunset Pop",
    blurb: "Warm peach backdrop, chunky borders, playful hard-shadow cards.",
    tagline: "Art, prints & lifestyle",
    vibe: "Market-stall joy. Thick outlines, candy accent, cards that pop off the page.",
    bestFor: ["Art prints", "Pottery", "Gifts"],
    theme: {
      template: "bold",
      primary: "#C2410C",
      accent: "#FFB224",
      heroTitle: "Made to be noticed",
      heroSubtitle: "Fresh pieces in small, loud batches",
      style: { font: "grotesk", bg: "#FFF4E0", surface: "#FFFBF0", ink: "#2B1602", hero: "centered", card: "brutal", radius: "round", density: "regular" },
    },
  },
  {
    id: "grid",
    name: "Market Day",
    blurb: "Dense price-forward grid, compact cards, stock badges up front.",
    tagline: "Groceries & variety stores",
    vibe: "Packed shelves, honest prices. Everything scannable in seconds.",
    bestFor: ["Groceries", "Pantry", "Variety"],
    theme: {
      template: "grid",
      primary: "#166534",
      accent: "#F59E0B",
      heroTitle: "Fresh stock, fair prices",
      heroSubtitle: "Everything you need, in one place",
      style: { font: "sans", bg: "#F2F7EF", surface: "#FFFFFF", ink: "#182418", hero: "banner", card: "bordered", radius: "soft", density: "compact" },
    },
  },
  {
    id: "grid",
    name: "Sunrise Market",
    blurb: "Built for Sunrise Fresh Market — banner hero, compact price-forward grid, stock badges up front.",
    tagline: "Fresh groceries & pantry staples",
    vibe: "Restocked at dawn. Deep market green, sunrise amber, everything scannable in seconds.",
    bestFor: ["Groceries", "Fresh food", "Pantry"],
    theme: {
      template: "grid",
      primary: "#14532D",
      accent: "#F59E0B",
      heroTitle: "Fresh this morning, fair all day",
      heroSubtitle: "Fruit, veg, bakery & pantry — restocked at sunrise",
      style: { font: "sans", bg: "#F6F7E9", surface: "#FFFFFF", ink: "#1A2E1D", hero: "banner", card: "bordered", radius: "soft", density: "compact" },
    },
  },
  {
    id: "grid",
    name: "Neon Arcade",
    blurb: "Deep-space navy, mono labels, glowing cyan accents, tight grid.",
    tagline: "Gadgets & gaming gear",
    vibe: "After-dark tech. Dark surfaces, electric borders, spec-sheet density.",
    bestFor: ["Gadgets", "Gaming", "Accessories"],
    theme: {
      template: "grid",
      primary: "#0B1220",
      accent: "#22D3EE",
      heroTitle: "Built for the backlog",
      heroSubtitle: "New gear, ready to ship tonight",
      style: { font: "mono", bg: "#060B16", surface: "#0D1729", ink: "#E4F0FF", hero: "banner", card: "bordered", radius: "sharp", density: "compact" },
    },
  },
  {
    id: "minimal",
    name: "Paper Catalog",
    blurb: "Monospace index cards on newsprint — flat, listed, zero decoration.",
    tagline: "Books, records & vintage",
    vibe: "Archive catalogue. Ruled lines, numbered stock, typewriter type.",
    bestFor: ["Books", "Vinyl", "Vintage"],
    theme: {
      template: "minimal",
      primary: "#23201B",
      accent: "#B45309",
      heroTitle: "Catalogue No. 04 — New Arrivals",
      heroSubtitle: "Second-hand and small-press, catalogued weekly",
      style: { font: "mono", bg: "#F4F0E4", surface: "#FDFBF3", ink: "#23201B", hero: "banner", card: "flat", radius: "sharp", density: "compact" },
    },
  },
  {
    id: "minimal",
    name: "Gallery Wall",
    blurb: "White-wall minimalism, full-bleed cover hero, art does the talking.",
    tagline: "Photography & prints",
    vibe: "Exhibition space. One huge image up top, quiet text, flat product tiles.",
    bestFor: ["Photography", "Prints", "Originals"],
    theme: {
      template: "minimal",
      primary: "#111111",
      accent: "#111111",
      heroTitle: "Works on paper",
      heroSubtitle: "Signed prints, shipped flat worldwide",
      style: { font: "sans", bg: "#FFFFFF", surface: "#FFFFFF", ink: "#111111", hero: "cover", card: "flat", radius: "sharp", density: "airy" },
    },
  },
];

/** Fallback tokens for themes saved before `style` existed (or AI-generated ones). */
const TEMPLATE_DEFAULTS: Record<ThemeJson["template"], ThemeStyle> = {
  minimal: TEMPLATES[0].theme.style!,
  grid: TEMPLATES[4].theme.style!,
  bold: TEMPLATES[2].theme.style!,
};

export function resolveStyle(theme: ThemeJson): ThemeStyle {
  return theme.style ?? TEMPLATE_DEFAULTS[theme.template] ?? TEMPLATE_DEFAULTS.minimal;
}

export const FONT_STACKS: Record<ThemeStyle["font"], string> = {
  sans: "Inter, system-ui, sans-serif",
  serif: "'Fraunces', Georgia, 'Times New Roman', serif",
  grotesk: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif",
  mono: "'Space Mono', 'Geist Mono', ui-monospace, monospace",
};

export const RADIUS: Record<ThemeStyle["radius"], string> = {
  sharp: "2px",
  soft: "14px",
  round: "24px",
};

/** Readable text color (near-black or white) on top of a hex background. */
export function textOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#FFFFFF";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? "#181510" : "#FFFFFF";
}

const COLORS: Record<string, string> = {
  green: "#166534", emerald: "#059669", blue: "#1d4ed8", navy: "#1e3a8a",
  red: "#dc2626", black: "#111827", purple: "#7c3aed", pink: "#ec4899",
  orange: "#ea580c", amber: "#f59e0b", teal: "#0d9488", gold: "#b45309",
};

const PRESET_MATCHES: { re: RegExp; name: string }[] = [
  { re: /(groc|market|food|snack|pantry|variety|produce|farm|fresh)/, name: "Sunrise Market" },
  { re: /(streetwear|sneaker|fashion|drop|edgy|loud|hype)/, name: "Noir Drop" },
  { re: /(beauty|skincare|wellness|candle|soap|bath|perfume|cosmetic)/, name: "Rose Boutique" },
  { re: /(gadget|tech|gaming|gear|electronic|accessor)/, name: "Neon Arcade" },
  { re: /(book|vinyl|record|vintage|second.?hand|antique)/, name: "Paper Catalog" },
  { re: /(photo|print|art|poster|gallery|paint)/, name: "Gallery Wall" },
  { re: /(fun|playful|gift|toy|party|colorful)/, name: "Sunset Pop" },
];

/**
 * Mock AI theme generator. Same ThemeJson schema the real LLM returns —
 * picks a full preset (layout + tokens), then applies explicit color words.
 */
export function mockGenerateTheme(description: string, storeName: string): { theme: ThemeJson; notes: string[] } {
  const d = description.toLowerCase();
  const notes: string[] = [];

  let preset = TEMPLATES[0];
  for (const m of PRESET_MATCHES) {
    if (m.re.test(d)) {
      preset = TEMPLATES.find((t) => t.name === m.name) ?? preset;
      break;
    }
  }
  const theme: ThemeJson = { ...preset.theme, style: preset.theme.style ? { ...preset.theme.style } : undefined };
  notes.push(`preset=${preset.name} (mock keyword match)`);

  for (const [word, hex] of Object.entries(COLORS)) {
    if (d.includes(word)) {
      theme.primary = hex;
      notes.push(`primary=${hex} (matched "${word}")`);
      break;
    }
  }

  if (description.trim()) {
    theme.heroTitle = `${storeName} — ${description.trim().slice(0, 60)}`;
    theme.heroSubtitle = preset.theme.heroSubtitle;
  }
  return { theme, notes };
}
