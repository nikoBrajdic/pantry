import { assertPublicHttpUrl, extractRecipeFromHtml } from "@/lib/extract";
import {
  fetchHtmlViaProvider,
  listConfiguredScrapeProviders,
  type ScrapeProviderId,
} from "@/lib/scrape-proxies";
import { getSessionUser } from "@/lib/session-user";
import type { ExtractedRecipe } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_HTML_CHARS = 2_500_000;

const DIRECT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en,hr;q=0.8",
};

function optionalPublicUrl(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return assertPublicHttpUrl(trimmed);
}

function tryExtract(html: string, url: string): ExtractedRecipe | null {
  try {
    return extractRecipeFromHtml(html, url);
  } catch {
    return null;
  }
}

async function fetchDirectHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: DIRECT_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    return html.trim() ? html : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user?.email) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }
  return Response.json({ providers: listConfiguredScrapeProviders() });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      url?: string;
      html?: string;
      attempt?: "direct" | "proxy" | "paste";
      provider?: ScrapeProviderId;
    };

    const attempt = body.attempt ?? (body.html?.trim() ? "paste" : "direct");

    if (attempt === "paste") {
      const pastedHtml = typeof body.html === "string" ? body.html.trim() : "";
      if (!pastedHtml) {
        return Response.json({ error: "Paste some HTML first." }, { status: 400 });
      }
      if (pastedHtml.length > MAX_HTML_CHARS) {
        return Response.json(
          { ok: false, reason: "exhausted", error: "That HTML paste is too large." },
          { status: 400 },
        );
      }
      const url = optionalPublicUrl(body.url);
      const recipe = tryExtract(pastedHtml, url);
      if (recipe) return Response.json({ ok: true, recipe, source: "paste" });
      return Response.json({ ok: false, reason: "exhausted", gotHtml: true }, { status: 422 });
    }

    const url = assertPublicHttpUrl(body.url ?? "");

    if (attempt === "direct") {
      const html = await fetchDirectHtml(url);
      if (!html) {
        return Response.json({ ok: false, gotHtml: false, source: "direct" });
      }
      const recipe = tryExtract(html, url);
      if (recipe) return Response.json({ ok: true, recipe, source: "direct" });
      return Response.json({ ok: false, gotHtml: true, source: "direct" });
    }

    if (attempt === "proxy") {
      const provider = body.provider;
      if (!provider) {
        return Response.json({ error: "Missing provider." }, { status: 400 });
      }
      try {
        const html = await fetchHtmlViaProvider(provider, url);
        const recipe = tryExtract(html, url);
        if (recipe) {
          return Response.json({ ok: true, recipe, source: provider });
        }
        return Response.json({ ok: false, gotHtml: true, source: provider });
      } catch (error) {
        console.warn(
          `[extract] proxy ${provider} failed:`,
          error instanceof Error ? error.message : error,
        );
        return Response.json({ ok: false, gotHtml: false, source: provider });
      }
    }

    return Response.json({ error: "Unknown attempt." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The recipe could not be extracted.";
    return Response.json({ error: message }, { status: 400 });
  }
}
