import { getUserSSR } from "@/features/user/model/get-user.ssr";
import { UserResponse } from "@/shared/api/openapi";
import { generateMeta } from "@/shared/lib/head/meta-data";
import UserPage from "./user-page";

type PageProps = {
  params: Promise<{ user: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { user } = await params;
  const userData: UserResponse | null = await getUserSSR(user);

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
  }

  return generateMeta({
    title: "Not Found",
  });
}

export default async function Page({ params }: PageProps) {
  const { user: userName } = await params;
  return <UserPage userName={userName} />;
}
