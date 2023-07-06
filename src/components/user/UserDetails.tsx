import { IUser } from "@/types";
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
        <div>
          {user.avatarUrl && (
            <div className="flex items-center w-full justify-center mb-4">
              <div className={s.avatar}>
                <img src={user.avatarUrl} alt={user.userName} />
              </div>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {`${user.firstName} ${user.lastName}`}
            </h1>
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
