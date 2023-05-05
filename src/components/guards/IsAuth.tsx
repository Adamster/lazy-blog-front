import { useSession } from "next-auth/react";

interface IProps {
  children: React.ReactElement;
}

const IsAuth = ({ children }: IProps) => {
  const { data: auth } = useSession();

  if (auth?.user.id) {
    return children;
  }

  return <></>;
};

export default IsAuth;
