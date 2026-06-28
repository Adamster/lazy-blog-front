"use client";

import { AuthProvider } from "@/entities/session";
import { ErrorBoundary } from "@/shared/providers/error-boundary";
import { ReactQueryProvider } from "@/shared/providers/query-provider";
import { ThemeProvider } from "@/shared/ui/theme";
import { Toaster } from "@/shared/ui/overlays/toaster";
import { Header } from "@/widgets/header";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary>
      <ReactQueryProvider>
        <AuthProvider>
          <ThemeProvider>
            {/* Global header (fixed burger + logo) — rendered once for every
                page, so error / 404 / loading states keep navigation too. The
                `.mono-scope` wrapper gives the fixed chrome the `--m-*` tokens. */}
            <div className="mono-scope">
              <Header />
            </div>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  );
};
