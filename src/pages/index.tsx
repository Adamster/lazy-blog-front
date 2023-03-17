import { IPost } from "types";

interface IProps {
  initialData: IPost[];
}

// const apiUrl = process.env.API_URL;
const apiUrl = process.env.NEXT_PUBLIC_API;

// async function fetchData<Data>(url: string): Promise<Data> {
//   const response = await fetch(url);
//   const data = await response.json();
//   return data;
// }

// const fetcher = (url: string): Promise<IPost[]> =>
//   fetch(url).then((res) => res.json());

// export async function getServerSideProps(): Promise<{ props: IProps }> {
//   const initialData = await fetcher(`${apiUrl}/posts`);
//   return { props: { initialData } };
// }

// Component

export default function Home({ initialData }: IProps) {
  // const { data, error } = useSWR<Data>(`${apiUrl}/posts`, fetchData);

  // const { data, error } = useSWR<Data>(`${apiUrl}/posts`, fetcher, {
  //   fallbackData: initialData,
  // });

  // useEffect(() => {
  //   console.log(data);
  // }, []);

  // if (error) return <div>Error</div>;
  // if (!data) return <div>Loading...</div>;

  return (
    <>
      <p>hello</p>
      {/* {initialData &&
        initialData.map((post: IPost) => (
          <PostPreview key={post.id} post={post}></PostPreview>
        ))} */}
    </>
  );
}
