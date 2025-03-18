"use client";

import { apiClient } from "@/api/api-client";
import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/components/loading";
import { PostsList } from "@/components/posts/posts-list";
import { PAGE_SIZE } from "@/utils/consts";
import { formatDate2 } from "@/utils/format-date";
import { PencilSquareIcon, UserIcon } from "@heroicons/react/24/outline";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { Divider, User } from "@heroui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function UserClient() {
  const { user: userName } = useParams<{ user: string }>();

  const query = useInfiniteQuery({
    queryKey: ["getPostsByUserName", userName],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.posts.getPostsByUserName({
        userName,
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.postItems.length === PAGE_SIZE
        ? pages.length * PAGE_SIZE
        : undefined,
    initialPageParam: 0,
    enabled: !!userName,
  });

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  const posts = query.data?.pages.flatMap((page) => page.postItems) || [];
  const user = query.data?.pages[0].user || null;

  return (
    <>
      <div className="layout-page">
        <div className="layout-page-content">
          {posts.length > 0 ? (
            <PostsList query={query} posts={posts} author={user} hideAuthor />
          ) : (
            <p>
              No posts yet, probably <strong>{userName}</strong> lost in
              procrastination
            </p>
          )}
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            {user && (
              <aside className="layout-page-aside-content-sticky">
                <User
                  className="mb-1"
                  key={user.id}
                  avatarProps={{
                    size: "md",
                    src: user.avatarUrl || undefined,
                    name: `${user.firstName?.charAt(0)}${user.lastName?.charAt(
                      0
                    )}`,
                  }}
                  name={`${user.firstName} ${user.lastName}`}
                  description={"@" + user.userName}
                />

                {user?.biography && (
                  <div>
                    <p className="text-sm text-gray">About:</p>
                    <p className="whitespace-pre-line">{user?.biography}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-gray">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="ml-1 text-sm">
                      {formatDate2(user.createdOnUtc || "")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <PencilSquareIcon className="w-4 h-4" />
                    <span className="ml-1 text-sm">{posts.length}</span>
                  </div>
                </div>
              </aside>
            )}
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    </>
  );
}
