import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import TetrisPage from "./tetris-page";

export const metadata: Metadata = generateMeta({
  title: "Tetris",
  noindex: true,
});

export default function Page() {
  return <TetrisPage />;
}
