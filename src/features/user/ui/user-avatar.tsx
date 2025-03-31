import { UserResponse } from "@/shared/api/openapi";
import { User } from "@heroui/react";

interface IProps {
  user: UserResponse | undefined;
  isProfile?: boolean;
}

export const UserAvatar = ({ user, isProfile }: IProps) => {
  return (
    <User
      className={isProfile ? "w-20 h-20" : ""}
      key={user?.id}
      avatarProps={{
        size: "md",
        src: user?.avatarUrl || undefined,
        name: `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`,
      }}
      name={`${user?.firstName} ${user?.lastName}`}
      description={"@" + user?.userName}
    />
  );
};
