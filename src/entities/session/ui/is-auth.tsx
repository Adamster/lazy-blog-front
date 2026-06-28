import { useAuth } from "@/entities/session/model/use-auth";
import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  fallback?: ReactNode;
  // Shown while auth resolves; page guards pass `<Loading />` so a refresh of
  // an authed surface doesn't flash the denied `fallback` mid-resolution.
  loadingFallback?: ReactNode;
}

export const IsAuth = ({
  children,
  fallback = null,
  loadingFallback = null,
}: IProps) => {
  const { authStatus } = useAuth();

  if (authStatus === "loading") return loadingFallback;
  return authStatus === "authenticated" ? children : fallback;
};
