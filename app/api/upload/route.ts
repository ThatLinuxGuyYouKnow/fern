import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/** POST multipart: file + slug -> public URL in store-assets bucket */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const slug = String(form?.get("slug") ?? "misc").toLowerCase();
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "max 5MB" }, { status: 400 });

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = `${slug}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from("store-assets")
    .upload(key, buf, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = supabase.storage.from("store-assets").getPublicUrl(key);
  return NextResponse.json({ url: data.publicUrl });
}
