import { useCallback, useEffect, useRef } from "react";

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
 * Backs an infinite-scroll feed with an `IntersectionObserver`. Returns a
 * **callback ref** to attach to a sentinel element rendered at the end of the
 * list; when it enters view (and `hasNextPage`), `fetchNextPage` fires.
 *
 * Why a callback ref (not `useRef` + a mount effect): feeds render the sentinel
 * CONDITIONALLY (`hasNextPage && <div ref={…} />`), so on a fresh load it mounts
 * only AFTER page 1 resolves — later than a one-shot mount effect runs. An
 * observer created in that effect sees `current === null` and never re-attaches
 * when the sentinel appears, so page 2 silently never loads (the request just
 * isn't made). A callback ref runs every time the node mounts/unmounts, so the
 * observer attaches the moment the sentinel exists — and re-attaches if it's
 * remounted. The latest `fetchNextPage`/flags are read through a ref so the
 * observer reads fresh values at intersection time without re-creating on
 * query-object churn.
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>({
  hasNextPage,
  fetchNextPage,
  isFetching = false,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const handlers = useRef({ hasNextPage, fetchNextPage, isFetching });
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Keep the latest query callbacks/flags available to the observer without
  // re-creating it: the observer reads `handlers.current` at intersection time.
  useEffect(() => {
    handlers.current = { hasNextPage, fetchNextPage, isFetching };
  });

  // Tear down on unmount so a stale observer can't fire after the feed is gone.
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
