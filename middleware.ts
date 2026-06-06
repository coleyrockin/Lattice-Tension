import { NextRequest, NextResponse } from "next/server";

/** Serve the LATTICE experience at the root URL. */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/lattice.html", request.url));
  }
}

export const config = {
  matcher: "/",
};