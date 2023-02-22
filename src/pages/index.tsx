interface Props {
  initialData: Data[];
}

interface Data {
  id: string;
  title: string;
  summary: string;
  body: string;
  createAtUtc: string;
}

// const apiUrl = process.env.API_URL;
const apiUrl = process.env.NEXT_PUBLIC_API;

async function fetchData<Data>(url: string): Promise<Data> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

const fetcher = (url: string): Promise<Data[]> =>
  fetch(url).then((res) => res.json());

export async function getServerSideProps(): Promise<{ props: Props }> {
  const initialData = await fetcher(`${apiUrl}/posts`);
  return { props: { initialData } };
}

export default function Home({ initialData }: Props) {
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
    <div className="">
      {initialData &&
        initialData.map((blog: Data) => (
          <div key={blog.id} className="border p-4 rounded-md bg-white mb-2">
            <h2 className="text-lg font-medium">{blog.title}</h2>
            <p className="text-gray-500">{blog.summary}</p>
          </div>
        ))}
    </div>
  );
}
