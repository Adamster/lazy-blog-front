import { getPostsByUserNameSSR } from "@/features/post/model/get-posts-by-username.ssr";
import { generateMeta } from "@/shared/lib/head/meta-data";
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

// No SSR feed seed: the profile feed loads client-side (authenticated, so the
// OWNER sees their own drafts directly) — this removes the no-auth published-only
// seed that flashed + made the likes/views stats jump when drafts loaded in.
// `generateMetadata` above still emits the social/SEO meta tags; missing users
// surface via the client query's error state.
export default async function Page({ params }: PageProps) {
  const { user: userName } = await params;
  return <UserPage userName={userName} />;
}
