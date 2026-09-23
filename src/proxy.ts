import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: pages still verify the session on the server.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("li_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/profile/:path*"],
};
