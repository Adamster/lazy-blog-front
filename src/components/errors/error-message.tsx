/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ResponseError } from "@/shared/api/openapi";
import { useTheme } from "@/shared/providers/theme-providers";
import { Button, Link } from "@heroui/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import LogoDark from "@/assets/icons/logo-dark.svg";
import LogoLight from "@/assets/icons/logo-light.svg";

export const ErrorMessage = ({ error }: { error: unknown }) => {
  const { isDarkTheme } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchErrorMessage = async () => {
      if ((error as any)?.response?.status === 404) {
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
    <div className="min-h-screen -mt-16 flex flex-col gap-4 items-center justify-center">
      <Image
        src={isDarkTheme ? LogoLight : LogoDark}
        width={80}
        height={80}
        alt="Logo"
      />
      <h2 className="text-3xl font-bold">A glitch in the Lazyverse...</h2>
      <p>{errorMessage}</p>
      <Button as={Link} href="/">
        Go Home
      </Button>
    </div>
  );
};
