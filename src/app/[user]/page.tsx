/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateMeta } from "@/components/meta/meta-data";
import UserClient from "./page-client";

export async function generateMetadata({ params }: any) {
  try {
    const { user } = await params;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/api/posts/${user}/posts`
    );
    const userData: any = await response.json();

    return generateMeta({
      title: `${userData.user.firstName} ${userData.user.lastName}`,
      description: `Posts by ${userData.user.firstName} ${userData.user.lastName}`,
      url: `/${userData.user.userName}`,
    });
  } catch {
    return {
      title: "Not Found | !LAZY Blog",
    };
  }
}

export default function UserPage() {
  return <UserClient />;
}
