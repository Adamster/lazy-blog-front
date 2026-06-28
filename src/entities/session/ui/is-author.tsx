import { ReactNode } from "react";
import { useAuth } from "@/entities/session/model/use-auth";
import { useUser } from "@/entities/session/provider/user-provider";

interface IProps {
  children: ReactNode;
  userId: string;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

// Waits for BOTH auth and the current-user query to settle before comparing
// ids, so "still resolving the viewer" isn't mistaken for "not the author".
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
