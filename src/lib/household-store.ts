import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { HouseholdPayload, Recipe } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "households");

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function makeHouseholdCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function fileFor(code: string) {
  return path.join(DATA_DIR, `${normalizeCode(code)}.json`);
}

export async function readHousehold(code: string): Promise<HouseholdPayload | null> {
  const clean = normalizeCode(code);
  if (clean.length < 4) return null;
  try {
    const raw = await readFile(fileFor(clean), "utf8");
    return JSON.parse(raw) as HouseholdPayload;
  } catch {
    return null;
  }
}

export async function writeHousehold(code: string, recipes: Recipe[]) {
  const clean = normalizeCode(code);
  if (clean.length < 4) {
    throw new Error("Kod kućanstva je prekratak.");
  }
  await mkdir(DATA_DIR, { recursive: true });
  const payload: HouseholdPayload = {
    code: clean,
    recipes,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(fileFor(clean), JSON.stringify(payload, null, 2), "utf8");
  return payload;
}
