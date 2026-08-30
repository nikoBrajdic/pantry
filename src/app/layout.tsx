import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthSessionProvider } from "@/components/session-provider";
import { AppearanceProvider } from "@/components/appearance-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { RecipeProvider } from "@/components/recipe-provider";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";

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
  applicationName: "Pantry",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pantry",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4a7c59" },
    { media: "(prefers-color-scheme: dark)", color: "#2f4f3a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const appearanceBootScript = `
(function () {
  try {
    var mode = localStorage.getItem("pantry:appearance-mode") || "system";
    var palette = localStorage.getItem("pantry:palette") || "sage";
    var locale = localStorage.getItem("pantry:locale") || "en";
    var dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.dataset.palette = palette;
    root.lang = locale === "hr" ? "hr" : "en";
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
        <LocaleProvider>
          <AppearanceProvider>
            <AuthSessionProvider>
              <RecipeProvider>
                <PwaRegister />
                <AppShell>{children}</AppShell>
              </RecipeProvider>
            </AuthSessionProvider>
          </AppearanceProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
