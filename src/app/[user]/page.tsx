import { notFound } from "next/navigation";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
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

export default async function Page({ params }: PageProps) {
  const { user: userName } = await params;

  const postsPage = await getPostsByUserNameSSR(userName);
  if (!postsPage?.user) notFound();

  const queryClient = new QueryClient();
  queryClient.setQueryData(["getPostsByUserName", userName], {
    pages: [postsPage],
    pageParams: [0],
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserPage userName={userName} />
    </HydrationBoundary>
  );
}
