import Layout from "@/layout/layout";
import { AppProps } from "next/app";

import "../assets/styles/globals.scss";

function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default App;
