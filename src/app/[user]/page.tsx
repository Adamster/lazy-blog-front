import { getPostsByUserNameSSR } from "@/features/post/model/get-posts-by-username.ssr";
import { generateMeta } from "@/shared/lib/head/meta-data";
import { displayNameOf } from "@/shared/lib/utils";
import UserPage from "./user-page";

type PageProps = {
  params: Promise<{ user: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { user } = await params;
  const postsPage = await getPostsByUserNameSSR(user);
  const userData = postsPage?.user;

  if (userData) {
    return generateMeta({
      title: displayNameOf(userData, user),
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

// No SSR feed seed — a published-only seed flashed and made the stats jump once the
// authenticated client feed (with the owner's drafts) loaded in. Meta still comes from above.
export default async function Page({ params }: PageProps) {
  const { user: userName } = await params;
  return <UserPage userName={userName} />;
}
