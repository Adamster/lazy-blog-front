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

  // const handleSignOut = useCallback(() => {
  //   console.warn("[Auth] Token refresh error, signing out...");
  //   signOut();
  // }, []);

  useEffect(() => {
    if ((session as any)?.error) {
      console.log("session", session);
      signOut();
    }
  }, [session]);

  if (status === "loading") return null;

  return <>{children}</>;
}
