import { assertPublicHttpUrl, extractRecipeFromHtml } from "@/lib/extract";
import { getSessionUser } from "@/lib/session-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.email) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { url?: string };
    const url = assertPublicHttpUrl(body.url ?? "");

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en,hr;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return Response.json(
        { error: `The page responded with status ${response.status}.` },
        { status: 422 },
      );
    }

    const html = await response.text();
    const recipe = extractRecipeFromHtml(html, url);
    return Response.json({ recipe });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The recipe could not be extracted.";
    return Response.json({ error: message }, { status: 400 });
  }
}
