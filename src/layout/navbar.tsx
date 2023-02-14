import Link from "next/link";
import { useRouter } from "next/router";

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
  const router = useRouter();

  return (
    <header className="fixed top-0 flex justify-center items-center w-full h-16 bg-white">
      <div className="flex flex-row justify-between items-center w-full max-w-screen-lg">
        <nav className="flex">
          <div className="mr-8 flex items-center">
            <Link href="/">
              <img className="h-5" src="/images/logo.svg" alt="" />
            </Link>
          </div>
          <ul className="flex">
            {navigation.map((item) => (
              <li key={item.name} className="mr-4">
                <Link
                  className={
                    router.pathname === item.href ? "font-semibold" : ""
                  }
                  href={item.href}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <input
            type="text"
            className="bg-neutral-100 rounded-md border-neutral-100 shadow-sm py-1 px-2"
            placeholder="Search"
          />
        </div>
      </div>
    </header>
  );
}
