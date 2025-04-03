import { UserResponse } from "@/shared/api/openapi";
import { Avatar, User } from "@heroui/react";
import { Link } from "@heroui/react";

interface IProps {
  user: UserResponse | undefined;
  isProfile?: boolean;
  isLink?: boolean;
  isAvatarOnly?: boolean;
}

export const UserAvatar = ({
  user,
  isProfile,
  isLink,
  isAvatarOnly,
}: IProps) => {
  if (!user) return null;

  const avatar = (
    <User
      key={user?.id}
      avatarProps={{
        className: isProfile ? "w-24 h-24 me-1 text-large" : "",
        size: "sm",
        src: user?.avatarUrl || undefined,
        name: `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`,
      }}
      name={`${user?.firstName} ${user?.lastName}`}
      description={"@" + user?.userName}
    />
  );

  const avatarOnly = (
    <Avatar
      size="sm"
      src={user.avatarUrl || undefined}
      name={`${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`}
    />
  );

  return isLink ? (
    <Link
      href={`/${user.userName}`}
      className="text-foreground hover:opacity-70 transition-opacity"
    >
      {isAvatarOnly ? avatarOnly : avatar}
    </Link>
  ) : (
    avatar
  );
};
