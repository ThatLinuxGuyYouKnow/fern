import type { ThemeJson } from "./supabase";

export const TEMPLATES: { id: ThemeJson["template"]; name: string; blurb: string; tagline: string; vibe: string; theme: ThemeJson }[] = [
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Clean whites, single column, big type.",
    tagline: "Beauty & slow living",
    vibe: "Soft, editorial, lots of whitespace. Lets handmade and skincare products breathe.",
    theme: {
      template: "minimal",
      primary: "#111827",
      accent: "#6b7280",
      heroTitle: "Beautiful things, made slowly",
      heroSubtitle: "Shop the collection",
    },
  },
  {
    id: "grid",
    name: "Market Grid",
    blurb: "Dense product grid, price-forward.",
    tagline: "Groceries & variety",
    vibe: "Packed shelves energy. Prices up front, tight cards, browse-everything layout.",
    theme: {
      template: "grid",
      primary: "#166534",
      accent: "#f59e0b",
      heroTitle: "Fresh stock, fair prices",
      heroSubtitle: "Everything you need, in one place",
    },
  },
  {
    id: "bold",
    name: "Bold",
    blurb: "High-contrast hero, oversized imagery.",
    tagline: "Fashion & statement pieces",
    vibe: "Loud type, dramatic shadows, hero-first. For drops, streetwear and sneakers.",
    theme: {
      template: "bold",
      primary: "#7c3aed",
      accent: "#ec4899",
      heroTitle: "Wear the statement",
      heroSubtitle: "New drops weekly",
    },
  },
  {
    id: "minimal",
    name: "Pastel Calm",
    blurb: "Gentle pastels, friendly and airy.",
    tagline: "Wellness & beauty",
    vibe: "Powder-soft palette with rounded edges. Wellness, self-care, bath & body.",
    theme: {
      template: "minimal",
      primary: "#0f766e",
      accent: "#f472b6",
      heroTitle: "Small rituals, every day",
      heroSubtitle: "Browse the apothecary",
    },
  },
  {
    id: "grid",
    name: "Dark Tech",
    blurb: "Near-black canvas, electric accent.",
    tagline: "Gadgets & gear",
    vibe: "Sleek dark mode with neon pops. Accessories, gadgets, gaming gear.",
    theme: {
      template: "grid",
      primary: "#111827",
      accent: "#22d3ee",
      heroTitle: "Built for the backlog",
      heroSubtitle: "New gear, ready to ship",
    },
  },
  {
    id: "bold",
    name: "Sunset Pop",
    blurb: "Warm gradient vibes, playful type.",
    tagline: "Art & lifestyle",
    vibe: "Sunsets and candy colors. Prints, pottery, candles, fun lifestyle goods.",
    theme: {
      template: "bold",
      primary: "#ea580c",
      accent: "#facc15",
      heroTitle: "Made to be noticed",
      heroSubtitle: "Fresh pieces, small batches",
    },
  },
];

const COLORS: Record<string, string> = {
  green: "#166534", emerald: "#059669", blue: "#1d4ed8", navy: "#1e3a8a",
  red: "#dc2626", black: "#111827", purple: "#7c3aed", pink: "#ec4899",
  orange: "#ea580c", amber: "#f59e0b", teal: "#0d9488", gold: "#b45309",
};

/**
 * Mock AI theme generator. Same ThemeJson schema the real LLM will return —
 * swap the body of /api/ai/generate-theme to call an LLM later, no client change.
 */
export function mockGenerateTheme(description: string, storeName: string): { theme: ThemeJson; notes: string[] } {
  const d = description.toLowerCase();
  const notes: string[] = [];
  let template: ThemeJson["template"] = "minimal";
  if (/(grid|grocery|market|food|snack|variety|shop all)/.test(d)) template = "grid";
  else if (/(bold|fashion|streetwear|sneaker|statement|drop|edgy|loud)/.test(d)) template = "bold";
  notes.push(`template=${template} (mock keyword match)`);

  let primary = TEMPLATES.find((t) => t.id === template)!.theme.primary;
  for (const [word, hex] of Object.entries(COLORS)) {
    if (d.includes(word)) {
      primary = hex;
      notes.push(`primary=${hex} (matched "${word}")`);
      break;
    }
  }

  const heroTitle = description.trim()
    ? `${storeName} — ${description.trim().slice(0, 60)}`
    : TEMPLATES[0].theme.heroTitle;

  return {
    theme: {
      template,
      primary,
      accent: template === "grid" ? "#f59e0b" : "#6b7280",
      heroTitle,
      heroSubtitle: "Shop the collection",
    },
    notes,
  };
}
