"use client";

import { useEffect } from "react";
import { ErrorMessage } from "@/shared/ui";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorMessage error={error} reset={reset} />;
}
