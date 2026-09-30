// Side-effect imports of stylesheets. TypeScript 6 (TS2882) requires explicit
// module declarations for non-code side-effect imports.
declare module "*.css";
declare module "*.scss";
declare module "*.sass";

// SVG imports (resolved by the bundler's asset loader to a URL string).
declare module "*.svg" {
  const src: string;
  export default src;
}

// Next.js static image imports used by next/image.
declare module "*.jpg" {
  const image: import("next/image").StaticImageData;
  export default image;
}
