import { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import HomePage from "./home-page";
import { generateMeta } from "@/shared/lib/head/meta-data";
import { getAllPostsSSR } from "@/features/post/model/get-all-posts.ssr";

export const metadata: Metadata = generateMeta({
  title: "Home",
});

export default async function Page() {
  const posts = await getAllPostsSSR(0);

  const queryClient = new QueryClient();
  queryClient.setQueryData(["getAllPosts"], {
    pages: [posts],
    pageParams: [0],
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  );
}
