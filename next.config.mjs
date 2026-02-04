/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static-ca-cdn.eporner.com",
      },
      {
        protocol: "https",
        hostname: "www.eporner.com",
      },
      {
        protocol: "https",
        hostname: "img.pornhub.com",
      },
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
