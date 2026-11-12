import type { ThemeJson } from "@/lib/supabase";
import { FONT_STACKS, RADIUS, resolveStyle, textOn } from "@/lib/themes";

const DEMO = [
  { img: "/mocks/prod_monstera.png", n: "Monstera Albo", p: "$64.00" },
  { img: "/mocks/prod_fiddle.png", n: "Fiddle Leaf Fig", p: "$48.00" },
  { img: "/mocks/prod_planter.png", n: "Clay Planter", p: "$34.00" },
];

/**
 * Mini storefront rendered with a theme's real tokens (font, bg, hero and
 * card treatment) — used anywhere a preset is picked or previewed, so what
 * you click is what the live store looks like.
 */
export default function TemplatePreview({
  theme,
  storeName = "Your store",
  logoUrl,
}: {
  theme: ThemeJson;
  storeName?: string;
  logoUrl?: string | null;
}) {
  const s = resolveStyle(theme);
  const radius = RADIUS[s.radius];
  const onPrimary = textOn(theme.primary);
  const heroImg = DEMO[0].img;

  const cardStyle: React.CSSProperties =
    s.card === "brutal"
      ? { background: s.surface, border: `2px solid ${s.ink}`, borderRadius: radius, boxShadow: `3px 3px 0 ${s.ink}` }
      : s.card === "bordered"
        ? { background: s.surface, border: `1px solid ${s.ink}33`, borderRadius: radius }
        : s.card === "flat"
          ? { background: "transparent", borderTop: `1px solid ${s.ink}40`, borderRadius: 0 }
          : { background: s.surface, borderRadius: radius, boxShadow: "0 4px 14px rgba(0,0,0,0.10)" };

  return (
    <div
      className="overflow-hidden text-left"
      style={{ background: s.bg, color: s.ink, fontFamily: FONT_STACKS[s.font], borderRadius: radius }}
      aria-hidden
    >
      {/* store bar */}
      <div className="flex items-center gap-1.5 px-3 pt-2.5">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden text-[10px] font-bold"
          style={{ background: theme.primary, color: onPrimary, borderRadius: Math.min(6, parseInt(radius) || 2) }}
        >
          {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : (storeName.trim()[0] || "F").toUpperCase()}
        </span>
        <span className="truncate text-[11px] font-bold">{storeName}</span>
        <span className="ml-auto text-[9px] uppercase tracking-widest opacity-50">fern.store</span>
      </div>

      {/* hero */}
      {s.hero === "centered" ? (
        <div className="px-3 pb-1 pt-3 text-center">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>{theme.heroSubtitle}</p>
          <p className={`mt-1 font-bold leading-tight ${s.font === "serif" ? "text-[17px]" : "text-[15px]"}`}>{theme.heroTitle}</p>
          <span className="mt-2 inline-block px-2.5 py-1 text-[9px] font-bold" style={{ background: theme.primary, color: onPrimary, borderRadius: radius }}>
            Shop collection
          </span>
        </div>
      ) : s.hero === "split" ? (
        <div className="mx-3 mt-2.5 grid grid-cols-[1.2fr_1fr] overflow-hidden" style={{ background: theme.primary, color: onPrimary, borderRadius: radius }}>
          <div className="p-2.5">
            <p className="text-[13px] font-bold uppercase leading-[1.05]">{theme.heroTitle}</p>
            <p className="mt-1 text-[8px] opacity-75">{theme.heroSubtitle}</p>
            <span className="mt-1.5 inline-block px-2 py-0.5 text-[8px] font-bold" style={{ background: theme.accent, color: textOn(theme.accent), borderRadius: radius }}>Shop now</span>
          </div>
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
        </div>
      ) : s.hero === "cover" ? (
        <div className="relative mx-3 mt-2.5 overflow-hidden" style={{ borderRadius: radius }}>
          <img src={heroImg} alt="" className="h-20 w-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end bg-black/45 p-2.5 text-white">
            <p className="text-[13px] font-bold leading-tight">{theme.heroTitle}</p>
            <p className="text-[8px] opacity-80">{theme.heroSubtitle}</p>
          </div>
        </div>
      ) : (
        <div className="mx-3 mt-2.5 px-2.5 py-2" style={{ background: theme.primary, color: onPrimary, borderRadius: radius }}>
          <p className="truncate text-[13px] font-bold leading-tight">{theme.heroTitle}</p>
          <p className="truncate text-[8px] opacity-80">{theme.heroSubtitle}</p>
        </div>
      )}

      {/* products */}
      <div className={`grid grid-cols-3 px-3 pb-3 pt-2.5 ${s.density === "compact" ? "gap-1.5" : "gap-2"}`}>
        {DEMO.map((p) => (
          <div key={p.n} className="p-1.5" style={cardStyle}>
            <img src={p.img} alt="" className="h-9 w-full object-cover" style={{ borderRadius: s.card === "flat" ? 0 : radius }} />
            <p className="mt-1 truncate text-[9px] font-semibold">{p.n}</p>
            <p className="text-[9px] font-bold" style={{ color: s.card === "brutal" || s.hero === "cover" ? s.ink : theme.accent }}>{p.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
