import { auth } from "@/auth";

export async function requireEmail() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    throw new Error("You need to sign in first.");
  }
  return email;
}
