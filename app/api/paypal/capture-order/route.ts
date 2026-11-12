import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { capturePaypalOrder } from "@/lib/paypal";
import { notifyWebhook } from "@/lib/webhook";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const id = body?.order_id as string | undefined; // our DB id
  if (!id) return NextResponse.json({ error: "order_id required" }, { status: 400 });

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (!order.paypal_order_id)
    return NextResponse.json({ error: "no paypal order attached" }, { status: 400 });

  try {
    const cap = await capturePaypalOrder(order.paypal_order_id);
    const { data, error } = await supabase
      .from("orders")
      .update({ status: cap.status === "COMPLETED" ? "paid" : "failed", buyer_email: cap.email ?? null })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (data.status === "paid") await notifyWebhook(data.store_id, id);
    return NextResponse.json({ order: data, dummy: cap.dummy });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "capture error" }, { status: 502 });
  }
}
