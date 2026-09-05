import { requireUser } from "@/lib/session-user";
import { insertCookLog, listCookLogs } from "@/lib/cook-log-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const logs = await listCookLogs(user.id);
    return Response.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load cooking history.";
    const unauthorized =
      message.toLowerCase().includes("sign in") ||
      message.toLowerCase().includes("authenticated");
    return Response.json({ error: message }, { status: unauthorized ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      recipeId?: string;
      recipeTitle?: string;
      recipeImageUrl?: string;
      householdCode?: string;
    };
    const log = await insertCookLog(user.id, {
      recipeId: body.recipeId ?? "",
      recipeTitle: body.recipeTitle ?? "",
      recipeImageUrl: body.recipeImageUrl,
      householdCode: body.householdCode,
    });
    return Response.json({ log });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not log that cook.";
    const unauthorized =
      message.toLowerCase().includes("sign in") ||
      message.toLowerCase().includes("authenticated");
    return Response.json({ error: message }, { status: unauthorized ? 401 : 400 });
  }
}
