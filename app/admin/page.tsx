"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Row = { slug: string; name: string; created_at: string };

export default function AdminIndex() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [stores, setStores] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("stores")
        .select("slug,name,created_at")
        .order("created_at", { ascending: false })
        .limit(24);
      setStores((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const go = () => {
    const s = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (s) router.push(`/admin/${s}`);
  };

  return (
    <main className="min-h-screen text-fernink">
      <header className="sticky top-0 z-10 border-b border-[#dde6cf]/80 bg-[#f6f8f0]/85 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-4 py-3.5 sm:px-6 lg:px-10">
          <Link href="/" className="font-display text-[26px] font-semibold tracking-tight text-fern-800">fern</Link>
          <Link href="/create?mode=quickstart" className="fern-btn-primary">
            Create your store →
          </Link>
        </div>
      </header>

      <div className="w-full px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-fern-800">Dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-fern-950 sm:text-5xl">Manage your store</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5b6b58]">Products, orders and theme live under <span className="rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[13px] text-fern-950">/admin/your-slug</span> — pick up where you left off.</p>
        </div>

        <div className="mt-7 flex max-w-3xl gap-2">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") go(); }}
            placeholder="your-store-slug"
            className="fern-input min-w-0 flex-1 !rounded-full !px-5 !py-3 shadow-sm"
          />
          <button onClick={go} disabled={!slug.trim()} className="fern-btn-primary shrink-0 !px-6">
            Open dashboard
          </button>
        </div>

        <h2 className="mt-12 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b6b58]">Recent stores</h2>
        {loading ? (
          <p className="mt-3 text-sm text-neutral-500">Loading…</p>
        ) : stores.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No stores yet — <Link href="/create?mode=quickstart" className="font-semibold text-fern-800 underline">create the first one</Link>.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stores.map((s) => (
              <li key={s.slug} className="fern-card flex items-center gap-3 p-5 transition hover:shadow-lift">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fern-800 to-fern-950 text-sm font-bold text-white">{s.name.slice(0, 2).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-jakarta text-sm font-bold text-fern-950">{s.name}</p>
                  <p className="truncate font-mono text-xs text-[#7a8a72]">{s.slug}.fern.store</p>
                  <span className="mt-2.5 flex gap-2">
                    <Link href={`/s/${s.slug}`} className="rounded-full border border-[#d8e2c6] bg-white px-3.5 py-1.5 text-xs font-medium transition hover:bg-fern-50">
                      View
                    </Link>
                    <Link href={`/admin/${s.slug}`} className="rounded-full bg-fern-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow transition hover:bg-[#175733]">
                      Manage →
                    </Link>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
