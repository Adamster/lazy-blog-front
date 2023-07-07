import { useSession } from "next-auth/react";

interface IProps {
  children: React.ReactElement;
  isNot?: JSX.Element;
}

const IsAuth = ({ children, isNot }: IProps) => {
  const { data: auth } = useSession();

  if (auth?.user.id) {
    return children;
  } else if (isNot) {
    return isNot;
  }

  return <></>;
};

export default IsAuth;
