"use client";

import { ResponseError } from "@/shared/api/openapi";
import { useEffect, useState } from "react";
import { GlitchText } from "@/shared/ui/effects";
import { Console } from "../overlays/console";
import { Button } from "../forms/button";

// Narrows the `{ response: { status } }` shape some fetch errors carry.
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

export const ErrorMessage = ({
  error,
  status: statusProp,
}: {
  error: unknown;
  // Accepted for API compat (error.tsx passes Next's reset) but unused.
  reset?: () => void;
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

  const eyebrowText = statusLine;
  const headline = "A glitch in the Lazyverse";
  const lead = "Error detected. Motivation to fix it: pending.";

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
          <Button href="/">Go home</Button>
        </div>
      </div>
    </div>
  );
};
