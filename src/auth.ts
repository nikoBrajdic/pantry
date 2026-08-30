import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export function isGoogleOAuthEnabled() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

const providers = [];

if (isGoogleOAuthEnabled()) {
  providers.push(Google);
}

providers.push(
  Credentials({
    id: "google-preview",
    name: "Google",
    credentials: {
      email: { label: "Email", type: "email" },
      name: { label: "Name", type: "text" },
    },
    authorize(credentials) {
      const email = String(credentials.email ?? "")
        .trim()
        .toLowerCase();
      const name = String(credentials.name ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
      const label = name || email.split("@")[0];
      return {
        id: email,
        email,
        name: label,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=C45C26&color=fff`,
      };
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.image = (token.picture as string) ?? session.user.image;
      }
      return session;
    },
  },
});
