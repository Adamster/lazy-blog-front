/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthHandler>{children}</AuthHandler>
    </SessionProvider>
  );
}

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (
      status === "authenticated" &&
      (session as any)?.error === "RefreshAccessTokenError"
    ) {
      signOut();
    }
  }, [session, status]);

  if (status === "loading") return null;

  return <>{children}</>;
}
