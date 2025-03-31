import { UserIcon } from "@heroicons/react/24/outline";
import { User } from "@heroui/react";

export const NotLazyAvatar = () => (
  <User
    avatarProps={{
      size: "md",
      src: "https://notlazy.org/images/notlazy.png",
      fallback: <UserIcon className="w-4 h-4" />,
    }}
    name={`!Lazy Blog`}
    description={"@notlazy"}
  />
);
