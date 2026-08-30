import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getSessionUser } from "@/lib/session-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (user?.email) {
      redirect(callbackUrl || "/");
    }
  }
  return (
    <LoginForm
      supabaseReady={isSupabaseConfigured()}
      callbackUrl={callbackUrl || "/"}
      initialError={error === "auth" ? "Sign-in did not finish. Try again." : ""}
    />
  );
}
