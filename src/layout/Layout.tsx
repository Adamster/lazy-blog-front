import Head from "next/head";
import Header from "./header";
import s from "./layout.module.scss";

export default function Layout({ children }: any) {
  return (
    <>
      <Head>
        <meta
          key="description"
          name="description"
          content="Вы искали лучший в мире Блог? Срочно прекратите поиски, он перед вами!"
        />
        <meta
          key="og:description"
          property="og:description"
          content="Вы искали лучший в мире Блог? Срочно прекратите поиски, он перед вами!"
        />
      </Head>
      <Header />
      <main className={s.main}>{children}</main>
    </>
  );
}
