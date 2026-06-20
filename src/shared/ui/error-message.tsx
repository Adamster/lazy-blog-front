"use client";

import { ResponseError } from "@/shared/api/openapi";
import { useTheme } from "@/shared/providers/theme-providers";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import LogoDark from "@/assets/icons/logo-dark.svg";
import LogoLight from "@/assets/icons/logo-light.svg";

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

export const ErrorMessage = ({ error }: { error: unknown }) => {
  const { isDarkTheme } = useTheme();
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

  return (
    <div
      className="mono-scope flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--m-bg)] px-10 text-center text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <Image
        src={isDarkTheme ? LogoLight : LogoDark}
        width={80}
        height={80}
        alt="NOT LAZY"
      />
      <h1 className="font-display text-[32px] leading-[1.04] font-bold tracking-[-0.02em]">
        A glitch in the Lazyverse...
      </h1>
      {errorMessage ? (
        <p className="text-[14px] leading-[1.6] text-[var(--m-muted)]">
          {errorMessage}
        </p>
      ) : null}
      <Link
        href="/"
        className="mono-cta inline-flex h-9 items-center px-4 text-[14px] font-bold tracking-[0.06em]"
      >
        Go Home
      </Link>
    </div>
  );
};
