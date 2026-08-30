import { normalizeRecipe } from "@/lib/normalize";
import { requireEmail } from "@/lib/session-user";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireEmail();
    const { id } = await context.params;
    const clean = id.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.length < 4) {
      return Response.json({ error: "Invalid share link." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recipe_shares")
      .select("recipe")
      .eq("id", clean)
      .maybeSingle();

    if (error || !data?.recipe) {
      return Response.json({ error: "Share link not found." }, { status: 404 });
    }

    const recipe = normalizeRecipe(data.recipe as Recipe);
    return Response.json({ recipe });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load share.";
    const unauthorized =
      message.toLowerCase().includes("sign in") ||
      message.toLowerCase().includes("authenticated");
    return Response.json({ error: message }, { status: unauthorized ? 401 : 500 });
  }
}
