import { UserResponse } from "@/shared/api/openapi";
import { User } from "@heroui/react";
import { Link } from "@heroui/react";

interface IProps {
  user: UserResponse | undefined;
  isProfile?: boolean;
  isLink?: boolean;
}

export const UserAvatar = ({ user, isProfile, isLink }: IProps) => {
  if (!user) return null;

  const avatar = (
    <User
      key={user?.id}
      avatarProps={{
        className: isProfile ? "w-20 h-20 me-1 text-large" : "",
        size: "sm",
        src: user?.avatarUrl || undefined,
        name: `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`,
      }}
      name={`${user?.firstName} ${user?.lastName}`}
      description={"@" + user?.userName}
    />
  );

  return isLink ? (
    <Link
      href={`/${user.userName}`}
      className="text-foreground hover:opacity-70 transition-opacity"
    >
      {avatar}
    </Link>
  ) : (
    avatar
  );
};
