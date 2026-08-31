import { assertPublicHttpUrl, extractRecipeFromHtml } from "@/lib/extract";
import { fetchHtmlViaProxies } from "@/lib/scrape-proxies";
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

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { url?: string; html?: string };
    const pastedHtml = typeof body.html === "string" ? body.html.trim() : "";

    if (pastedHtml) {
      if (pastedHtml.length > MAX_HTML_CHARS) {
        return Response.json(
          { error: "That HTML paste is too large.", reason: "exhausted" },
          { status: 400 },
        );
      }
      const url = optionalPublicUrl(body.url);
      const recipe = tryExtract(pastedHtml, url);
      if (recipe) return Response.json({ recipe, source: "paste" });
      return Response.json(
        {
          error: "exhausted",
          reason: "exhausted",
        },
        { status: 422 },
      );
    }

    const url = assertPublicHttpUrl(body.url ?? "");

    // 1) Direct scrape
    const directHtml = await fetchDirectHtml(url);
    if (directHtml) {
      const recipe = tryExtract(directHtml, url);
      if (recipe) return Response.json({ recipe, source: "direct" });
    }

    // 2) Rendering proxies (only providers with keys / Jina)
    const proxied = await fetchHtmlViaProxies(url);
    if (proxied) {
      const recipe = tryExtract(proxied.html, url);
      if (recipe) {
        return Response.json({
          recipe,
          source: proxied.provider,
        });
      }
    }

    // 3) Everything automatic failed → client opens HTML-paste dialog
    const reason = directHtml || proxied ? "extract" : "fetch";
    return Response.json(
      {
        error: reason === "fetch" ? "fetch_failed" : "extract_failed",
        reason,
        proxiesTried: true,
      },
      { status: 422 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The recipe could not be extracted.";
    return Response.json({ error: message }, { status: 400 });
  }
}
