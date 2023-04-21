import { IAuthSession } from '@/types';
import { API_URL } from '@/utils/fetcher';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { mutate } from 'swr';
import s from './post.module.scss';

interface IProps {
  postId: string;
  buttonDirection: string;
  auth: IAuthSession;
  mutate: any;
  setRequesting: any;
}

export const VotePost = ({
  postId,
  buttonDirection,
  auth,
  mutate,
  setRequesting,
}: IProps) => {
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    setRequesting(true);

    await axios
      .put(
        `${API_URL}/posts/${postId}/vote?direction=${buttonDirection}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.user?.token}`,
          },
        }
      )
      .then(async (response) => {
        mutate();
      })
      .catch(({ error }) => {
        console.log(error);
      })
      .finally(() => {
        setRequesting(false);
      });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <button type="submit">
          {buttonDirection == 'up' ? (
            <ArrowUpIcon className={s.footerStatsIcon}></ArrowUpIcon>
          ) : (
            <ArrowDownIcon className={s.footerStatsIcon}></ArrowDownIcon>
          )}
        </button>
      </form>
    </div>
  );
};
