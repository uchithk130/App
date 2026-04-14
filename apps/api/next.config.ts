import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fitmeals/types", "@fitmeals/utils"],
};

export default nextConfig;
