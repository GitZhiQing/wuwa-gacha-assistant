# Python 开发工作流规范：使用 uv

本项目使用 uv 作为唯一的 Python 包管理与项目管理工具。请严格遵循以下规范，不要使用 pip、venv、virtualenv、pipx 等传统工具。

## Python 版本管理

- 安装 Python：`uv python install <version>`
- 固定项目 Python 版本：`uv python pin <version>`（写入 .python-version）

## 项目初始化

- 新建项目：`uv init [项目名]`
- 项目配置文件：`pyproject.toml`（由 uv 自动管理依赖声明）
- 锁文件：`uv.lock`（由 uv 自动生成，必须提交到版本控制）

## 依赖管理

- 添加依赖：`uv add <package>`（自动写入 pyproject.toml 并更新 uv.lock）
- 添加开发依赖：`uv add --dev <package>`
- 移除依赖：`uv remove <package>`
- 同步环境：`uv sync`（根据 uv.lock 安装精确依赖）
- 查看依赖树：`uv tree`
- ⚠️ 禁止使用 `uv pip install`，始终使用 `uv add`

## 运行命令

- 运行脚本/命令：`uv run <command>`（自动在项目虚拟环境中执行）
- 运行 Python 文件：`uv run python main.py`
- 运行模块：`uv run python -m <module>`
- 运行 pyproject.toml 中定义的脚本：`uv run <script-name>`
- 一次性运行工具：`uv tool run <tool>`（替代 pipx）

## 虚拟环境

- uv 自动创建并管理 `.venv`，无需手动 `python -m venv` 或 `source activate`
- 如确需手动激活：`source .venv/bin/activate`

## 对照速查（禁止 → 正确）

| 禁止                                      | 正确                                                  |
| ----------------------------------------- | ----------------------------------------------------- |
| `pip install xxx`                         | `uv add xxx`                                          |
| `pip install -r requirements.txt`         | `uv add --requirements requirements.txt` 或 `uv sync` |
| `python -m venv .venv`                    | 无需操作，uv 自动管理                                 |
| `source .venv/bin/activate && python xxx` | `uv run python xxx`                                   |
| `pip freeze > requirements.txt`           | 依赖已在 pyproject.toml + uv.lock 中                  |
| `pipx run xxx`                            | `uv tool run xxx`                                     |
| `pip install -e .`                        | `uv sync`（开发模式是默认行为）                       |
