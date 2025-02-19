"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

import { apiClient } from "@/api/apiClient";
import ErrorMessage from "@/components/errorMessages/ErrorMessage";
import Loading from "@/components/loading";
import PostPreview from "@/components/post/PostPreview";
import { UserDetails } from "@/components/user/UserDetails";

const PAGE_SIZE = 12;

export default function User() {
  const observerRef = useRef(null);
  const { data: auth } = useSession();
  const params = useParams();
  const userName = params?.user as string;

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["apiUsersIdPostsGet", userName],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.posts.apiPostsUserNamePostsGet({
        userName,
        offset: pageParam,
      });

      return {
        postItems: response?.postItems || [],
        user: response?.user || null, // Убеждаемся, что `user` есть
      };
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.postItems.length === PAGE_SIZE
        ? allPages.length * PAGE_SIZE
        : undefined,
    initialPageParam: 0,
    enabled: !!userName, // Запрос выполняется только при наличии userName
  });

  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  if (error) return <ErrorMessage code={error.message || "Unknown error"} />;

  const user = data?.pages?.[0]?.user; // Гарантированно берем `user` из первой страницы
  const posts = data?.pages?.flatMap((page) => page.postItems) || []; // Собираем `postItems` из всех страниц

  return (
    <div className="wrapper p-8">
      {(isLoading || isFetchingNextPage) && <Loading />}

      {user && (
        <div className="mb-8">
          <UserDetails
            user={user}
            authUserId={auth?.user?.id}
            postsNum={posts.length}
          />
        </div>
      )}

      <div className="postsGrid">
        {posts.map((post) => (
          <PostPreview key={post.id} post={post} author={user} />
        ))}
      </div>

      <div ref={observerRef} className="h-10" />

      {posts.length === 0 && <p className="text-center">Нет постов</p>}
    </div>
  );
}
