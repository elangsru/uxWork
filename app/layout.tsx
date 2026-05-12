import type { Metadata } from "next";
import "./globals.css";
import "@dnb/eufemia/style";
import "@dnb/eufemia/style/themes/ui/ui-theme-dark-mode.css";

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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
