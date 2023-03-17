import { AppProps } from "next/app";

import "../assets/styles/styles.scss";

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default App;
