import type { AppProps } from "next/app";
import Link from "next/link";
import "../app/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div>
      <nav className="navbar">
        <Link href="/">Home</Link>
        <Link href="/standings">Standings</Link>
        <Link href="/owners">Owners</Link>
        <Link href="/countries">Countries</Link>
        <Link href="/draft">Draft</Link>
        <Link href="/settings">Settings</Link>
      </nav>

      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
