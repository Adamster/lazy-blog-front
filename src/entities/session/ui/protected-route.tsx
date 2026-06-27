"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/entities/session/model/use-auth";
import { Loading } from "@/shared/ui/feedback/loading";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route guard for auth-only pages. Loading-aware: it holds a neutral `<Loading />`
 * while `authStatus` resolves and only redirects once we KNOW the viewer is
 * unauthenticated — so a refresh of a protected route no longer kicks an authed
 * user to "/" during the localStorage-resolution beat.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const { authStatus } = useAuth();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/");
    }
  }, [authStatus, router]);

  if (authStatus === "loading") return <Loading />;
  if (authStatus === "unauthenticated") return null;

  return children;
};
