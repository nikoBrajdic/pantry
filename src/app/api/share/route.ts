import { normalizeRecipe } from "@/lib/normalize";
import { requireUser } from "@/lib/session-user";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";

export const runtime = "nodejs";

function makeShareId() {
  const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < 8; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

function forShare(recipe: Recipe): Recipe {
  const normalized = normalizeRecipe(recipe);
  const imageUrl =
    normalized.imageUrl?.startsWith("http://") ||
    normalized.imageUrl?.startsWith("https://")
      ? normalized.imageUrl
      : undefined;
  return {
    ...normalized,
    imageUrl,
    timesCooked: 0,
    lastCookedAt: undefined,
  };
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { recipe?: Recipe };
    if (!body.recipe?.title) {
      return Response.json({ error: "Missing recipe." }, { status: 400 });
    }

    const supabase = await createClient();
    const recipe = forShare(body.recipe);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const id = makeShareId();
      const { error } = await supabase.from("recipe_shares").insert({
        id,
        recipe,
        created_by: user.id,
      });
      if (!error) {
        return Response.json({ id });
      }
      if (!error.message.toLowerCase().includes("duplicate")) {
        return Response.json(
          { error: error.message || "Could not create share link." },
          { status: 500 },
        );
      }
    }

    return Response.json({ error: "Could not create share link." }, { status: 500 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create share link.";
    const unauthorized =
      message.toLowerCase().includes("sign in") ||
      message.toLowerCase().includes("authenticated");
    return Response.json({ error: message }, { status: unauthorized ? 401 : 500 });
  }
}
