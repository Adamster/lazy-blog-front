"use client";

import { ResponseError } from "@/shared/api/openapi";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GlitchText } from "./glitch-text";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

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
  reset,
  status: statusProp,
}: {
  error: unknown;
  reset?: () => void;
  /** Force the status line (e.g. 404 for the not-found page). */
  status?: number;
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <div
      className="mono-scope flex min-h-screen w-full flex-col justify-center bg-[var(--m-bg)] px-10 py-14 text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-6 flex items-center gap-2.5 text-[11px] tracking-[0.12em] text-[var(--m-error)]">
          <span
            aria-hidden="true"
            className="inline-block size-2 bg-[var(--m-error)]"
          />
          {statusLine}
        </div>

        <h1 className="font-display text-[32px] leading-[1.04] font-bold tracking-[-0.02em] text-[var(--m-fg)] md:text-[40px]">
          <GlitchText caret>A glitch in the Lazyverse</GlitchText>
        </h1>

        <p className="mt-5 max-w-[42ch] text-[14px] leading-[1.6] text-[var(--m-muted)]">
          Something broke on our side — not you. Try again; if it keeps
          happening, head back home.
        </p>

        {errorMessage ? (
          <div className="mt-6 border-2 border-[var(--m-dim)] bg-[var(--m-card)]">
            <div className="flex items-center gap-2 border-b-2 border-[var(--m-dim)] px-3 py-2">
              <span className="size-2 border-2 border-[var(--m-error)]" />
              <span className="size-2 border-2 border-[var(--m-dim)]" />
              <span className="ml-1 text-[11px] tracking-[0.06em] text-[var(--m-muted2)]">
                stacktrace.log
              </span>
            </div>
            <div className="px-3 py-3 text-[11px] leading-[1.6] break-words text-[var(--m-muted)]">
              <span className="text-[var(--m-error)]">Error</span>
              {": "}
              <span className="text-[var(--m-fg)]">{errorMessage}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-3">
          {reset ? (
            <button
              type="button"
              onClick={reset}
              className={`mono-cta inline-flex h-9 items-center justify-center px-4 text-[14px] font-bold tracking-[0.06em] ${focusRing}`}
            >
              Try again
            </button>
          ) : null}
          <Link
            href="/"
            className={`inline-flex h-9 items-center justify-center px-4 text-[14px] font-semibold tracking-[0.06em] ${
              reset ? "mono-btn-outline" : "mono-cta font-bold"
            } ${focusRing}`}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
};
