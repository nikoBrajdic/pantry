import { assertPublicHttpUrl, extractRecipeFromHtml } from "@/lib/extract";
import { getSessionUser } from "@/lib/session-user";

export const runtime = "nodejs";

const MAX_HTML_CHARS = 2_500_000;

function optionalPublicUrl(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return assertPublicHttpUrl(trimmed);
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
          { error: "That HTML paste is too large." },
          { status: 400 },
        );
      }
      try {
        const url = optionalPublicUrl(body.url);
        const recipe = extractRecipeFromHtml(pastedHtml, url);
        return Response.json({ recipe });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The recipe could not be extracted.";
        return Response.json({ error: message, reason: "extract" }, { status: 400 });
      }
    }

    const url = assertPublicHttpUrl(body.url ?? "");

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en,hr;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
      });
    } catch {
      return Response.json({ error: "fetch_failed", reason: "fetch" }, { status: 422 });
    }

    if (!response.ok) {
      return Response.json({ error: "fetch_failed", reason: "fetch" }, { status: 422 });
    }

    const html = await response.text();
    try {
      const recipe = extractRecipeFromHtml(html, url);
      return Response.json({ recipe });
    } catch {
      return Response.json({ error: "extract_failed", reason: "extract" }, { status: 422 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The recipe could not be extracted.";
    return Response.json({ error: message }, { status: 400 });
  }
}
