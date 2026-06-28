import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

// Intentionally empty — placeholder route so the header `about` link resolves.
export default function AboutPage() {
  return <main className="mx-auto max-w-[1240px] px-10 pb-10" />;
}
