import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "::1", "192.168.56.1"],
  devIndicators: false,
};

export default nextConfig;