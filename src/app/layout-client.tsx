"use client";

import { Header } from "@/components/layout/header";
import { ErrorBoundary } from "@/providers/error-boundary";
import { ReactQueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-providers";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "../features/auth/provider/auth-provider";

export const LayoutClient = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <ErrorBoundary>
        <ReactQueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <Header />
              <main className="max-w-4xl mx-auto">{children}</main>
            </ThemeProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </ErrorBoundary>
      <Analytics />
    </>
  );
};
