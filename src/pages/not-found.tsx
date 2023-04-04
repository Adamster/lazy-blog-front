import Head from "next/head";



export default function NotFound() {


  return (
    <>
      <Head>
        <title>Не найдено | Not Lazy Blog</title>
      </Head>

      <div className="bg-white rounded-md p-8">
        <h2 className="text-2xl font-bold mb-4">Ошибкен</h2>
        <p>Увы, по вашему запросу ничего не найдено.</p>
      </div>
 
    </>
  );
}

