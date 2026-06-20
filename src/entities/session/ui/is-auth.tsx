import { useAuth } from "@/entities/session/model/use-auth";
import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const IsAuth = ({ children, fallback = null }: IProps) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : fallback;
};
