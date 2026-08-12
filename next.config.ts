import type { NextConfig } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API || "https://blog-api-prod.notlazy.org";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
        source: "/",
        destination: "/blog",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/books",
        destination: "/books/index.html",
      },
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
      // Google OAuth callback. ASP.NET's Google middleware uses the default
      // CallbackPath `/signin-google` and the provider redirects the BROWSER to
      // this same-origin path — so it must reach the backend instead of
      // rendering as a Next.js page. Query string (?code&state) passes through.
      {
        source: "/signin-google",
        destination: `${API_URL}/signin-google`,
      },
    ];
  },
};

export default nextConfig;
