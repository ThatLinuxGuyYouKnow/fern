import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const store_id = searchParams.get("store_id");
  if (!store_id) return NextResponse.json({ error: "store_id required" }, { status: 400 });
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store_id)
    .order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const store_id = body?.store_id as string | undefined;
  const products = body?.products as
    | { name: string; price_cents: number; image_url: string | null; description: string; stock: number }[]
    | undefined;
  if (!store_id || !Array.isArray(products) || products.length === 0)
    return NextResponse.json({ error: "store_id + products[] required" }, { status: 400 });
  for (const p of products) {
    if (!p.name || !Number.isInteger(p.price_cents) || p.price_cents < 0)
      return NextResponse.json({ error: `invalid product: ${p.name || "?"}` }, { status: 400 });
  }
  const { data: existing, error: posErr } = await supabase
    .from("products")
    .select("position")
    .eq("store_id", store_id)
    .order("position", { ascending: false })
    .limit(1);
  if (posErr) return NextResponse.json({ error: posErr.message }, { status: 500 });
  const base = existing?.[0]?.position != null ? Number(existing[0].position) + 1 : 0;
  const rows = products.map((p, i) => ({
    store_id,
    name: p.name,
    price_cents: p.price_cents,
    image_url: p.image_url ?? null,
    description: p.description ?? "",
    stock: p.stock ?? 0,
    position: base + i,
  }));
  const { data, error } = await supabase.from("products").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
