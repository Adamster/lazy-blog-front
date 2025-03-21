import { useAuth } from "@/features/auth/hooks/use-auth";
import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const IsAuth = ({ children, fallback = null }: IProps) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : fallback;
};

export default IsAuth;
