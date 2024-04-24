import { IUserDetails } from '@/types';
import classNames from 'classnames';
import { useState } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { API_URL } from '@/utils/fetcher';
interface IProps {
  fallback: IUserDetails;
}

//Component
export default function EditProfile() {
  const { data: auth } = useSession();
  const router = useRouter();

  const [requesting, setRequesting] = useState(false);

  const form = useForm();

  const handleAvatarChange = (e: any) => {
    const file = e.target.files[0];
    form.setValue('avatar', file);
  };

  const handleSubmit = async (data: any) => {
    setRequesting(true);

    const formData = new FormData();

    // formData.append('userId', id); // Предполагается, что запрос содержит идентификатор пользователя
    formData.append('file', data.avatar);

    try {
      await axios.post(`${API_URL}/users/${auth?.user.id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${auth?.user.accessToken}`,
        },
      });
      toast.success('Аватар успешно обновлен!');
      router.back();
    } catch (error) {
      toast.error('Произошла ошибка при обновлении аватара');
      console.error(error);
    } finally {
      setRequesting(false);
    }
  };

  // const router = useRouter();
  // const { user } = router.query;

  // const { data, error, isLoading } = useSWR<IUserDetails>(
  //   `${API_URL}/posts/${user}/posts`,
  //   fetcher
  //   // {
  //   //   fallbackData: fallback,
  //   // }
  // );

  // if (error || data?.code)
  //   return <ErrorMessage code={error?.response?.data?.code} />;

  return (
    <>
      {/* <Head>
        <title>{data?.user.userName} | Not Lazy Blog</title>
        <meta property="og:title" content={data?.user.userName} />
      </Head> */}

      <div className={classNames('mb-4')}>
        <h1 className="text-3xl font-bold">EDIT USER</h1>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <label htmlFor="avatar">Загрузить новый аватар:</label>
          <div className="flex items-center mt-2">
            <label
              htmlFor="avatar"
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-600 cursor-pointer"
            >
              <CloudArrowUpIcon className="w-5 h-5 mr-2" /> Выбрать файл
              <input
                type="file"
                id="avatar"
                name="avatar"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 cursor-pointer"
          >
            Сохранить изменения
          </button>
        </form>
      </div>

      {/* {isLoading && <Loading />}

      {data?.user && (
        <div className={classNames("mb-4")}>
          <h1 className="text-3xl font-bold">{`${data?.user.firstName} ${data?.user.lastName}`}</h1>
          <p>Лучшие статьи</p>
        </div>
      )}

      {data?.postItems &&
        data.postItems.map((post: IPost) => (
          <PostPreview
            key={post.id}
            post={post}
            author={data.user}
          ></PostPreview>
        ))} */}
    </>
  );
}

// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   const user = context.params?.username;
//   const res = await fetch(`${API_URL}/posts/${user}/posts`);
//   const fallback = await res.json();

//   return { props: { fallback } };
// }
