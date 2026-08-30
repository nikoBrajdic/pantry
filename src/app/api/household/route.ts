import { makeHouseholdCode, readHousehold, writeHousehold } from "@/lib/household-store";
import type { Recipe } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "create" | "join";
      code?: string;
      recipes?: Recipe[];
    };

    if (body.action === "join") {
      const household = await readHousehold(body.code ?? "");
      if (!household) {
        return Response.json(
          { error: "Ne postoji knjižnica s tim kodom." },
          { status: 404 },
        );
      }
      return Response.json({ household });
    }

    const code = makeHouseholdCode();
    const household = await writeHousehold(code, body.recipes ?? []);
    return Response.json({ household });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kućanstvo se nije moglo spremiti.";
    return Response.json({ error: message }, { status: 400 });
  }
}
