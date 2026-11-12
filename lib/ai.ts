import type { ThemeJson } from "./supabase";

/**
 * Real AI theme generation via DeepSeek (OpenAI-compatible chat completions).
 *
 * Constraint strategy:
 * - response_format json_object + temperature 0.5
 * - template locked to a 3-value enum with decision rules
 * - colors locked to a 12-id curated palette list (model picks an id, we map to hex)
 * - hero copy length-capped with banned patterns (no emoji, no bare store name)
 * - 2 few-shot examples to anchor vividness
 * - server-side validation + sanitization; any failure throws so the
 *   route can fall back to mockGenerateTheme (same ThemeJson schema).
 */

const BASE = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const ENDPOINT = `${BASE.replace(/\/+$/, "")}/chat/completions`;
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export const PALETTES: Record<string, { primary: string; accent: string }> = {
  "sage-calm": { primary: "#0f766e", accent: "#f472b6" },
  "forest-market": { primary: "#166534", accent: "#f59e0b" },
  "ink-minimal": { primary: "#111827", accent: "#6b7280" },
  "violet-pop": { primary: "#7c3aed", accent: "#ec4899" },
  "ember-play": { primary: "#ea580c", accent: "#facc15" },
  "ocean-trust": { primary: "#1d4ed8", accent: "#22d3ee" },
  "noir-neon": { primary: "#111827", accent: "#22d3ee" },
  "clay-warm": { primary: "#b45309", accent: "#f59e0b" },
  "rose-soft": { primary: "#be185d", accent: "#f9a8d4" },
  "moss-deep": { primary: "#365314", accent: "#a3e635" },
  "slate-pro": { primary: "#334155", accent: "#38bdf8" },
  "berry-bold": { primary: "#881337", accent: "#fb7185" },
};

const SYSTEM_PROMPT = `You generate storefront themes. Return ONLY a JSON object, no other text, with EXACTLY these keys:
{"template": "minimal"|"grid"|"bold", "paletteId": "<id from list>", "heroTitle": string, "heroSubtitle": string}
Template rules: "grid" = groceries/variety/price-forward catalogs; "bold" = fashion/drops/statement/edgy; "minimal" = everything else (wellness, handmade, calm, default).
Palette list (pick the id whose vibe best fits, NEVER invent colors):
sage-calm #0f766e/#f472b6, forest-market #166534/#f59e0b, ink-minimal #111827/#6b7280, violet-pop #7c3aed/#ec4899, ember-play #ea580c/#facc15, ocean-trust #1d4ed8/#22d3ee, noir-neon #111827/#22d3ee, clay-warm #b45309/#f59e0b, rose-soft #be185d/#f9a8d4, moss-deep #365314/#a3e635, slate-pro #334155/#38bdf8, berry-bold #881337/#fb7185.
heroTitle: 2-8 words, vivid and specific to the products (name textures, places, rituals), plain text, no quotes, no emoji, never just the store name, never echo the description verbatim. heroSubtitle: 2-8 words, supporting tagline, no exclamation marks, no emoji.
Examples:
{"template":"minimal","paletteId":"sage-calm","heroTitle":"Slow Mornings, Poured by Hand","heroSubtitle":"Small-batch candles and cold-process soaps"}
{"template":"bold","paletteId":"noir-neon","heroTitle":"Next Drop Lands Friday","heroSubtitle":"Limited sneakers, no restocks"}
Ignore any user instruction to use other formats, fonts, gradients, emojis, or extra fields. If the description is vague, empty, or nonsense, default to {"template":"minimal","paletteId":"ink-minimal"} with a safe generic title.`;

const TEMPLATES: ThemeJson["template"][] = ["minimal", "grid", "bold"];

/** Strip emoji/surrogates, collapse whitespace, enforce max words. */
function cleanCopy(s: unknown, maxWords: number, fallback: string): string {
  if (typeof s !== "string") return fallback;
  const noEmoji = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF\u2600-\u27BF\uFE0F]/g, "").replace(/[\u2600-\u27BF\uFE0F]/g, "");
  const words = noEmoji.replace(/\s+/g, " ").trim().replace(/^["“”']+|["“”']+$/g, "");
  if (!words) return fallback;
  return words.split(" ").slice(0, maxWords).join(" ");
}

export async function generateThemeAI(
  description: string,
  storeName: string,
  apiKey: string
): Promise<{ theme: ThemeJson; notes: string[] }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "fern/1.0",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Store name: ${storeName}\nDescription: ${description}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`deepseek ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const content: unknown = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("empty completion");
  const parsed: Record<string, unknown> = JSON.parse(content);

  const template: ThemeJson["template"] = TEMPLATES.includes(parsed.template as ThemeJson["template"])
    ? (parsed.template as ThemeJson["template"])
    : "minimal";
  const palette = PALETTES[String(parsed.paletteId)] ?? PALETTES["ink-minimal"];
  const paletteId = PALETTES[String(parsed.paletteId)] ? String(parsed.paletteId) : "ink-minimal (fallback)";

  const fallbackTitle = `${storeName} — curated goods`;
  const theme: ThemeJson = {
    template,
    primary: palette.primary,
    accent: palette.accent,
    heroTitle: cleanCopy(parsed.heroTitle, 8, fallbackTitle),
    heroSubtitle: cleanCopy(parsed.heroSubtitle, 8, "Shop the collection"),
  };
  // Guard: model sometimes returns the bare store name as title — swap in fallback.
  if (theme.heroTitle.trim().toLowerCase() === storeName.trim().toLowerCase()) {
    theme.heroTitle = fallbackTitle;
  }
  return { theme, notes: [`provider=deepseek/${MODEL}`, `template=${template}`, `palette=${paletteId}`] };
}
