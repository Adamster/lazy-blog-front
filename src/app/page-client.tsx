"use client";

import { apiClient } from "@/api/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { addToast, Divider } from "@heroui/react";
import { Loading } from "@/components/loading";
import { PostsList } from "@/components/posts/posts-list";
// import IsAuth from "@/guards/is-auth";

export const PageClient = () => {
  const observerRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 24;

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["getAllPosts"],
    queryFn: ({ pageParam = 0 }) =>
      apiClient.posts.getAllPosts({ offset: pageParam }) ?? [],
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
    initialPageParam: 0,
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

  if (isLoading) return <Loading />;

  if (error) {
    addToast({
      title: "Error",
      description: error?.message || "Unknown error",
      color: "danger",
    });
    return null;
  }

  return (
    <>
      <div className="layout-page">
        <div className="layout-page-content">
          {/* <IsAuth>
            <div className="flex justify-between items-center mb-12">
              <Tabs variant="solid">
                <Tab key="latest" title="Latest" />
                <Tab key="for_you" title="For You" />
              </Tabs>
            </div>
          </IsAuth> */}

          {data?.pages?.flat && <PostsList posts={data?.pages?.flat()} />}
        </div>

        <div className="layout-page-aside hidden">
          <Divider
            className="layout-page-aside-divider"
            orientation="vertical"
          />

          <div className="layout-page-aside-content">
            <aside className="layout-page-aside-content-sticky">
              {/* <div className="flex flex-col">
                <div>
                  <Link
                    href="/"
                    underline="hover"
                    color="foreground"
                    onPress={() => {}}
                  >
                    Art
                  </Link>

                  <Chip size="sm" className="ms-2" variant="flat">
                    2
                  </Chip>
                </div>
                <div>
                  <Link
                    href="/"
                    underline="hover"
                    color="foreground"
                    onPress={() => {}}
                  >
                    Food
                  </Link>
                  <Chip size="sm" className="ms-2" variant="bordered">
                    15
                  </Chip>
                </div>
                <div>
                  <Link
                    href="/"
                    underline="hover"
                    color="foreground"
                    onPress={() => {}}
                  >
                    Movies
                  </Link>
                  <Chip size="sm" className="ms-2" variant="flat">
                    5
                  </Chip>
                </div>
                <div>
                  <Link
                    href="/"
                    underline="hover"
                    color="foreground"
                    onPress={() => {}}
                  >
                    Music
                  </Link>
                  <Chip size="sm" className="ms-2" variant="flat">
                    7
                  </Chip>
                </div>
                <div>
                  <Link
                    href="/"
                    underline="hover"
                    color="foreground"
                    onPress={() => {}}
                  >
                    News
                  </Link>
                  <Chip size="sm" className="ms-2" variant="flat">
                    75
                  </Chip>
                </div>
                <div>
                  <Link
                    href="/"
                    underline="hover"
                    color="foreground"
                    onPress={() => {}}
                  >
                    Programming
                  </Link>
                  <Chip size="sm" className="ms-2" variant="flat">
                    456
                  </Chip>
                </div>
                <div>
                  <Link
                    href="/"
                    underline="hover"
                    color="foreground"
                    onPress={() => {}}
                  >
                    Sport
                  </Link>
                  <Chip size="sm" className="ms-2" variant="flat">
                    33
                  </Chip>
                </div>
                <div>
                  <Link
                    href="/"
                    underline="hover"
                    color="foreground"
                    onPress={() => {}}
                  >
                    Technology
                  </Link>
                  <Chip size="sm" className="ms-2" variant="flat">
                    10
                  </Chip>
                </div>
                <div>
                  <Link
                    href="/"
                    underline="hover"
                    color="foreground"
                    onPress={() => {}}
                  >
                    Travel
                  </Link>
                  <Chip size="sm" className="ms-2" variant="flat">
                    11
                  </Chip>
                </div>
              </div> */}

              <div>
                <h3 className="font-semibold mb-1">Random information</h3>

                <p className="text-zinc-500">
                  Welcome to the Not Lazy blog—where IT creativity is our
                  superpower, and laziness doesn’t even make it past
                  authentication! Here, we code, create, and crack jokes all day
                  long. Dive in, get inspired, and remember—great ideas don’t
                  wait, so let’s build something amazing!
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {isFetchingNextPage && <Loading inline />}
      {hasNextPage && <div ref={observerRef} className="h-20" />}
    </>
  );
};
