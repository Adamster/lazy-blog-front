import { ReactNode } from "react";
import { useAuth } from "@/entities/session/model/use-auth";
import { useUser } from "@/entities/session/provider/user-provider";

interface IProps {
  children: ReactNode;
  userId: string;
  /** Rendered once resolved when the viewer is NOT the author. */
  fallback?: ReactNode;
  /**
   * Rendered while auth/user are still resolving. Defaults to `null` so islands
   * (post kebab, comment menu) show nothing until resolved; page-level guards
   * pass `<Loading />` to hold a neutral screen instead of flashing the
   * not-author `fallback` (the glitch ErrorMessage) mid-resolution.
   */
  loadingFallback?: ReactNode;
}

/**
 * Authorship guard. Loading-aware: it waits for BOTH auth (`authStatus`) and the
 * current-user query (`isUserResolved`) to settle before comparing ids, so
 * "still resolving the viewer" is shown as `loadingFallback` rather than
 * mistaken for "not the author".
 */
export const IsAuthor = ({
  children,
  userId,
  fallback = null,
  loadingFallback = null,
}: IProps) => {
  const { authStatus } = useAuth();
  const { user, isUserResolved } = useUser();

  if (authStatus === "loading" || !isUserResolved) return loadingFallback;
  return user?.id === userId ? children : fallback;
};
