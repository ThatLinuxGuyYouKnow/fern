import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  console.warn("Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY");
}

export const supabase = createClient(url, anon);

export type Store = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  theme_json: ThemeJson;
  created_at: string;
};

export type ThemeJson = {
  template: "minimal" | "grid" | "bold";
  primary: string;
  accent: string;
  heroTitle: string;
  heroSubtitle: string;
};

export type Product = {
  id: string;
  store_id: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  description: string;
  stock: number;
};

export type Order = {
  id: string;
  store_id: string;
  paypal_order_id: string | null;
  status: string;
  total_cents: number;
  currency: string;
  items: { id: string; name: string; price_cents: number; qty: number }[];
  created_at: string;
};

export const cents = (usd: number) => Math.round(usd * 100);
export const dollars = (c: number) => (c / 100).toFixed(2);

/** HTTP statuses worth one more attempt (transient edge/origin blips, e.g. Supabase 521). */
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504, 521, 522, 523, 524]);

function retryableStatus(v: unknown): boolean {
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isInteger(n) && RETRYABLE_STATUS.has(n);
}

/** True for network-level failures ("fetch failed", reset, timeout, DNS) and transient 5xx. */
export function isRetryableSupabaseError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as Record<string, unknown>;
  if (retryableStatus(err.status) || retryableStatus(err.statusCode)) return true;
  const parts = [err.message, err.code, err.details, (err as { cause?: unknown }).cause]
    .filter((p): p is string | Error => typeof p === "string" || p instanceof Error)
    .map((p) => String(p instanceof Error ? p.message : p));
  return /fetch failed|network|econnreset|etimedout|enotfound|eai_again|econnrefused|socket hang up|timeout|temporarily unavailable/i.test(
    parts.join(" ")
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run fn up to `tries` times, retrying transient Supabase failures with backoff.
 * Supabase-js surfaces network breaks BOTH as thrown exceptions and as returned
 * { error } objects, so both shapes are retried. Safe for slug inserts: the
 * UNIQUE(slug) constraint makes a replayed insert fail 409 instead of doubling.
 */
export async function withSupabaseRetry<T>(
  fn: () => PromiseLike<T>,
  opts: { tries?: number; baseMs?: number } = {}
): Promise<T> {
  const tries = Math.max(1, opts.tries ?? 3);
  const baseMs = opts.baseMs ?? 400;
  let last: unknown = null;
  for (let attempt = 0; attempt < tries; attempt++) {
    if (attempt > 0) await sleep(baseMs * 2 ** (attempt - 1));
    try {
      const res = await fn();
      const err = (res as { error?: unknown } | null)?.error;
      if (err && isRetryableSupabaseError(err) && attempt < tries - 1) {
        last = err;
        continue;
      }
      return res;
    } catch (e) {
      last = e;
      if (!isRetryableSupabaseError(e) || attempt === tries - 1) throw e;
    }
  }
  throw last;
}
