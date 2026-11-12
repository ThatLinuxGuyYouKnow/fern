import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/tenant";
import { supabase } from "@/lib/supabase";
import StorefrontClient from "@/components/StorefrontClient";

export const revalidate = 0;

export default async function StorePage({ params }: { params: { slug: string } }) {
  const store = await getStoreBySlug(params.slug);
  if (!store) notFound();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("position");
  return (
    <StorefrontClient
      store={store}
      products={products ?? []}
      paypalClientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "DUMMY_CLIENT_ID"}
    />
  );
}
