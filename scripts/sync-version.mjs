#!/usr/bin/env node

/**
 * 从 package.json 同步版本号到其他配置文件。
 *
 * 用法:
 *   node scripts/sync-version.mjs          # 同步到所有文件
 *   node scripts/sync-version.mjs --check  # 仅检查一致性（CI 用）
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// 1. 读取 package.json 版本（唯一来源）
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
const version = pkg.version;

// 2. 同步目标
const targets = [
  {
    path: resolve(root, "src-tauri", "Cargo.toml"),
    pattern: /^version\s*=\s*"[^"]*"$/m,
    replacement: `version = "${version}"`,
    label: "Cargo.toml",
  },
  {
    path: resolve(root, "src-tauri", "tauri.conf.json"),
    update: (content) => {
      const json = JSON.parse(content);
      json.version = version;
      return JSON.stringify(json, null, 2) + "\n";
    },
    label: "tauri.conf.json",
  },
];

// 3. Next.js 环境变量写入 .env.local（可选，build 时自动注入）
const envPath = resolve(root, ".env.local");
const envLine = `NEXT_PUBLIC_APP_VERSION=${version}`;
let envContent = "";
try {
  envContent = readFileSync(envPath, "utf-8");
} catch {
  // .env.local 不存在，将创建
}

const envLines = envContent
  .split("\n")
  .filter((l) => !l.startsWith("NEXT_PUBLIC_APP_VERSION="));
envLines.push(envLine);
writeFileSync(envPath, envLines.filter(Boolean).join("\n") + "\n", "utf-8");
console.log(`  ✓ .env.local (NEXT_PUBLIC_APP_VERSION=${version})`);

// 4. 执行同步
const checkOnly = process.argv.includes("--check");
let allMatch = true;

for (const target of targets) {
  let content = readFileSync(target.path, "utf-8");

  if (target.update) {
    const updated = target.update(content);
    if (content === updated) {
      console.log(`  ✓ ${target.label} (already ${version})`);
    } else if (checkOnly) {
      console.error(`  ✗ ${target.label} version mismatch`);
      allMatch = false;
    } else {
      writeFileSync(target.path, updated, "utf-8");
      console.log(`  ✓ ${target.label} → ${version}`);
    }
  } else {
    if (target.pattern.test(content)) {
      if (checkOnly) {
        // Check if version matches
        const match = content.match(target.pattern);
        if (match && !match[0].includes(version)) {
          console.error(`  ✗ ${target.label} version mismatch`);
          allMatch = false;
        } else {
          console.log(`  ✓ ${target.label} (${version})`);
        }
      } else {
        const updated = content.replace(target.pattern, target.replacement);
        writeFileSync(target.path, updated, "utf-8");
        console.log(`  ✓ ${target.label} → ${version}`);
      }
    }
  }
}

if (checkOnly && !allMatch) {
  console.error("\n❌ Version mismatch detected. Run `npm run version:sync` to fix.");
  process.exit(1);
}

console.log(`\n🎯 All synced to v${version}`);
