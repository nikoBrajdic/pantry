import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function requireUser() {
  const user = await getSessionUser();
  if (!user?.email) {
    throw new Error("You need to sign in first.");
  }
  return user;
}

export async function requireEmail() {
  const user = await requireUser();
  return user.email!;
}

export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
