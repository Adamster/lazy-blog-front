import { API_URL } from "@/utils/fetcher";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

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
      .catch((error) => {
        toast.error(
          error.response.data.detail ?? "Возможно ошибка авторизации"
        );
      });
  };

  return (
    <div className="flex items-center justify-center">
      <button
        className="btn btn--default btn--link"
        style={{ padding: ".1rem" }}
        onClick={() => {
          handleVote("down");
        }}
      >
        <ChevronDownIcon width={".9rem"}></ChevronDownIcon>
      </button>

      <div className="mx-2">{rating}</div>

      <button
        className="btn btn--default btn--link"
        style={{ padding: ".1rem" }}
        onClick={() => {
          handleVote("up");
        }}
      >
        <ChevronUpIcon width={".9rem"}></ChevronUpIcon>
      </button>
    </div>
  );
};
