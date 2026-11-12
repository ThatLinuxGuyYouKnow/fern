-- fern schema — run via psql session pooler or Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ stores ============
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]{2,40}$'),
  name text NOT NULL,
  logo_url text,
  theme_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  paypal_merchant_id text,
  payout_email text,
  webhook_url text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stores_slug_idx ON public.stores (slug);

-- ============ products ============
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  image_url text,
  description text DEFAULT '',
  stock integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_store_idx ON public.products (store_id, position);

-- ============ orders ============
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  paypal_order_id text,
  status text NOT NULL DEFAULT 'created',
  total_cents integer NOT NULL DEFAULT 0,
  currency char(3) NOT NULL DEFAULT 'USD',
  buyer_email text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_store_idx ON public.orders (store_id);

-- ============ RLS (open for hackathon demo; tighten before prod) ============
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open all" ON public.stores;
CREATE POLICY "open all" ON public.stores FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open all" ON public.products;
CREATE POLICY "open all" ON public.products FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open all" ON public.orders;
CREATE POLICY "open all" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- ============ storage bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public read store-assets" ON storage.objects;
CREATE POLICY "public read store-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');
DROP POLICY IF EXISTS "anon write store-assets" ON storage.objects;
CREATE POLICY "anon write store-assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'store-assets');
DROP POLICY IF EXISTS "anon update store-assets" ON storage.objects;
CREATE POLICY "anon update store-assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'store-assets') WITH CHECK (bucket_id = 'store-assets');
DROP POLICY IF EXISTS "anon delete store-assets" ON storage.objects;
CREATE POLICY "anon delete store-assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'store-assets');
