import { assertPublicHttpUrl, extractRecipeFromHtml } from "@/lib/extract";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = assertPublicHttpUrl(body.url ?? "");

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "hr,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return Response.json(
        { error: `Stranica je odgovorila sa statusom ${response.status}.` },
        { status: 422 },
      );
    }

    const html = await response.text();
    const recipe = extractRecipeFromHtml(html, url);
    return Response.json({ recipe });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Recept se nije mogao izvući.";
    return Response.json({ error: message }, { status: 400 });
  }
}
