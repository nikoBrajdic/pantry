import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
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
  title: "Receptoteka",
  description:
    "Zalijepi link recepta, izvuci sastojke i upute, preračunaj porcije i podijeli knjižnicu s partnerom.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="hr"
      className={cn("h-full antialiased", heading.variable, sans.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <RecipeProvider>
          <AppShell>{children}</AppShell>
        </RecipeProvider>
      </body>
    </html>
  );
}
