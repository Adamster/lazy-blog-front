import Navbar from "./navbar";
// import Footer from './footer'

export default function Layout({ children }: any) {
  return (
    <div className="layout">
      <Navbar />
      <main className="mt-16 py-6 w-full max-w-screen-lg m-auto">
        {children}
      </main>
    </div>
  );
}
