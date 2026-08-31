import { requireEmail } from "@/lib/session-user";
import { listShelfTags } from "@/lib/tag-store";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireEmail();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("household_code")
      .eq("id", user.id)
      .single();
    if (error) throw new Error(error.message);

    const householdCode = (profile.household_code ?? "").trim();
    const tags = householdCode
      ? await listShelfTags({ household_code: householdCode })
      : await listShelfTags({ owner_user_id: user.id });

    return Response.json({ tags, householdCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load tags.";
    const unauthorized =
      message.toLowerCase().includes("sign in") ||
      message.toLowerCase().includes("authenticated");
    return Response.json({ error: message }, { status: unauthorized ? 401 : 500 });
  }
}
