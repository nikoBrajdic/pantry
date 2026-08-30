import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { SAMPLE_RECIPES } from "./samples";
import { normalizeRecipe } from "./normalize";
import type { Recipe, UserLibrary } from "./types";
import { readHousehold, writeHousehold } from "./household-store";

const DATA_DIR = path.join(process.cwd(), "data", "users");

export function userKey(email: string) {
  return email.trim().toLowerCase();
}

function fileFor(email: string) {
  const safe = userKey(email).replace(/[^a-z0-9@._-]/g, "_");
  return path.join(DATA_DIR, `${safe}.json`);
}

export async function readUserLibrary(email: string): Promise<UserLibrary> {
  const key = userKey(email);
  try {
    const raw = await readFile(fileFor(key), "utf8");
    const parsed = JSON.parse(raw) as UserLibrary;
    const recipes = (parsed.recipes ?? []).map(normalizeRecipe);
    if (parsed.householdCode) {
      const household = await readHousehold(parsed.householdCode);
      if (household) {
        return {
          email: key,
          householdCode: parsed.householdCode,
          recipes: household.recipes.map(normalizeRecipe),
          updatedAt: household.updatedAt,
        };
      }
    }
    return {
      email: key,
      householdCode: parsed.householdCode ?? "",
      recipes,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    const fresh: UserLibrary = {
      email: key,
      householdCode: "",
      recipes: SAMPLE_RECIPES.map(normalizeRecipe),
      updatedAt: new Date().toISOString(),
    };
    await writeUserLibrary(fresh);
    return fresh;
  }
}

export async function writeUserLibrary(library: UserLibrary) {
  const key = userKey(library.email);
  await mkdir(DATA_DIR, { recursive: true });
  const payload: UserLibrary = {
    email: key,
    householdCode: library.householdCode ?? "",
    recipes: library.recipes.map(normalizeRecipe),
    updatedAt: new Date().toISOString(),
  };
  await writeFile(fileFor(key), JSON.stringify(payload, null, 2), "utf8");
  if (payload.householdCode) {
    await writeHousehold(payload.householdCode, payload.recipes);
  }
  return payload;
}

export async function saveUserRecipes(email: string, recipes: Recipe[], householdCode?: string) {
  const current = await readUserLibrary(email).catch(() => null);
  return writeUserLibrary({
    email,
    householdCode: householdCode ?? current?.householdCode ?? "",
    recipes,
    updatedAt: new Date().toISOString(),
  });
}
