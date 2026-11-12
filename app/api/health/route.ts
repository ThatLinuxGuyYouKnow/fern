import { NextResponse } from "next/server";

// Liveness probe for Docker / EC2 / future ALB target groups.
// Dependency-free by design (never 500s because Supabase/PayPal is down).
// No secrets in the response — mode flags only.
export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  return NextResponse.json({
    ok: true,
    paypalMode: process.env.PAYPAL_MODE || "sandbox",
    paypalLive: clientId !== "" && !clientId.startsWith("DUMMY"),
    rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || null,
  });
}
