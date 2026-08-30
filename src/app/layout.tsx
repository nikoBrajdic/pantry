import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthSessionProvider } from "@/components/session-provider";
import { RecipeProvider } from "@/components/recipe-provider";
import { AppShell } from "@/components/app-shell";

const heading = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
});

const sans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "Pantry",
  description:
    "Paste a recipe link, pull ingredients and steps, scale servings, and share the kitchen with someone you cook with.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", heading.variable, sans.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <RecipeProvider>
            <AppShell>{children}</AppShell>
          </RecipeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
