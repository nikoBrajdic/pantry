import { isGoogleOAuthEnabled } from "@/auth";

export async function GET() {
  return Response.json({ google: isGoogleOAuthEnabled() });
}
