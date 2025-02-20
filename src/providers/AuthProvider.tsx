"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthHandler>{children}</AuthHandler>
    </SessionProvider>
  );
}

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { data: auth } = useSession();

  useEffect(() => {
    if ((auth as any)?.error === "RefreshAccessTokenError") {
      signOut();
    }
  }, [auth]);

  return <>{children}</>;
}
