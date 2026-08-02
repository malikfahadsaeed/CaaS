/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a fully static site to `out/` for hosting on S3 + CloudFront.
  // The app is a pure client SPA (no SSR/route handlers), so export is safe.
  output: "export",
  reactStrictMode: true,
};

export default nextConfig;
