import { useSession } from "next-auth/react";

const IsAuthor = ({ children, userId }: any) => {
  const { data: auth }: any = useSession();

  if (auth?.user.id === userId) {
    return children;
  } else return <></>;
};

export default IsAuthor;
