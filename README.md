# Claude History Viewer

A beautiful dark-themed conversation history viewer for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), focused on tool call visualization.

![Screenshot](docs/images/screenshot.png)

## Features

### Tool Call Visualization

Each tool type has its own color-coded glassmorphic card with detailed input/output display:

| Tool | Color | Display |
|------|-------|---------|
| Bash | Green | Command + output, error state with red border |
| Agent | Purple | Description + model badge + sub-operation stats |
| Read | Blue | File path + line range + content preview |
| Grep | Yellow | Pattern + match count + results |
| Edit | Pink | File path + diff view (red/green) |
| Write | Cyan | File path |
| Skill | Orange | Skill name |
| TaskCreate/Update | Gray | Task subject / status change |

### Conversation Browser

- **Project-grouped sidebar** - Sessions organized by project directory, click to expand/collapse
- **Session metadata** - Tool count, tool type dots, timestamp for each session
- **Message flow** - Full conversation with role bars showing model name, version, and date/time
- **Search & filter** - Search by keyword, filter by tool type
- **Resizable sidebar** - Drag to adjust sidebar width (240px - 600px)

### Smart Content Handling

- **Markdown rendering** - Headings, bold, code blocks, lists rendered in assistant messages
- **XML tag cleaning** - System-injected tags (`<system-reminder>`, `<command-message>`, etc.) automatically stripped
- **Skill injection collapse** - Long skill content collapsed to single line, expandable on click
- **Long text collapse** - User messages and tool results with expand/collapse for long content
- **Diff highlighting** - Edit tool results show red (deleted) / green (added) lines
- **Empty message filtering** - Messages that become empty after tag cleaning are hidden

### Navigation

- **Scroll to top/bottom** - Floating buttons for quick navigation
- **Refresh** - Button at bottom to reload current session for new messages
- **Auto-select** - First session auto-selected on load, group auto-expands when selecting a session

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS v4 + Vite 8
- **Backend**: Hono + Bun
- **Fonts**: JetBrains Mono (code) + Inter (UI)
- **Style**: Dark terminal theme with green accent + glassmorphic tool cards

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime installed
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with existing conversation history in `~/.claude/`

### Install & Run

```bash
git clone https://github.com/xiachixiashuan/claude-history-viewer.git
cd claude-history-viewer
bun install
bun run dev
```

Open http://localhost:5173 in your browser.

### Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start both backend (port 3456) and frontend (port 5173) |
| `bun run dev:server` | Start backend only |
| `bun run dev:client` | Start frontend only |
| `bun run build` | Build frontend for production |

## Data Source

The viewer reads Claude Code's local data files:

```
~/.claude/
  history.jsonl              # Session index (project, sessionId, timestamp)
  projects/
    <encoded-project-path>/
      <sessionId>.jsonl      # Full conversation transcript
      <sessionId>/
        subagents/           # Sub-agent transcripts
```

All data is read-only. The viewer never modifies your Claude Code data.

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/projects` | List all projects with session counts |
| `GET /api/sessions?project=&tool=&q=` | List sessions, with optional filters |
| `GET /api/sessions/:id` | Get full session messages and summary |

## License

MIT
