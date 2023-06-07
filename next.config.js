/** @type {import('next').NextConfig} */

const removeImports = require("next-remove-imports")();

module.exports = removeImports({
  experimental: {
    scrollRestoration: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lazyappstorage.blob.core.windows.net',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
});
