import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fitmeals/ui", "@fitmeals/api-client", "@fitmeals/types", "@fitmeals/utils"],
  devIndicators: false,
  async redirects() {
    return [{ source: "/ops", destination: "/delivery", permanent: false }];
  },
};

export default nextConfig;
