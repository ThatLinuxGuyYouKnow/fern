"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const GREEN = "#1e6b3f";

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
    <main className="min-h-screen bg-[#faf9f6] text-neutral-900">
      <header className="border-b bg-[#faf9f6]/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold" style={{ color: GREEN }}>fern</Link>
          <Link href="/create?mode=quickstart" className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: GREEN }}>
            Create your store →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Manage your store</h1>
        <p className="mt-1 text-neutral-600">Products, orders and theme live under <span className="font-mono">/admin/your-slug</span> — pick up where you left off.</p>

        <div className="mt-6 flex gap-2">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") go(); }}
            placeholder="your-store-slug"
            className="min-w-0 flex-1 rounded-full border bg-white px-5 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
          <button onClick={go} disabled={!slug.trim()} className="rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: GREEN }}>
            Open dashboard
          </button>
        </div>

        <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-neutral-500">Recent stores</h2>
        {loading ? (
          <p className="mt-3 text-sm text-neutral-500">Loading…</p>
        ) : stores.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No stores yet — <Link href="/create?mode=quickstart" className="font-semibold underline" style={{ color: GREEN }}>create the first one</Link>.</p>
        ) : (
          <ul className="mt-3 divide-y rounded-2xl border bg-white">
            {stores.map((s) => (
              <li key={s.slug} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.name}</p>
                  <p className="truncate font-mono text-xs text-neutral-500">{s.slug}</p>
                </div>
                <Link href={`/s/${s.slug}`} className="rounded-full border px-4 py-1.5 text-xs font-medium hover:bg-neutral-50">
                  View
                </Link>
                <Link href={`/admin/${s.slug}`} className="rounded-full px-4 py-1.5 text-xs font-semibold text-white" style={{ background: GREEN }}>
                  Manage
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
