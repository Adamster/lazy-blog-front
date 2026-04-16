import type { NextConfig } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API ?? "https://blog-api-prod.notlazy.org";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mdxeditor/editor"],
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
  async redirects() {
    return [
      {
        source: "/u/:user/:post",
        destination: "/:user/:post",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
