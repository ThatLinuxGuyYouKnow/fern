import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { createPaypalOrder, capturePaypalOrder } from "@/lib/paypal";
import { notifyWebhook } from "@/lib/webhook";
import { dollars } from "@/lib/supabase";

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });

const handler = createMcpHandler((server) => {
  server.registerTool(
    "get_store",
    {
      description: "Get a fern storefront by its slug (name, logo, theme).",
      inputSchema: z.object({ slug: z.string().describe("store slug, e.g. 'muse'") }),
    },
    async ({ slug }) => {
      const { data } = await supabase
        .from("stores")
        .select("slug,name,logo_url,theme_json")
        .eq("slug", slug)
        .single();
      if (!data) return text(`store not found: ${slug}`);
      return text(JSON.stringify(data));
    }
  );

  server.registerTool(
    "list_products",
    {
      description: "List all products of a store with prices (USD), stock and ids.",
      inputSchema: z.object({ slug: z.string().describe("store slug") }),
    },
    async ({ slug }) => {
      const { data: store } = await supabase.from("stores").select("id").eq("slug", slug).single();
      if (!store) return text(`store not found: ${slug}`);
      const { data } = await supabase
        .from("products")
        .select("id,name,price_cents,description,stock,image_url")
        .eq("store_id", store.id)
        .order("position");
      return text(
        JSON.stringify((data ?? []).map((p) => ({ ...p, price_usd: dollars(p.price_cents) })))
      );
    }
  );

  server.registerTool(
    "search_products",
    {
      description: "Search products of a store by keyword (name/description).",
      inputSchema: z.object({
        slug: z.string().describe("store slug"),
        query: z.string().describe("keyword, e.g. 'shea'"),
      }),
    },
    async ({ slug, query }) => {
      const { data: store } = await supabase.from("stores").select("id").eq("slug", slug).single();
      if (!store) return text(`store not found: ${slug}`);
      const { data } = await supabase
        .from("products")
        .select("id,name,price_cents,description,stock")
        .eq("store_id", store.id)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      return text(
        JSON.stringify((data ?? []).map((p) => ({ ...p, price_usd: dollars(p.price_cents) })))
      );
    }
  );

  server.registerTool(
    "create_order",
    {
      description:
        "Start a purchase: creates a fern order + PayPal order. Returns IDs the buyer approves (PayPal) before capture.",
      inputSchema: z.object({
        slug: z.string().describe("store slug"),
        items: z
          .array(z.object({ product_id: z.string(), qty: z.number().int().min(1) }))
          .min(1)
          .describe("products to buy"),
      }),
    },
    async ({ slug, items }) => {
      const { data: store } = await supabase.from("stores").select("id").eq("slug", slug).single();
      if (!store) return text(`store not found: ${slug}`);
      const ids = items.map((i: { product_id: string }) => i.product_id);
      const { data: products } = await supabase
        .from("products")
        .select("id,name,price_cents,stock")
        .eq("store_id", store.id)
        .in("id", ids);
      const byId = new Map((products ?? []).map((p) => [p.id, p]));
      for (const i of items as { product_id: string; qty: number }[]) {
        const p = byId.get(i.product_id);
        if (!p) return text(`product not found: ${i.product_id}`);
        if (p.stock < i.qty) return text(`insufficient stock for ${p.name} (have ${p.stock})`);
      }
      const lines = (items as { product_id: string; qty: number }[]).map((i) => {
        const p = byId.get(i.product_id)!;
        return { id: p.id, name: p.name, price_cents: p.price_cents, qty: i.qty };
      });
      const total_cents = lines.reduce((s, l) => s + l.price_cents * l.qty, 0);
      const paypal = await createPaypalOrder(lines, "USD");
      const { data: order, error } = await supabase
        .from("orders")
        .insert({ store_id: store.id, paypal_order_id: paypal.id, status: "created", total_cents, items: lines })
        .select()
        .single();
      if (error) return text(`order save failed: ${error.message}`);
      return text(
        JSON.stringify({
          fern_order_id: order.id,
          paypal_order_id: paypal.id,
          total_usd: dollars(total_cents),
          dummy_payment: paypal.dummy,
          next: paypal.dummy
            ? "call pay_order with fern_order_id to simulate capture"
            : "buyer approves the PayPal order, then call pay_order with fern_order_id",
        })
      );
    }
  );

  server.registerTool(
    "pay_order",
    {
      description:
        "Capture payment for a created order (PayPal capture; simulated when PayPal keys are placeholders).",
      inputSchema: z.object({ fern_order_id: z.string().describe("fern order id from create_order") }),
    },
    async ({ fern_order_id }) => {
      const { data: order } = await supabase.from("orders").select("*").eq("id", fern_order_id).single();
      if (!order) return text(`order not found: ${fern_order_id}`);
      const cap = await capturePaypalOrder(order.paypal_order_id);
      const status = cap.status === "COMPLETED" ? "paid" : "failed";
      await supabase
        .from("orders")
        .update({ status, buyer_email: cap.email ?? null })
        .eq("id", fern_order_id);
      if (status === "paid") await notifyWebhook(order.store_id, fern_order_id);
      return text(JSON.stringify({ status, dummy: cap.dummy }));
    }
  );
});

export { handler as GET, handler as POST, handler as DELETE };
