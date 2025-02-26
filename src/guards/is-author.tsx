import { useAuth } from "@/providers/auth-provider";

interface IProps {
  children: React.ReactElement;
  userId: string;
}

const IsAuthor = ({ children, userId }: IProps) => {
  const { user } = useAuth();
  return user?.id === userId ? children : null;
};

export default IsAuthor;
