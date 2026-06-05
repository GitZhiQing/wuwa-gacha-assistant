import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Tauri 生产环境需要静态导出
};

export default nextConfig;
