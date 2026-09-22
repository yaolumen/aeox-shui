import type { NextConfig } from "next";
import path from "node:path";

const ADMIN_SLUG = process.env.ADMIN_SLUG || "admingl";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["better-sqlite3"],
  async rewrites() {
    return [
      {
        source: `/${ADMIN_SLUG}`,
        destination: "/admin",
      },
      {
        source: `/${ADMIN_SLUG}/:path*`,
        destination: "/admin/:path*",
      },
    ];
  },
  async redirects() {
    if (ADMIN_SLUG !== "admin") {
      return [
        {
          source: "/admin",
          destination: "/404",
          permanent: false,
        },
        {
          source: "/admin/:path*",
          destination: "/404",
          permanent: false,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
