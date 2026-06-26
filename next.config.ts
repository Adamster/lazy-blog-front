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
      // Google OAuth callback. ASP.NET's Google middleware uses the default
      // CallbackPath `/signin-google` and the provider redirects the BROWSER to
      // this same-origin path — so it must reach the backend. Without this
      // rewrite the `[user]` dynamic route swallows "signin-google" as a username
      // (→ /api/posts/signin-google/posts → 404 "User.NotFound"), breaking the
      // whole Google sign-in round-trip. Query string (?code&state) passes through.
      {
        source: "/signin-google",
        destination: `${API_URL}/signin-google`,
      },
    ];
  },
};

export default nextConfig;
