import Navbar from "./navbar";
// import Footer from './footer'

export default function Layout({ children }: any) {
  return (
    <div className="min-h-full">
      <Navbar />
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
