import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fitmeals/ui", "@fitmeals/api-client", "@fitmeals/types", "@fitmeals/utils"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.tile.openstreetmap.org", pathname: "/**" },
    ],
  },
};

export default nextConfig;
