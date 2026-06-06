# 鸣潮抽卡助手

桌面端《鸣潮》抽卡记录分析工具，支持多卡池数据拉取、歪卡统计与保底追踪。

![Platform](https://img.shields.io/badge/platform-Windows-blue) ![Tauri](https://img.shields.io/badge/Tauri-2.0-ffc131) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![License](https://img.shields.io/badge/license-MIT-green)

## 演示

| 概览                                   | 限定卡池                                     | 抽卡记录                                     |
| -------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| ![概览](./images/0.%20演示-概览页.png) | ![限定卡池](./images/1.%20演示-限定卡池.png) | ![抽卡记录](./images/2.%20演示-抽卡记录.png) |

## 使用

> [!NOTE]
> 目前仅支持 Windows 系统，macOS / Linux 暂未适配。

从 [Releases](https://github.com/GitZhiQing/wuwa-gacha-assistant/releases) 页面下载最新的 `wuwa-gacha-assistant.exe`，双击即可运行。

使用前需要通过浏览器开发者工具获取请求参数，详见 [通过云鸣潮获取请求参数](.docs/通过云鸣潮获取请求参数.md)。

## 开发

### 技术栈

| 层         | 技术                       |
| ---------- | -------------------------- |
| 桌面框架   | Tauri 2（Rust）            |
| 前端       | Next.js 15 + React 19      |
| UI         | shadcn/ui + Tailwind CSS   |
| 图表       | Recharts                   |
| 存储       | SQLite（tauri-plugin-sql） |
| 参数持久化 | tauri-plugin-store         |

### 前置条件

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://www.rust-lang.org/) ≥ 1.70

### 启动

```bash
git clone https://github.com/YOUR_USERNAME/wuwa-gacha-assistant.git
cd wuwa-gacha-assistant
npm install
npm run tauri dev
```

### 构建

```bash
npm run tauri build
```

产物位于 `src-tauri/target/release/`。

## 免责声明

- 本项目为开源的个人学习作品，与**库洛游戏**（KURO GAMES）无关。
- 所有抽卡数据著作权归库洛游戏所有，本工具仅作本地展示与分析，不上传任何数据。
- 数据通过《鸣潮》官方公开 API 拉取，不涉及游戏文件修改或注入。
- 请勿将本工具用于商业用途或任何违反游戏服务条款的行为。

## License

MIT
