/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserSSR } from "@/features/user/model/get-user.ssr";
import { UserResponse } from "@/shared/api/openapi";
import { generateMeta } from "@/shared/lib/head/meta-data";
import UserPage from "./user-page";

export async function generateMetadata({ params }: any) {
  const { user } = await params;
  const userData: UserResponse = await getUserSSR(user);

  if (userData) {
    return generateMeta({
      title: `${userData.firstName} ${userData.lastName}`,
      description: `Explore articles and stories shared by ${user}. ${
        userData.biography ? userData.biography : ""
      }`,
      image: userData.avatarUrl || undefined,
      type: "profile",
      url: `/${userData.userName}`,
      card: "summary",
    });
  } else {
    return generateMeta({
      title: "Not Found",
    });
  }
}

export default async function Page({ params }: any) {
  const { user: userName } = await params;
  return <UserPage userName={userName} />;
}
