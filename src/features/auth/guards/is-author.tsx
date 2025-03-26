import { ReactNode } from "react";
import { useUser } from "@/shared/providers/user-provider";

interface IProps {
  children: ReactNode;
  userId: string;
  fallback?: ReactNode;
}

const IsAuthor = ({ children, userId, fallback = null }: IProps) => {
  const { user } = useUser();
  return user?.id === userId ? children : fallback;
};

export default IsAuthor;
