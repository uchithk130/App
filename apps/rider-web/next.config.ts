import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fitmeals/ui", "@fitmeals/api-client", "@fitmeals/types", "@fitmeals/utils"],
};

export default nextConfig;
