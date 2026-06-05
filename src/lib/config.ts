/**
 * 应用版本号。
 *
 * 版本唯一来源为 package.json，通过 next.config.ts 注入为环境变量。
 * 使用 `npm run version:sync` 同步到 Cargo.toml / tauri.conf.json。
 * 使用 `npm version <patch|minor|major>` 自动同步所有文件。
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0-dev";
