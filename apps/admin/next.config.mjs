/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@kekego/shared", "@kekego/validation"],
};

export default nextConfig;
