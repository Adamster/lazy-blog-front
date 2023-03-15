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
    <>
      {initialData &&
        initialData.map((blog: Data) => (
          <div key={blog.id} className="rounded-md bg-white mb-4 ">
            <div className="bg-neutral-200 h-64 rounded-md"></div>
            <div className="p-4">
              <h2 className="text-xl font-medium mb-1">{blog.title}</h2>
              <p className="text-gray-800">{blog.summary}</p>
              {/* <p className=" font-normal antialiased  text-justify">
              {blog.body}
            </p> */}
            </div>
          </div>
        ))}

      <div className="flex flex-wrap -mx-2">
        {initialData &&
          initialData.map((blog: Data) => (
            <div key={blog.id} className="w-1/2 px-2 mb-4 ">
              <div className="bg-white rounded-md">
                <div className="bg-neutral-200 h-64 rounded-md"></div>
                <div className="p-4">
                  <h2 className="text-xl font-medium mb-2">{blog.title}</h2>
                  <p className="text-gray-800">{blog.summary}</p>
                  {/* <p className=" font-normal antialiased  text-justify">
              {blog.body}
            </p> */}
                </div>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
