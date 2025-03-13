import { useAuth } from "@/providers/auth-provider";
import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  userId: string;
  fallback?: ReactNode;
}

const IsAuthor = ({ children, userId, fallback = null }: IProps) => {
  const { user } = useAuth();
  console.log(user?.id === userId);
  return user?.id === userId ? children : fallback;
};

export default IsAuthor;
