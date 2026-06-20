import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  /** Whether another page can still be loaded. */
  hasNextPage: boolean;
  /** Fetch the next page; called once each time the sentinel enters view. */
  fetchNextPage: () => void;
  /** Suppress fetches while a page is already in flight. */
  isFetching?: boolean;
  /**
   * How far below the viewport to trigger the next fetch (px). Defaults to
   * `200px` so the next page is requested just before the sentinel is reached.
   */
  rootMargin?: string;
}

/**
 * Backs an infinite-scroll feed with an `IntersectionObserver`. Returns a ref to
 * attach to a sentinel element rendered at the end of the list; when it enters
 * view (and `hasNextPage`), `fetchNextPage` fires.
 *
 * Keeps the observer wiring out of page bodies so the home + profile feeds share
 * one implementation. The latest `fetchNextPage`/flags are read through a ref so
 * the observer is created once and never thrashes on query-object identity.
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>({
  hasNextPage,
  fetchNextPage,
  isFetching = false,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<T>(null);
  const handlers = useRef({ hasNextPage, fetchNextPage, isFetching });

  // Keep the latest query callbacks/flags available to the observer without
  // re-creating it: the observer reads `handlers.current` at intersection time.
  useEffect(() => {
    handlers.current = { hasNextPage, fetchNextPage, isFetching };
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const { hasNextPage, fetchNextPage, isFetching } = handlers.current;
        if (entry.isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return sentinelRef;
}
