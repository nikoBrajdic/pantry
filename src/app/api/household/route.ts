import { makeHouseholdCode, readHousehold, writeHousehold } from "@/lib/household-store";
import { requireEmail } from "@/lib/session-user";
import { readUserLibrary, writeUserLibrary } from "@/lib/user-store";
import { mergeRecipes } from "@/lib/storage";
import type { Recipe } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const email = await requireEmail();
    const body = (await request.json()) as {
      action?: "create" | "join";
      code?: string;
      recipes?: Recipe[];
    };
    const current = await readUserLibrary(email);

    if (body.action === "join") {
      const household = await readHousehold(body.code ?? "");
      if (!household) {
        return Response.json({ error: "No library uses that code." }, { status: 404 });
      }
      const merged = mergeRecipes(current.recipes, household.recipes);
      const library = await writeUserLibrary({
        email,
        householdCode: household.code,
        recipes: merged,
        updatedAt: new Date().toISOString(),
      });
      return Response.json({ household: { ...household, recipes: library.recipes }, library });
    }

    const code = makeHouseholdCode();
    const household = await writeHousehold(code, body.recipes ?? current.recipes);
    const library = await writeUserLibrary({
      email,
      householdCode: code,
      recipes: household.recipes,
      updatedAt: household.updatedAt,
    });
    return Response.json({ household, library });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The shared kitchen could not be saved.";
    return Response.json({ error: message }, { status: 400 });
  }
}
