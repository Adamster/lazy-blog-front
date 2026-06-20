"use client";

import { AuthProvider } from "@/entities/session";
import { ErrorBoundary } from "@/shared/providers/error-boundary";
import { ReactQueryProvider } from "@/shared/providers/query-provider";
import { ThemeProvider } from "@/shared/providers/theme-providers";
import { Toaster } from "@/shared/ui/toaster";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary>
      <ReactQueryProvider>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  );
};
