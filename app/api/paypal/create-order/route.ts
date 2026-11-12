import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createPaypalOrder, type CartItem } from "@/lib/paypal";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const store_id = body?.store_id as string | undefined;
  const items = body?.items as CartItem[] | undefined;
  const currency = (body?.currency as string | undefined) ?? "USD";
  if (!store_id || !Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "store_id + items[] required" }, { status: 400 });

  const total_cents = items.reduce((s, i) => s + i.price_cents * i.qty, 0);
  let paypal: { id: string; dummy: boolean };
  try {
    const { data: store } = await supabase
      .from("stores")
      .select("paypal_merchant_id")
      .eq("id", store_id)
      .single();
    paypal = await createPaypalOrder(items, currency, {
      payeeMerchantId:
        (store as { paypal_merchant_id?: string } | null)?.paypal_merchant_id ?? undefined,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "paypal error" }, { status: 502 });
  }
  const { data, error } = await supabase
    .from("orders")
    .insert({ store_id, paypal_order_id: paypal.id, status: "created", total_cents, currency, items })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data, paypal_order_id: paypal.id, dummy: paypal.dummy });
}
