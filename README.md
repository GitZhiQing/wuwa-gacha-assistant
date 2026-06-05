# 鸣潮抽卡助手

> 桌面端鸣潮抽卡记录分析工具，支持多卡池数据拉取、歪卡统计、保底追踪。

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.0-ffc131)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

## 功能

- **一键同步** — 通过官方 API 拉取 10 种卡池的抽卡记录，增量写入本地数据库
- **概览面板** — 总抽数、五星平均、歪卡率、拥有的限定/常驻角色与武器一览
- **卡池分析** — 6 个分析 Tab：限定角色、限定武器、联动角色、联动武器、常驻角色、常驻武器
- **保底追踪** — 五星抽取记录表 + 保底分布柱状图，实时显示当前垫抽数与大/小保底状态
- **歪卡分析** — 限定角色池专属 50/50 机制分析，歪卡标记与歪卡率统计
- **数据持久化** — 本地 SQLite 存储，参数一次填写后续自动记住
- **亮暗切换** — shadcn/ui 极简黑白主题，一键切换

## 技术栈

| 层         | 技术                       |
| ---------- | -------------------------- |
| 桌面框架   | Tauri 2（Rust）            |
| 前端       | Next.js 15 + React 19      |
| UI         | shadcn/ui + Tailwind CSS   |
| 图表       | Recharts                   |
| 存储       | SQLite（tauri-plugin-sql） |
| 参数持久化 | tauri-plugin-store         |

## 普通玩家

前往 [Releases](https://github.com/YOUR_USERNAME/wuwa-gacha-assistant/releases) 页面下载最新 `wuwa-gacha-assistant.exe`，双击运行即可，无需安装任何额外环境。

## 开发者

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

产物在 `src-tauri/target/release/` 目录下。

## 使用说明

1. 首次启动会自动跳转到**数据导入**页面，填写 API 参数
2. 勾选要拉取的卡池（默认推荐角色 + 武器活动池），点击 **一键同步数据**
3. 同步完成后进入**概览**查看全局统计
4. 切换到**卡池分析**查看各卡池详细数据

> 参数获取方式：TODO

## 卡池类型

| 卡池         | 歪卡 | 保底                    |
| ------------ | :--: | ----------------------- |
| 角色活动唤取 |  ✓   | 80 抽硬保底，50/50 机制 |
| 武器活动唤取 |  ✗   | 80 抽硬保底，必出 UP    |
| 角色联动唤取 |  ✓   | 独立保底，同 50/50 机制 |
| 武器联动唤取 |  ✗   | 独立保底，必出 UP       |
| 角色常驻唤取 |  ✗   | 无 UP，随机常驻五星     |
| 武器常驻唤取 |  ✗   | 可自选目标              |

## 项目结构

```
src-tauri/      Rust 后端 / API 请求
src/
  app/          Next.js 路由页面
  components/   React 组件
  lib/          核心逻辑（分析引擎 / 数据库 / 常量）
  store/        Zustand 状态管理
data/           本地抽卡数据（已 gitignore）
```

## 免责声明

- 本工具为开源的个人学习项目，与**库洛游戏**（KURO GAMES）无关
- 所有抽卡数据的著作权及相关权益归属库洛游戏，本工具仅作本地分析与展示
- 数据通过《鸣潮》官方公开 API 拉取，不涉及任何游戏文件修改或注入
- 请勿将本工具用于任何商业用途或违反游戏服务条款的行为

## License

MIT
