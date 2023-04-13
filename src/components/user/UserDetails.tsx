import { IUser } from "@/types";
import { generateColor } from "@/utils/generate-color";
import {
  CalendarDaysIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";

import s from "./user.module.scss";

interface IProps {
  user: IUser | undefined;
  postsNum: number | undefined;
  authUserId: string | undefined;
}

export const UserDetails = ({ user, authUserId, postsNum }: IProps) => {
  return (
    <div className={classNames(s.userDetails, "p-in")}>
      {user && (
        <div className="flex">
          <div
            className={s.userDetailsAva}
            style={{ backgroundColor: generateColor(user.userName) }}
          ></div>

          <div className={s.userDetailsData}>
            <h1 className="text-xl font-bold mb-2 whitespace-normal">
              {`${user.firstName} ${user.lastName}`}
            </h1>
            <div className="flex content-center flex-wrap">
              <div className="flex flex-nowrap content-center text-gray-500 mr-4">
                <CalendarDaysIcon className="mr-2" width={"1rem"} />
                <small className="whitespace-nowrap">На сайте с 2023</small>
              </div>
              <div className="flex flex-nowrap content-center text-gray-500">
                <PencilSquareIcon className="mr-2" width={"1rem"} />
                <small className="whitespace-nowrap">{postsNum} постов</small>
              </div>
            </div>
          </div>

          {/* TODO: USER EDIT BUTTON */}
          {/* {user.id === authUserId && (
            <Link href="/u/edit" className="btn btn--edit">
              <PaintBrushIcon width={"1rem"} />
            </Link>
          )} */}
        </div>
      )}
    </div>
  );
};
