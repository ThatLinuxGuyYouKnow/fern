import { NextResponse } from "next/server";
import { isRetryableSupabaseError, supabase, withSupabaseRetry } from "@/lib/supabase";
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

  try {
    // Transient Supabase edge/origin blips (e.g. HTTP 521 from the REST gateway)
    // surface as thrown fetch failures or 5xx error objects — retry before giving up.
    const { data, error } = await withSupabaseRetry(() =>
      supabase.from("stores").insert({ slug, name, logo_url, theme_json: theme }).select().single()
    );
    if (error) {
      if (error.code === "23505")
        return NextResponse.json({ error: "that store name is taken" }, { status: 409 });
      if (isRetryableSupabaseError(error)) {
        console.error("POST /api/stores transient error after retries", {
          slug,
          code: error.code,
          status: (error as { status?: unknown }).status,
          message: error.message,
        });
        return NextResponse.json(
          { error: "store service temporarily unavailable — please try again" },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ store: data });
  } catch (e) {
    console.error("POST /api/stores insert threw after retries", { slug, err: String(e) });
    return NextResponse.json(
      { error: "store service temporarily unavailable — please try again" },
      { status: 503 }
    );
  }
}
