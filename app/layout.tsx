import type { Metadata } from "next";
import "./globals.css";
import "@dnb/eufemia/style";
import "@dnb/eufemia/style/themes/ui/ui-theme-dark-mode.css";
import { Agentation } from "agentation";

export const metadata: Metadata = {
  title: "Sandkasse",
  description: "UX sandkasse — Next.js + Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        {/* Agentation er devDependency og skal aldri med i produksjon. Sjekken
            gjøres her i server-komponenten, så komponenten ikke engang refereres
            i klientbundelen når NODE_ENV er production. Pakken har selv
            "use client", så den trenger ingen egen wrapper. */}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
