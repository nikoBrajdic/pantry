import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/api/auth");

  if (!isSupabaseConfigured()) {
    if (!isPublic && !path.startsWith("/_next")) {
      const login = new URL("/login", request.nextUrl.origin);
      login.searchParams.set(
        "callbackUrl",
        `${path}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(login);
    }
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublic) {
    if (user && path.startsWith("/login")) {
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
      return NextResponse.redirect(new URL(callbackUrl, request.nextUrl.origin));
    }
    return response;
  }

  if (!user) {
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set(
      "callbackUrl",
      `${path}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
