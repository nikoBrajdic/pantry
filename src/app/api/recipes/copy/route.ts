import { requireEmail } from "@/lib/session-user";
import { copyRecipeToKitchen } from "@/lib/user-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireEmail();
    const body = (await request.json()) as {
      recipeId?: string;
      targetHouseholdCode?: string;
    };
    const recipeId = body.recipeId?.trim() ?? "";
    if (!recipeId) {
      return Response.json({ error: "Missing recipe." }, { status: 400 });
    }
    const result = await copyRecipeToKitchen(
      recipeId,
      body.targetHouseholdCode ?? "",
    );
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not copy that recipe.";
    return Response.json({ error: message }, { status: 400 });
  }
}
