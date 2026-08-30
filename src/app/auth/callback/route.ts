import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

function safeNextPath(value: string | undefined, origin: string) {
  if (!value) return "/";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (url.origin === origin) {
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }
  } catch {
    // ignore
  }
  return "/";
}

function parseCookies(header: string | null) {
  if (!header) return [];
  return header.split(";").map((part) => {
    const index = part.indexOf("=");
    if (index === -1) return { name: part.trim(), value: "" };
    return {
      name: part.slice(0, index).trim(),
      value: part.slice(index + 1).trim(),
    };
  });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieHeader = request.headers.get("cookie");
  const cookieNext = parseCookies(cookieHeader).find(
    (cookie) => cookie.name === "pantry_auth_next",
  )?.value;
  const next = safeNextPath(
    searchParams.get("next") ?? (cookieNext ? decodeURIComponent(cookieNext) : undefined),
    origin,
  );

  if (code) {
    const { url, anonKey } = getSupabaseEnv();
    const redirectUrl = new URL(next, origin);
    let response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return parseCookies(cookieHeader);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      response.cookies.set("pantry_auth_next", "", { path: "/", maxAge: 0 });
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
