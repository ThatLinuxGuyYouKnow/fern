import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { RESERVED_SLUGS } from "@/lib/tenant";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = String(body?.slug ?? "").toLowerCase().trim();
  const name = String(body?.name ?? "").trim();
  const logo_url = body?.logo_url ? String(body.logo_url) : null;
  const theme = body?.theme ?? { template: "minimal" };

  if (!/^[a-z0-9-]{2,40}$/.test(slug))
    return NextResponse.json({ error: "slug must be 2-40 chars: a-z 0-9 -" }, { status: 400 });
  if (RESERVED_SLUGS.has(slug))
    return NextResponse.json({ error: "that name is reserved" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "store name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("stores")
    .insert({ slug, name, logo_url, theme_json: theme })
    .select()
    .single();
  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "that store name is taken" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ store: data });
}
