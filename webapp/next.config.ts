import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude Prisma client from edge middleware bundle
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
