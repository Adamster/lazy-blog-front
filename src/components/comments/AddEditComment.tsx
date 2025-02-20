import { EmojiStyle, Theme } from "emoji-picker-react";
// import { Theme } from "emoji-picker-react/dist/types/exposedTypes";
import { apiClient } from "@/api/api-client";
import { useTheme } from "@/providers/ThemeProvider";
import { FaceSmileIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";
import classNames from "classnames";
import { Session } from "next-auth";
import dynamic from "next/dynamic";
import { useState } from "react";
import s from "./comments.module.scss";

const Picker = dynamic(
  () => {
    return import("emoji-picker-react");
  },
  { ssr: false }
);

interface IProps {
  postId: string;
  auth: Session | null;
  mutate: any;
  setRequesting: any;
}

const AddEditComment = ({ postId, auth, setRequesting, mutate }: IProps) => {
  const [body, setBody] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const { theme } = useTheme();

  const handleSend = useMutation({
    mutationFn: () => {
      return apiClient.comments.apiCommentsPost({
        addCommentRequest: { postId: postId, userId: auth!.user?.id, body },
      });
    },

    onSuccess: () => {
      setBody("");
      mutate();
    },

    onError: (error: any) => {
      console.log(error);
    },

    onSettled: () => {
      setRequesting(false);
    },
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    setRequesting(true);
    handleSend.mutate();

    // await axios
    //   .post(
    //     `${API_URL}/comments`,
    //     { postId: postId, userId: auth?.user?.id, body: body },
    //     {
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${auth?.user?.accessToken}`,
    //       },
    //     }
    //   )
    //   .then(async (response) => {
    //     setBody("");
    //     mutate();
    //   })
    //   .catch(({ error }) => {
    //     console.log(error);
    //   })
    //   .finally(() => {
    //     setRequesting(false);
    //   });
  };

  return (
    <form onSubmit={handleSubmit} className={s.addCommentForm}>
      <div className={s.addCommentInput}>
        <textarea
          className="input"
          placeholder="Напиши что-ли пару строк"
          required
          value={body}
          onChange={(e: any) => setBody(e.target.value)}
        />

        {showEmoji && (
          <div className={s.emojiPicker}>
            <Picker
              theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={(e: any) => {
                setBody((body) => body + e.emoji);
              }}
              autoFocusSearch={false}
              emojiStyle={EmojiStyle.TWITTER}
              searchDisabled
              height={300}
              width={300}
              skinTonesDisabled
              previewConfig={{
                showPreview: false,
              }}
            />
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <div>
          <button
            className={classNames(
              "btn btn--primary px-2 opacity-50",
              showEmoji ? "opacity-100" : ""
            )}
            onClick={(e: any) => {
              e.preventDefault();
              setShowEmoji((state) => !state);
            }}
          >
            <FaceSmileIcon width={"1rem"} height={"1.5rem"} />
          </button>
        </div>
        <div>
          <button type="submit" className="btn btn--primary px-2">
            <PaperAirplaneIcon width={"1rem"} height={"1.5rem"} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddEditComment;
