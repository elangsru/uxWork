import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#f8f8f8",
};

export default function GrowthHackingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
