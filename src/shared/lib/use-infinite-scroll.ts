import { useCallback, useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetching?: boolean;
  rootMargin?: string;
}

/**
 * Returns a CALLBACK ref for an end-of-list sentinel; fires `fetchNextPage` when
 * it enters view. A callback ref (not `useRef` + mount effect) because feeds
 * render the sentinel conditionally — it mounts only after page 1 resolves, so a
 * one-shot mount effect would see `null` and never re-attach (page 2 never loads).
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>({
  hasNextPage,
  fetchNextPage,
  isFetching = false,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const handlers = useRef({ hasNextPage, fetchNextPage, isFetching });
  const observerRef = useRef<IntersectionObserver | null>(null);

  // The observer reads `handlers.current` at intersection time, so it stays
  // current without being re-created on query-object churn.
  useEffect(() => {
    handlers.current = { hasNextPage, fetchNextPage, isFetching };
  });

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const { hasNextPage, fetchNextPage, isFetching } = handlers.current;
          if (entry.isIntersecting && hasNextPage && !isFetching) {
            fetchNextPage();
          }
        },
        { rootMargin }
      );
      observerRef.current.observe(node);
    },
    [rootMargin]
  );
}
