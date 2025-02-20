import { IUser } from "@/types";
import { formatDate2 } from "@/utils/format-date";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import Link from "next/link";
import s from "./user.module.scss";
import { UserResponse } from "@/api/apis";

interface IProps {
  user: UserResponse | undefined;
  postsNum: number | undefined;
  authUserId: string | undefined;
}

export const UserDetails = ({ user, authUserId, postsNum }: IProps) => {
  return (
    <div className={classNames(s.userDetails)}>
      {user && (
        <div className={s.userTop}>
          {user.avatarUrl && (
            <div className={s.avatar}>
              <img src={user.avatarUrl} alt={user.userName} />
            </div>
          )}

          <div className="text-center mb-8">
            {`${user.firstName} ${user.lastName}`}
            {user.id === authUserId && (
              <Link
                href={`/u/edit/`}
                className="inline-block color-primary ml-4"
              >
                <PencilSquareIcon width={"1rem"} />
              </Link>
            )}
            <h1 className="text-2xl font-bold"></h1>

            <p className="color-gray">
              Зарегался {formatDate2(user.createdOnUtc || "")}
            </p>

            {/* <div className="flex content-center flex-wrap">
              <div className="flex flex-nowrap content-center text-gray-500 mr-4">
                <CalendarDaysIcon className="mr-2" width={"1rem"} />
                <small className="whitespace-nowrap">На сайте с 2023</small>
              </div>
              <div className="flex flex-nowrap content-center text-gray-500">
                <PencilSquareIcon className="mr-2" width={"1rem"} />
                <small className="whitespace-nowrap">{postsNum} постов</small>
              </div>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};
