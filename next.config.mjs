/** @type {import('next').NextConfig} */
const nextConfig = {
  // Slim production image: Dockerfile copies .next/standalone + .next/static
  output: "standalone",
};

export default nextConfig;
