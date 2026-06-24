"use client";

import { AuthProvider } from "@/entities/session";
import { ErrorBoundary } from "@/shared/providers/error-boundary";
import { ReactQueryProvider } from "@/shared/providers/query-provider";
import { ThemeProvider } from "@/shared/providers/theme-providers";
import { Toaster } from "@/shared/ui/toaster";
import { MatrixRain } from "@/shared/ui";
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
              {/* Ambient Matrix-rain backdrop behind every page — fixed, low
                  opacity, click-through, NEO-MODE ONLY (`mono-rain-bg` is hidden
                  outside `html.neo` via CSS). In neo the page roots go
                  transparent (and the card/panel tokens go faintly translucent)
                  so this drape bleeds through. Reduced-motion safe. */}
              <MatrixRain className="mono-rain-bg pointer-events-none fixed inset-0 -z-10 opacity-20" />
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
