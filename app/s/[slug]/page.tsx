import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/tenant";
import { supabase } from "@/lib/supabase";
import StorefrontClient from "@/components/StorefrontClient";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const store = await getStoreBySlug(params.slug);
  if (!store) return {};
  return {
    title: store.name,
    description: store.theme_json.heroSubtitle,
    // Each store's uploaded logo doubles as its browser favicon (falls back
    // to the default fern mark from app/icon.svg when no logo is set).
    icons: store.logo_url ? { icon: store.logo_url } : undefined,
  };
}

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
