import Link from "next/link";

export default function Navbar() {
  return (
    <header className="header">
      <div className="header-inside">
        <nav className="header-nav">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
