import { API_URL } from "@/utils/fetcher";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import classNames from "classnames";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import s from "./post.module.scss";

interface IProps {
  postId: string;
  mutate: () => void;
  rating: number;
}

export const PostVote = ({ postId, rating, mutate }: IProps) => {
  const { data: auth } = useSession();

  const handleVote = async (direction: string) => {
    await axios
      .put(
        `${API_URL}/posts/${postId}/vote?direction=${direction}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth?.user?.accessToken}`,
          },
        }
      )
      .then(async (response) => {
        mutate();
      })
      .catch(({ error }) => {
        toast.error("Больше не положено");
      });
  };

  return (
    <div className="flex items-center">
      <div
        className="btn px-1"
        onClick={() => {
          handleVote("down");
        }}
      >
        <ChevronDownIcon
          width={".9rem"}
          color="var(--color-danger)"
        ></ChevronDownIcon>
      </div>

      <div className={classNames(s.footerStatsNum, "flex items-center mx-3")}>
        {rating}
      </div>

      <div
        className="btn px-1"
        onClick={() => {
          handleVote("up");
        }}
      >
        <ChevronUpIcon
          width={".9rem"}
          color="var(--color-success)"
        ></ChevronUpIcon>
      </div>
    </div>
  );
};
