import Header from "./header";
import s from "./layout.module.scss";

export default function Layout({ children }: any) {
  return (
    <>
      <Header />
      <main className={s.main}>{children}</main>
    </>
  );
}
