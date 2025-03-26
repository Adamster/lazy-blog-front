import { AuthProvider } from "@/features/auth/provider/auth-provider";
import { ErrorBoundary } from "@/shared/providers/error-boundary";
import { ReactQueryProvider } from "@/shared/providers/query-provider";
import { ThemeProvider } from "@/shared/providers/theme-providers";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { useRouter } from "next/navigation";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <ErrorBoundary>
      <ReactQueryProvider>
        <AuthProvider>
          <ThemeProvider>
            <HeroUIProvider navigate={router.push}>
              <ToastProvider
                toastOffset={"top-right".includes("top") ? 60 : 0}
                placement="top-right"
                toastProps={{
                  shouldShowTimeoutProgress: true,
                }}
              />

              {children}
            </HeroUIProvider>
          </ThemeProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  );
};
