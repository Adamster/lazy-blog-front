"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/shared/ui";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import {
  fetchTrending,
  searchMedia,
  type GifResult,
  type MediaKind,
} from "../lib/klipy";

function StatusLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center text-center text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase">
      {children}
    </div>
  );
}

interface GifPickerProps {
  onPick: (gif: GifResult) => void;
  kind: MediaKind;
}

export function GifPicker({ onPick, kind }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const reduced = useReducedMotion();
  const noun = kind === "sticker" ? "stickers" : "GIFs";

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["klipy", kind, debounced || "trending"],
    queryFn: ({ signal }) =>
      debounced
        ? searchMedia(kind, debounced, signal)
        : fetchTrending(kind, signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  return (
    // The px-4 inset is applied PER-ELEMENT (search + grid), NOT on this root, so the scroll area runs
    // full-width and the scrollbar sits in its own right gutter, never overlapping the GIF grid.
    <div className="pt-4 pb-4">
      <div className="px-4">
        <div className="flex h-9 items-center gap-2.5 border-b-2 border-[var(--m-dim)] transition-colors focus-within:border-[var(--m-accent)]">
          <MagnifyingGlassIcon
            className="size-3.5 shrink-0 text-[var(--m-muted2)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={`Search ${noun}`}
            placeholder={`Search ${noun}`}
            autoComplete="off"
            className="h-full w-full border-0 bg-transparent text-[14px] leading-none text-[var(--m-fg)] caret-[var(--m-accent)] outline-none placeholder:text-[var(--m-muted2)]"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </div>
      </div>

      <div className="mono-scrollbar mt-3 h-48 overflow-y-auto">
        {isPending ? (
          <StatusLine>
            <Spinner className="text-[14px] text-[var(--m-accent)]" />
          </StatusLine>
        ) : isError ? (
          <StatusLine>
            <button
              type="button"
              onClick={() => refetch()}
              className={`mono-focus tracking-[0.12em] text-[var(--m-error)] uppercase transition-colors hover:text-[var(--m-fg)]`}
            >
              {`Couldn't load ${noun} · Retry`}
            </button>
          </StatusLine>
        ) : data.length === 0 ? (
          <StatusLine>{`No ${noun} found`}</StatusLine>
        ) : (
          <div className="grid grid-cols-3 gap-[2px] pr-1.5 pl-4">
            {data.map((gif) => (
              <button
                key={gif.id}
                type="button"
                aria-label={`Insert ${gif.title}`}
                onClick={() => onPick(gif)}
                className={`group mono-focus relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--m-card)] transition-opacity hover:opacity-80`}
              >
                {/* Plain <img> not next/image: KLIPY hosts aren't in next.config remotePatterns (owner can't edit Vercel config). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reduced ? gif.stillUrl : gif.thumbUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// SSR-safe: starts false, syncs on mount.
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    // Defer the setState out of the effect body (repo lint rule).
    raf.current = requestAnimationFrame(() =>
      setReduced(prefersReducedMotion())
    );
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, []);
  return reduced;
}
