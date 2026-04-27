import { NextRequest, NextResponse } from "next/server";

/**
 * Multi-tenant middleware.
 * Reads the subdomain from the hostname and injects it as a header
 * so server components and API routes can identify the tenant.
 *
 * Example: pizzeria-juan.pedidosfree.com → tenant = "pizzeria-juan"
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "pedidosfree.com";

  // Extract subdomain
  let tenant = "";
  if (hostname.endsWith(`.${baseDomain}`)) {
    tenant = hostname.replace(`.${baseDomain}`, "");
  }

  // For local development: localhost:3000 → no tenant (landing)
  // tenant.localhost:3000 → tenant
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".");
    if (parts.length > 1) {
      tenant = parts[0];
    }
  }

  const headers = new Headers(request.headers);
  headers.set("x-tenant", tenant);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-.*|sw.js).*)"],
};
