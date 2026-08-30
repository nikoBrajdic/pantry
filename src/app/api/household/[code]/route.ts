import { readHousehold, writeHousehold } from "@/lib/household-store";
import { requireEmail } from "@/lib/session-user";
import { readUserLibrary, writeUserLibrary } from "@/lib/user-store";
import type { Recipe } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  await requireEmail();
  const { code } = await context.params;
  const household = await readHousehold(code);
  if (!household) {
    return Response.json({ error: "Shared kitchen not found." }, { status: 404 });
  }
  return Response.json({ household });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const email = await requireEmail();
  const { code } = await context.params;
  try {
    const body = (await request.json()) as { recipes?: Recipe[] };
    const household = await writeHousehold(code, body.recipes ?? []);
    const current = await readUserLibrary(email);
    if (current.householdCode === household.code) {
      await writeUserLibrary({
        ...current,
        recipes: household.recipes,
        updatedAt: household.updatedAt,
      });
    }
    return Response.json({ household });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not sync the shared kitchen.";
    return Response.json({ error: message }, { status: 400 });
  }
}
