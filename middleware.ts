import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { slugFromHost } from "./lib/tenant";

// Platform routes served by the apex app — never treated as store pages,
// even on a tenant subdomain (muse.example.com/create → wizard, not 404).
const PLATFORM_ROUTES = ["api", "admin", "create", "s"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (PLATFORM_ROUTES.some((p) => path === `/${p}` || path.startsWith(`/${p}/`))) {
    return NextResponse.next();
  }
  const host = req.headers.get("host");
  const root =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    host?.split(":")[0] ||
    "localhost:3000";
  const slug = slugFromHost(host, root);
  if (!slug) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/s/${slug}${path === "/" ? "" : path}`;
  const res = NextResponse.rewrite(url);
  res.headers.set("x-tenant-slug", slug);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
