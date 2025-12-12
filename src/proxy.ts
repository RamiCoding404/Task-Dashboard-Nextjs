import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { nextUrl: url, cookies } = req;

  const authCookie = cookies.get("auth")?.value;
  const isLoginPage = url.pathname === "/login";

  if (isLoginPage && authCookie) {
    const dashboardUrl = url.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  if (!authCookie && !isLoginPage) {
    const loginUrl = url.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/", "/login"],
};
