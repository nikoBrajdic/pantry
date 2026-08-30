import { normalizeRecipe } from "@/lib/normalize";
import { requireEmail } from "@/lib/session-user";
import { readUserLibrary, saveUserRecipes } from "@/lib/user-store";
import type { Recipe } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const email = await requireEmail();
    const library = await readUserLibrary(email);
    return Response.json({ library });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load recipes.";
    return Response.json({ error: message }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const email = await requireEmail();
    const body = (await request.json()) as {
      recipes?: Recipe[];
      householdCode?: string;
    };
    const recipes = (body.recipes ?? []).map(normalizeRecipe);
    const library = await saveUserRecipes(email, recipes, body.householdCode);
    return Response.json({ library });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save recipes.";
    return Response.json({ error: message }, { status: 400 });
  }
}
