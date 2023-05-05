import { useSession } from "next-auth/react";

interface IProps {
  children: React.ReactElement;
  userId: string;
}

const IsAuthor = ({ children, userId }: IProps) => {
  const { data: auth } = useSession();

  if (auth?.user.id === userId) {
    return children;
  }

  return <></>;
};

export default IsAuthor;
