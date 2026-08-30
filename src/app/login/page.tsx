import { redirect } from "next/navigation";
import { auth, isGoogleOAuthEnabled } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user?.email) {
    redirect(callbackUrl || "/");
  }
  return <LoginForm googleReady={isGoogleOAuthEnabled()} callbackUrl={callbackUrl || "/"} />;
}
