import type { NextConfig } from "next";
import removeImports from "next-remove-imports";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/u/:user/:post",
        destination: "/:user/:post",
        permanent: true,
      },
    ];
  },
  experimental: {
    scrollRestoration: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lazyappstorage.blob.core.windows.net",
        port: "",
        pathname: "/images/**",
      },
    ],
  },
  ...removeImports(),
};

export default nextConfig;
