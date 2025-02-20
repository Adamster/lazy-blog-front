"use client";

import "@/assets/styles/styles.scss";
import { Header } from "@/components/header/header";
import { AuthProvider } from "@/providers/auth-provider";
import { ErrorBoundary } from "@/providers/error-boundary";
import { ReactQueryProvider } from "@/providers/query-provider";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <ErrorBoundary>
        <ReactQueryProvider>
          <AuthProvider>
            <Header />
            <main className="layout-main">{children}</main>
          </AuthProvider>
        </ReactQueryProvider>
      </ErrorBoundary>

      <Toaster position="top-right" />

      <Analytics />
    </>
  );
};
