"use client";

import { Button } from "@heroui/react";
import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="-mt-16 flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-3xl font-bold">A glitch in the Lazyverse...</h2>
      <p className="text-gray">{error?.message || "Unknown error"}</p>
      <div className="flex gap-2">
        <Button color="primary" variant="flat" onPress={reset}>
          Try again
        </Button>
        <Button variant="light" as="a" href="/">
          Go home
        </Button>
      </div>
    </div>
  );
}
