import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((request) => {
  const path = request.nextUrl.pathname;
  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/auth/configured");

  if (isPublic) return NextResponse.next();
  if (request.auth?.user?.email) return NextResponse.next();

  const login = new URL("/login", request.nextUrl.origin);
  login.searchParams.set("callbackUrl", path);
  return NextResponse.redirect(login);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
