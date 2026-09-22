import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home directory otherwise confuses root detection.
  turbopack: { root: import.meta.dirname },
  experimental: {
    // Cover and chapter photos are resized in the browser, then sent as data URLs.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
