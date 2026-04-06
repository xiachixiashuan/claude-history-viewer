<div align="center">

# 🖥️ Claude 对话历史浏览器

### ✨ 一个美观的 Claude Code 历史对话记录展示工具 ✨

[![Made with React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Powered by Bun](https://img.shields.io/badge/Bun-runtime-FBF0DF?style=flat-square&logo=bun)](https://bun.sh)
[![Hono](https://img.shields.io/badge/Hono-backend-E36002?style=flat-square&logo=hono)](https://hono.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

**🔍 可视化工具调用 · 📊 按项目浏览 · 🎯 搜索与过滤 · 🌙 终端暗色主题**

[English](README.md) · 中文文档

</div>

---

![截图](docs/images/screenshot.png)

## 🚀 快速开始

> **前置条件：** 安装 [Bun](https://bun.sh/) 运行时，并且有 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的对话历史数据（存放在 `~/.claude/`）

```bash
git clone https://github.com/xiachixiashuan/claude-history-viewer.git
cd claude-history-viewer
bun install
bun run dev
```

🌐 在浏览器中打开 **http://localhost:5173**

## 🎨 功能特性

### 🔧 工具调用可视化

每种工具类型都有独立的**毛玻璃彩色卡片**，详细展示输入参数和输出结果：

| 工具 | 颜色 | 图标 | 展示内容 |
|:-----|:-----|:-----|:---------|
| **Bash** | 🟢 绿色 | ⚡ | 命令 + 输出，错误时红色边框 |
| **Agent** | 🟣 紫色 | ⬡ | 描述 + 模型标签 + 子操作统计 |
| **Read** | 🔵 蓝色 | 📖 | 文件路径 + 行范围 + 内容预览 |
| **Grep** | 🟡 黄色 | 🔍 | 匹配模式 + 匹配数 + 结果 |
| **Edit** | 🩷 粉色 | ✏️ | 文件路径 + diff 视图（🔴 删除 / 🟢 新增） |
| **Write** | 🩵 青色 | 📝 | 文件路径（新文件标识） |
| **Skill** | 🟠 橙色 | ⚙ | 技能名称（可折叠内容） |
| **Task** | ⚪ 灰色 | 📋 | 任务主题 / 状态变更 |

### 📂 按项目分组的侧边栏

- 🗂️ **可折叠分组** — 对话按项目目录分组，点击展开/收起
- 🏷️ **对话卡片** — 标题、时间戳、工具数量、工具类型彩色圆点
- 🔍 **搜索** — 全文搜索对话内容（防抖处理）
- 🏷️ **过滤标签** — 按工具类型快速过滤（Bash、Agent、Skill、Edit...）
- ↔️ **可调宽度** — 拖拽边缘调整侧栏宽度（240px – 600px）

### 💬 消息流

- 🟢 **USER** / 🔵 **ASSISTANT** / 🟡 **SYSTEM** — 彩色角色标识
- 🤖 **模型标签** — 显示 `claude-opus-4-6`、`claude-sonnet-4-5` 等
- 📅 **日期+时间** — 每条消息显示完整的 `MM-DD HH:MM:SS` 时间戳
- 🏷️ **版本标签** — Claude Code 版本号（如 `2.1.92`）

### 🧹 智能内容处理

- 📝 **Markdown 渲染** — 标题、粗体、代码块、列表等格式化展示
- 🔇 **XML 标签清洗** — `<system-reminder>`、`<command-message>` 等系统标签自动移除
- 📦 **技能折叠** — 长篇技能注入内容折叠为一行，带 ⚙ 图标，点击可展开
- 📏 **长文本折叠** — 超长的用户消息和工具输出支持展开/收起
- 🎨 **Diff 高亮** — Edit 工具结果以红色/绿色行着色显示
- 👻 **空消息过滤** — 清洗后为空的消息自动隐藏

### 🧭 导航

- ⬆️⬇️ **快速滚动** — 浮动的顶部/底部跳转按钮
- 🔄 **刷新** — 底部刷新按钮，查看最新消息
- 🎯 **自动选中** — 加载时自动选中最近的对话

## 🛠️ 技术栈

| 层级 | 技术 |
|:-----|:-----|
| ⚛️ 前端 | React 19 + Tailwind CSS v4 + Vite 8 |
| 🔥 后端 | Hono + Bun |
| 🔤 字体 | JetBrains Mono（代码）+ Inter（界面） |
| 🎨 主题 | 终端暗色（`#09090b`）+ 绿色强调（`#22c55e`）+ 毛玻璃效果 |

## 📜 命令

| 命令 | 说明 |
|:-----|:-----|
| `bun run dev` | 🚀 同时启动后端（3456）和前端（5173） |
| `bun run dev:server` | 🔧 仅启动后端 |
| `bun run dev:client` | 🎨 仅启动前端 |
| `bun run build` | 📦 构建生产版本 |

## 📁 数据来源

浏览器读取 Claude Code 的**本地数据文件**（只读，不会修改任何数据）：

```
~/.claude/
├── history.jsonl                    # 📋 对话索引
└── projects/
    └── <编码后的项目路径>/
        ├── <sessionId>.jsonl        # 💬 完整对话记录
        └── <sessionId>/
            └── subagents/           # 🤖 子代理对话记录
```

## 🔌 API 接口

| 接口 | 说明 |
|:-----|:-----|
| `GET /api/projects` | 📂 获取项目列表及对话数量 |
| `GET /api/sessions?project=&tool=&q=` | 🔍 获取对话列表，支持搜索和过滤 |
| `GET /api/sessions/:id` | 💬 获取完整对话消息和摘要 |

## 📄 许可证

MIT

---

<div align="center">

**由 Claude Code 用 💚 构建**

</div>
