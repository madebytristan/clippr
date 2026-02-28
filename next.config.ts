import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["fluent-ffmpeg", "ffmpeg-static"],
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
