import type { Viewport } from "next";

import "./cam.css";

import { FilmGrain } from "@/shared/ui/effects";
import { CamFooter } from "./ui/cam-footer";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#181818" },
    { media: "(prefers-color-scheme: light)", color: "#f4f4f4" },
  ],
};

// The Lazy Cam product site — theme follows the blog toggle (light + dark).
// The blog header bar stays (it squares its lockup badge into the viewfinder
// mark on /cam); support/privacy live as anchored sections of the single page.
export default function CamLayout({ children }: { children: React.ReactNode }) {
  return (
    // -mt pulls the scope up UNDER the fixed bar (the root layout already
    // cleared it), pt re-pads the content — so the translucent header always
    // blurs the cam canvas, not the body behind it.
    <div
      className="mono-scope mx-[calc(50%-50vw)] -mt-[var(--m-header-h)] flex min-h-screen w-screen flex-col bg-[var(--m-bg)] pt-[var(--m-header-h)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <FilmGrain />
      <div className="flex-1">{children}</div>
      <CamFooter />
    </div>
  );
}
