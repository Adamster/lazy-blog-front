import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout } from "@/layout/Layout";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import { Montserrat } from "next/font/google";
import "../assets/styles/styles.scss";

const montserrat = Montserrat({
  weight: ["300", "400", "600", "700"],
  preload: false,
});

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <Layout className={montserrat.className}>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default App;
