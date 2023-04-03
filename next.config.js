/** @type {import('next').NextConfig} */

// const nextConfig = {
//   experimental: {
//     appDir: false,
//   },
// };

// module.exports = nextConfig;

const removeImports = require("next-remove-imports")();
module.exports = removeImports({});
