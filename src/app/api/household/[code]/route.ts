import { readHousehold, writeHousehold } from "@/lib/household-store";
import type { Recipe } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const household = await readHousehold(code);
  if (!household) {
    return Response.json({ error: "Knjižnica nije pronađena." }, { status: 404 });
  }
  return Response.json({ household });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  try {
    const body = (await request.json()) as { recipes?: Recipe[] };
    const household = await writeHousehold(code, body.recipes ?? []);
    return Response.json({ household });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sinkronizacija nije uspjela.";
    return Response.json({ error: message }, { status: 400 });
  }
}
