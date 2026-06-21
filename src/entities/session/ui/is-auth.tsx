import { useAuth } from "@/entities/session/model/use-auth";
import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  /** Rendered when auth has resolved and the viewer is NOT authenticated. */
  fallback?: ReactNode;
  /**
   * Rendered while auth is still resolving (localStorage read on first paint).
   * Defaults to `null` so islands (comment box, kebabs) show nothing until
   * resolved; page-level guards pass `<Loading />` to hold a neutral screen and
   * avoid flashing the `fallback` (e.g. the glitch ErrorMessage) mid-resolution.
   */
  loadingFallback?: ReactNode;
}

/**
 * Auth guard. Loading-aware: while `authStatus` is `"loading"` it renders
 * `loadingFallback` (never the denied `fallback`), so a refresh of an authed
 * surface doesn't flash the unauthenticated state before localStorage resolves.
 */
export const IsAuth = ({
  children,
  fallback = null,
  loadingFallback = null,
}: IProps) => {
  const { authStatus } = useAuth();

  if (authStatus === "loading") return loadingFallback;
  return authStatus === "authenticated" ? children : fallback;
};
