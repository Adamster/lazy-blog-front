"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/entities/session/model/use-auth";
import { Loading } from "@/shared/ui";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Redirects only once the viewer is KNOWN unauthenticated, so a refresh doesn't
// kick an authed user to "/" during the localStorage-resolution beat.
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
