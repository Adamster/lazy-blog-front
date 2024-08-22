import { useSession } from 'next-auth/react';

import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';

import Loading from '@/components/loading';
import { CreateEdit } from '@/components/post/CreateEdit';
import { API_URL } from '@/utils/fetcher';
import axios from 'axios';
import { useRouter } from 'next/dist/client/router';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

// Component

const Create = () => {
  const { data: auth } = useSession();
  const router = useRouter();

  const [requesting, setRequesting] = useState(false);

  const form = useForm({ shouldFocusError: false });
  const { reset } = form;

  const onSubmit = async (data: any) => {
    setRequesting(true);
    await axios
      .post(
        `${API_URL}/posts`,
        {
          userId: auth?.user.id,
          ...data,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth?.user.accessToken}`,
          },
        }
      )
      .then((response) => {
        toast.success('Это успех!');
        reset();
      })
      .catch((error) => {
        toast.error('Чё-то ошибка');
        console.log(error);
      })
      .finally(() => {
        setRequesting(false);
      });
  };

  const handlePaste = useCallback(async (event: any) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.indexOf('image') === -1) continue;

      const file = item.getAsFile();
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
          `${API_URL}/media/${auth?.user.id}/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${auth?.user.accessToken}`,
            },
          }
        );
        const imageUrl = response.data; // Adjust based on returned data structure
        console.log('File uploaded on url:');
        console.log(imageUrl);
        console.log(response.data);
        if (imageUrl) {
          const activeElement = document.activeElement;
          console.log(activeElement);
          var contentToAppend = `![image](${imageUrl})`;
          activeElement?.append(contentToAppend);
        }
      } catch (error) {
        console.error('Image upload failed:', error);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <>
      <Head>
        <title>Новый Пост | Not Lazy Blog</title>
      </Head>

      {requesting && <Loading />}

      <div className="p-8">
        <CreateEdit form={form} onSubmit={onSubmit} />
      </div>
    </>
  );
};

export default Create;
