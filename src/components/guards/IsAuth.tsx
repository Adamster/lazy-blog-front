import { useSession } from "next-auth/react";

const IsAuth = ({ children }: any) => {
  const { data: auth }: any = useSession();

  if (auth?.user.id) {
    return children;
  } else return <></>;
};

export default IsAuth;
