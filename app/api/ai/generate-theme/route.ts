import { NextResponse } from "next/server";
import { mockGenerateTheme } from "@/lib/themes";
import { generateThemeAI } from "@/lib/ai";

/**
 * Theme generation: real LLM via DeepSeek when DEEPSEEK_API_KEY is set,
 * otherwise the keyword mock. Same ThemeJson schema either way, so no
 * client change needed.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const description = String(body?.description ?? "");
  const storeName = String(body?.storeName ?? "My Store");
  if (!description.trim())
    return NextResponse.json({ error: "describe your store first" }, { status: 400 });

  const key = process.env.DEEPSEEK_API_KEY;
  if (key) {
    try {
      const { theme, notes } = await generateThemeAI(description, storeName, key);
      return NextResponse.json({ theme, notes, provider: "deepseek" });
    } catch (err) {
      console.error("AI theme gen failed, falling back to mock:", err);
    }
  }
  const { theme, notes } = mockGenerateTheme(description, storeName);
  return NextResponse.json({ theme, notes, provider: "mock" });
}
