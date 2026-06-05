import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { resolve } from "path";

// 从 package.json 读取版本号注入为环境变量
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf-8")
);

const nextConfig: NextConfig = {
  output: "export",
  // Tauri 生产环境需要静态导出
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default nextConfig;
