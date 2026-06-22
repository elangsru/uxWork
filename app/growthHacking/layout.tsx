import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#f8f8f8",
  viewportFit: "cover",
};

export default function GrowthHackingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        body { background: #f8f8f8; }
        .gh-main { padding: 48px; padding-top: calc(48px + env(safe-area-inset-top, 0px)); }
        @media (max-width: 768px) {
          .gh-main { padding: 16px; padding-top: calc(16px + env(safe-area-inset-top, 0px)); }
        }
      `}</style>
      {children}
    </>
  );
}
