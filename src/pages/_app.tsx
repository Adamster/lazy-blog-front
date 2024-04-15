import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout } from "@/layout/Layout";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import { Montserrat } from "next/font/google";
import { Toaster } from "react-hot-toast";

import "../assets/styles/styles.scss";

const montserrat = Montserrat({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  return (
    <>
      <SessionProvider session={session}>
        <ThemeProvider>
          <Layout className={montserrat.className}>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </SessionProvider>

      <Toaster position="top-center" />
      <Analytics />
    </>
  );
};

export default App;
