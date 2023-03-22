import { API_URL, fetcher, getPosts } from "@/services/apiService";
import { IPost } from "@/types";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import useSWR from "swr";
import { authOptions } from "./api/auth/[...nextauth]";

interface IProps {
  fallbackData?: IPost[];
}

// Component

export default function Home({ fallbackData }: IProps) {
  const { data: session } = useSession();

  // useEffect(() => {
  //   console.log(session);
  // }, []);

  const { data, error } = useSWR<IPost[]>(`${API_URL}/posts`, fetcher, {
    fallbackData: fallbackData,
  });

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <Head>
        <title>Абоут | NotLazy Blog</title>
      </Head>

      <h3 className="text-2xl font-bold">
        Cамая секретная информация, которая только может существовать в этом
        мире
      </h3>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<IProps> = async ({
  req,
  res,
}) => {
  // const session = await getServerSession(req, res, authOptions);
  // const session = await getCsrfToken(context);
  const session = await getServerSession(req, res, authOptions);

  // console.log(a);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      fallbackData: await getPosts(),
    },
  };
};
