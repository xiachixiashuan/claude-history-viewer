# Claude Code 对话历史浏览器 - 设计文档

## 概述

一个美观的 Claude Code 历史对话展示界面，专注于工具调用和操作过程的可视化。用于个人回顾查找，兼顾对外展示。

## 数据源

### history.jsonl

路径：`~/.claude/history.jsonl`

每行一个 JSON 对象，字段：
- `display`: 用户输入文本或命令
- `timestamp`: Unix 毫秒时间戳
- `project`: 项目绝对路径（如 `/Users/wendale/learn/claude-toolbox-v3`）
- `sessionId`: UUID 格式 session ID
- `pastedContents`: 粘贴内容（通常为空对象）

用途：构建左栏对话列表（按项目分组、时间排序）。

### 对话 transcript JSONL

路径：`~/.claude/projects/<encoded-project-path>/<sessionId>.jsonl`

项目路径编码规则：绝对路径中 `/` 替换为 `-`，如 `/Users/wendale/learn` → `-Users-wendale-learn`。

每行一个 JSON 对象，消息类型通过 `type` 字段区分：

| type | 说明 |
|------|------|
| `user` | 用户消息或工具结果 |
| `assistant` | 助手回复（含文本和工具调用） |
| `system` | 系统消息（命令、状态等） |
| `file-history-snapshot` | 文件快照（忽略） |
| `permission-mode` | 权限模式变更（忽略） |
| `queue-operation` | 队列操作（忽略） |
| `attachment` | 附件（图片等） |
| `last-prompt` | 最后一次提示（忽略） |

#### assistant 消息结构

```json
{
  "type": "assistant",
  "timestamp": "2026-04-04T17:50:30.217Z",
  "uuid": "...",
  "message": {
    "content": [
      { "type": "text", "text": "..." },
      { "type": "tool_use", "id": "toolu_xxx", "name": "Bash", "input": { "command": "..." } }
    ],
    "model": "claude-sonnet-4-5-20250514"
  },
  "version": "2.1.89",
  "cwd": "/Users/wendale/learn/claude-toolbox-v3",
  "sessionId": "...",
  "gitBranch": "main"
}
```

#### user 消息结构

用户输入：
```json
{
  "type": "user",
  "message": {
    "content": [
      { "type": "text", "text": "用户输入内容" }
    ]
  }
}
```

工具结果（跟在 assistant 的 tool_use 后面）：
```json
{
  "type": "user",
  "message": {
    "content": [
      { "type": "tool_result", "tool_use_id": "toolu_xxx", "content": [{ "type": "text", "text": "..." }] }
    ]
  }
}
```

### 子代理 transcript

路径：`~/.claude/projects/<encoded-project-path>/<sessionId>/subagents/<agent-id>.jsonl`

格式与主对话 JSONL 相同。Agent 工具调用的结果中包含子代理的输出摘要。

## 技术栈

- **前端**：Vite + React + Tailwind CSS v4
- **后端**：Hono（Bun runtime）
- **字体**：JetBrains Mono（代码/终端）+ Inter（UI 文本）
- **图标**：Lucide React

## 架构

### 后端 API（Hono）

```
GET /api/projects
  → 返回项目列表（从 history.jsonl 聚合）
  → [{ path, name, sessionCount, lastActive }]

GET /api/sessions?project=<path>&q=<keyword>&tool=<toolType>
  → 返回指定项目（或全部）的 session 列表，支持搜索和工具类型过滤
  → [{ id, project, firstMessage, timestamp, toolCount, toolTypes }]
  → firstMessage: 取该 session JSONL 中第一条 type=user 且 content 包含 text 的消息，截取前 80 字符
  → q 参数：在 session 所有消息文本和工具参数中做子串匹配（后端逐文件扫描，无索引）
  → tool 参数：筛选包含指定工具类型的 session

GET /api/sessions/:id
  → 返回 session 详情（解析 JSONL）
  → { meta, messages: [{ type, timestamp, role, model, version, content }] }

GET /api/sessions/:id/subagents
  → 返回 session 的子代理列表
  → [{ id, parentToolId }]

GET /api/sessions/:id/subagents/:agentId
  → 返回子代理的消息流
```

### 前端路由

```
/                     → 默认展示最近一个 session
/:sessionId           → 展示指定 session
```

单页应用，左右分栏布局，无需多页路由。

### 前端组件结构

```
App
├── Sidebar
│   ├── Logo + SearchBox
│   ├── FilterChips (按工具类型过滤)
│   └── SessionList
│       └── ProjectGroup
│           ├── ProjectLabel
│           └── SessionItem (标题、时间、工具统计、工具类型圆点)
└── MainPanel
    ├── SessionHeader (标题、项目标签、统计信息)
    └── MessageFlow
        └── MessageBlock (per assistant/user turn)
            ├── RoleBar (角色标识、模型、版本、时间戳)
            └── MessageContent
                ├── TextContent (markdown 渲染)
                └── ToolCallCard (per tool_use)
                    ├── ToolHeader (图标、名称、状态、耗时)
                    ├── ToolDetail (参数摘要)
                    └── ToolResult (输出内容)
```

## 视觉设计

### 风格：绿色终端 + 毛玻璃

- **背景**：近乎纯黑 `#09090b`
- **字体**：JetBrains Mono 等宽字体为主
- **主色调**：终端绿 `#22c55e`，辅以 glow 效果
- **卡片**：半透明背景 + 微妙边框 + backdrop-filter blur

### 工具调用颜色系统

| 工具 | 颜色 | 图标 |
|------|------|------|
| Bash | `#22c55e` 绿 | ⚡ |
| Agent | `#a78bfa` 紫 | ⬡ |
| Read | `#60a5fa` 蓝 | 📖 |
| Grep | `#fbbf24` 黄 | 🔍 |
| Edit | `#f472b6` 粉 | ✏️ |
| Write | `#38bdf8` 天蓝 | 📝 |
| Skill | `#fb923c` 橙 | ⚙ |
| TaskUpdate/Create | `#94a3b8` 灰 | 📋 |

每种工具的卡片使用对应颜色的低透明度背景 + 边框。

### 消息块结构

每个 assistant/user turn 是一个 **MessageBlock**：
- **RoleBar**：角色圆点 + 名称 + 模型 badge + 版本 badge + 时间戳右对齐
  - USER: 绿色圆点
  - ASSISTANT: 蓝色圆点
  - SYSTEM: 黄色圆点
- **MessageContent**：左侧有细竖线连接，内含文本和工具调用卡片
- 块之间用细分隔线分开

### 工具调用卡片

- 默认全部展开，显示输入参数和输出结果
- Edit 工具展示 diff（红色删除、绿色新增）
- Bash 失败时卡片边框变红
- Agent 卡片内嵌套显示子操作统计（虚线左边框）
- 结果区域超过 120px 高度时可滚动

### 左栏对话列表

- 平铺时间线，按项目名分组（sticky 标签）
- 每条 session 显示：标题（首条用户消息摘要）、时间、工具总数、使用的工具类型彩色圆点
- 搜索框：全文搜索对话内容和工具参数
- 过滤 chips：按工具类型筛选含有该工具的 session

## 搜索与过滤

- **搜索**：在 session 的消息文本和工具参数中匹配关键词
- **工具类型过滤**：点击 filter chip 筛选包含该工具类型的 session
- 搜索和过滤可组合使用

## 不包含的功能

- 对话编辑或重放
- 导出功能
- 多用户支持
- 实时监听新对话（仅展示已有历史）
