import { supabase } from "./supabase";

/** Best-effort POST to a store's webhook URL (e.g. a Zapier catch hook) on paid orders. */
export async function notifyWebhook(store_id: string, order_id: string) {
  const { data: store } = await supabase
    .from("stores")
    .select("webhook_url")
    .eq("id", store_id)
    .single();
  const url = (store as { webhook_url?: string } | null)?.webhook_url;
  if (!url || !/^https?:\/\//.test(url)) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "order.paid",
        store_id,
        order_id,
        at: new Date().toISOString(),
      }),
    });
  } catch {
    /* best-effort */
  }
}
