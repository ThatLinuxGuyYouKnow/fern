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
