/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a minimal standalone server bundle for slim Docker images.
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
