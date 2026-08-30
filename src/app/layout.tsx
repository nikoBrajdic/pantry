import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthSessionProvider } from "@/components/session-provider";
import { AppearanceProvider } from "@/components/appearance-provider";
import { RecipeProvider } from "@/components/recipe-provider";
import { AppShell } from "@/components/app-shell";

const heading = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading-face",
});

const sans = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans-face",
});

const numeric = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-numeric-face",
});

export const metadata: Metadata = {
  title: "Pantry",
  description:
    "Paste a recipe link, pull ingredients and steps, scale servings, and share the kitchen with someone you cook with.",
};

const appearanceBootScript = `
(function () {
  try {
    var mode = localStorage.getItem("pantry:appearance-mode") || "system";
    var palette = localStorage.getItem("pantry:palette") || "sage";
    var dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.dataset.palette = palette;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-palette="sage"
      className={cn(
        "h-full antialiased",
        heading.variable,
        sans.variable,
        numeric.variable,
        "font-sans",
      )}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppearanceProvider>
          <AuthSessionProvider>
            <RecipeProvider>
              <AppShell>{children}</AppShell>
            </RecipeProvider>
          </AuthSessionProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
