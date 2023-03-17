import Layout from "@/layout";
import { AppProps } from "next/app";

import "../assets/styles/styles.scss";

function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default App;
