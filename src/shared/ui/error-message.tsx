"use client";

import { ResponseError } from "@/shared/api/openapi";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useThemeSafe } from "@/shared/providers/theme-providers";
import { GlitchText } from "@/shared/ui/effects";
import { Console } from "./console";

/** Narrows the `{ response: { status } }` shape some fetch errors carry. */
const statusOf = (error: unknown): number | undefined => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response: { status?: unknown } }).response !== null
  ) {
    const status = (error as { response: { status?: unknown } }).response
      .status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
};

/**
 * Full-screen error state — the "glitch in the Lazyverse" page used wherever a
 * query/boundary fails. Brutalist-Mono: a status line, a glitching headline
 * with a blinking caret, the real error in a `stacktrace.log` panel, and Try
 * again (when a `reset` is wired) + Go home actions.
 */
export const ErrorMessage = ({
  error,
  status: statusProp,
}: {
  error: unknown;
  /** Accepted for API compat (error.tsx passes Next's reset) but unused — the
   *  page only offers Go home now. */
  reset?: () => void;
  /** Force the status line (e.g. 404 for the not-found page). */
  status?: number;
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The root ErrorBoundary fallback renders ABOVE ThemeProvider, so read the
  // theme defensively (off <html>) instead of throwing when there's no provider.
  const { theme } = useThemeSafe();
  const isNeo = theme === "neo";

  useEffect(() => {
    const fetchErrorMessage = async () => {
      if (statusOf(error) === 404) {
        setErrorMessage("Not Found.");
      } else if (error instanceof ResponseError) {
        try {
          const clonedResponse = error.response.clone();
          const errorBody = await clonedResponse.json();
          setErrorMessage(
            errorBody.detail || errorBody.message || "Unknown Error"
          );
        } catch {
          setErrorMessage("Failed to load error details.");
        }
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else if (typeof error === "string") {
        setErrorMessage(error);
      } else {
        setErrorMessage("Unknown Error");
      }
    };

    fetchErrorMessage();
  }, [error]);

  const status = statusProp ?? statusOf(error);
  const statusLine =
    status === 404 ? "NOT FOUND · 404" : `RUNTIME EXCEPTION · ${status ?? 500}`;

  // NEO theme swaps the generic error chrome for a Matrix line (ties into the
  // neo matrix-rain). Same layout/scale — eyebrow + headline + lead all stay in
  // the ONE opening-transmission scene so it reads cohesive, not stitched.
  const eyebrowText = isNeo ? "FOLLOW THE WHITE RABBIT" : statusLine;
  const headline = isNeo ? "The matrix has you…" : "A glitch in the Lazyverse";
  const lead = isNeo
    ? "Knock, knock, Neo."
    : "Error detected. Motivation to fix it: pending.";

  return (
    <div
      className="mono-scope min-h-app flex w-full flex-col justify-center bg-[var(--m-bg)] px-10 py-14 text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-6 flex items-center gap-2.5 text-[11px] leading-none tracking-[0.12em] text-[var(--m-error)]">
          <span
            aria-hidden="true"
            className="inline-block size-2 bg-[var(--m-error)]"
          />
          {eyebrowText}
        </div>

        <h1 className="font-display text-[32px] leading-[1.04] font-bold tracking-[-0.02em] text-[var(--m-fg)] md:text-[40px]">
          <GlitchText caret>{headline}</GlitchText>
        </h1>

        <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
          {lead}
        </p>

        {errorMessage ? (
          <Console title="stacktrace.log" className="mt-6">
            <span className="text-[var(--m-error)]">Error</span>
            {": "}
            <span className="text-[var(--m-fg)]">{errorMessage}</span>
          </Console>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className={`mono-cta mono-focus inline-flex h-9 items-center justify-center px-4 text-[14px] font-bold tracking-[0.06em]`}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
};
