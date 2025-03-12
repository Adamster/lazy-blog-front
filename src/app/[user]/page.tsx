/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateMeta } from "@/components/meta/meta-data";
import UserClient from "./page-client";

export async function generateMetadata({ params }: any) {
  const { user } = await params;

  return generateMeta({
    title: `${user}`,
    description: `Proof that ${user} isn’t lazy (at least sometimes)`,
    type: "profile",
  });
}

export default function UserPage() {
  return <UserClient />;
}
