import { supabase } from "./supabase";

export const RESERVED_SLUGS = new Set([
  "www", "app", "api", "admin", "new", "create", "s", "static", "assets",
  "_next", "favicon", "duckdns",
]);

/** Extract tenant slug from a Host header given the apex/root domain. */
export function slugFromHost(host: string | null, rootDomain: string): string | null {
  if (!host) return null;
  const h = host.split(":")[0].toLowerCase();
  const root = rootDomain.split(":")[0].toLowerCase();
  if (h === root || h === `www.${root}`) return null;
  // nip.io / sslip.io style: <slug>.<ip>.nip.io
  if (h.endsWith(".nip.io") || h.endsWith(".sslip.io")) {
    const parts = h.split(".");
    if (parts.length >= 6) return parts[0]; // slug.1.2.3.4.nip.io
    return null;
  }
  if (h.endsWith(`.${root}`)) {
    const sub = h.slice(0, h.length - root.length - 1);
    if (!sub || sub.includes(".") || RESERVED_SLUGS.has(sub)) return null;
    return sub;
  }
  return null;
}

export async function getStoreBySlug(slug: string) {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data;
}
