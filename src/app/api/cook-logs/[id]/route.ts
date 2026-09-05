import { requireUser } from "@/lib/session-user";
import { deleteCookLog } from "@/lib/cook-log-store";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const clean = id.trim();
    if (!clean) {
      return Response.json({ error: "Missing cook log." }, { status: 400 });
    }
    await deleteCookLog(user.id, clean);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove that cook.";
    const unauthorized =
      message.toLowerCase().includes("sign in") ||
      message.toLowerCase().includes("authenticated");
    return Response.json({ error: message }, { status: unauthorized ? 401 : 400 });
  }
}
