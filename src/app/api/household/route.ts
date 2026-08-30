import { makeHouseholdCode, readHousehold, writeHousehold } from "@/lib/household-store";
import { requireEmail } from "@/lib/session-user";
import {
  leaveHouseholdMembership,
  readUserLibrary,
  renameKitchen,
  switchHousehold,
  writeUserLibrary,
} from "@/lib/user-store";
import { mergeRecipes } from "@/lib/storage";
import type { Recipe } from "@/lib/types";
import { addMembership } from "@/lib/household-store";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const email = await requireEmail();
    const library = await readUserLibrary(email);
    return Response.json({ library });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load kitchens.";
    return Response.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const email = await requireEmail();
    const body = (await request.json()) as {
      action?: "create" | "join" | "switch" | "leave" | "rename";
      code?: string;
      name?: string;
      recipes?: Recipe[];
    };
    const current = await readUserLibrary(email);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    if (body.action === "switch") {
      const library = await switchHousehold(body.code ?? "");
      return Response.json({ library });
    }

    if (body.action === "leave") {
      const library = await leaveHouseholdMembership(body.code ?? current.householdCode);
      return Response.json({ library });
    }

    if (body.action === "rename") {
      const library = await renameKitchen(body.code ?? "", body.name ?? "");
      return Response.json({ library });
    }

    if (body.action === "join") {
      const household = await readHousehold(body.code ?? "");
      if (!household) {
        return Response.json({ error: "No library uses that code." }, { status: 404 });
      }
      const merged = mergeRecipes(current.recipes, household.recipes);
      await addMembership(user.id, household.code);
      const library = await writeUserLibrary({
        email,
        householdCode: household.code,
        kitchens: current.kitchens,
        recipes: merged,
        updatedAt: new Date().toISOString(),
      });
      return Response.json({
        household: { ...household, recipes: library.recipes },
        library,
      });
    }

    // create — keep existing memberships; open an additional kitchen
    const code = makeHouseholdCode();
    const household = await writeHousehold(code, body.recipes ?? current.recipes);
    await addMembership(user.id, code);
    const library = await writeUserLibrary({
      email,
      householdCode: code,
      kitchens: current.kitchens,
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
