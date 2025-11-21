# LLM Kanban

A file-based Kanban board for managing LLM-assisted development workflows in VSCode.

## Features

- **📋 Visual Kanban Board**: Drag-and-drop interface with glassmorphism design
- **🤖 Agent Integration**: Assign AI agents to tasks with custom instructions
- **📚 Context Management**: Attach stage, phase, and custom contexts to items
- **✏️ Monaco Editor**: Edit contexts and agents directly in the UI
- **📝 Markdown-Based**: All data stored as readable `.md` files
- **🔄 Stage Workflow**: Chat → Queue → Plan → Code → Audit → Completed

## Installation

1. Open VSCode
2. Press `Ctrl+P` / `Cmd+P`
3. Run `ext install llm-kanban`

## Getting Started

### Initialize Workspace

1. Open a folder in VSCode
2. Run command: `LLM Kanban: Initialize Workspace`
3. This creates `.llmkanban/` directory with stage folders

### Create Tasks

- **From Sidebar**: Click `+` button next to stage
- **From Board**: Use the Kanban board view
- **From Command**: `LLM Kanban: Create Task`

### Assign Agents & Contexts

1. Click on a card in the board
2. Click agent tag (🤖) or context tag (📚) to edit
3. Monaco editor opens for editing

### Copy with Context

Click the copy button (📋) on any card to copy:
- **Full mode**: Complete markdown file
- **Context mode**: Managed section + user content
- **User mode**: User content only

## Keyboard Shortcuts

- `Escape`: Close modal/editor
- `Double-click` card title: Edit inline
- `Drag & drop`: Move between stages

## File Structure

```
.llmkanban/
├── chat/           # Initial conversations
├── queue/          # Backlog items
├── plan/           # Planning stage
├── code/           # Implementation
├── audit/          # Review/testing
├── completed/      # Done items
└── _context/
    ├── stages/     # Stage-specific contexts
    ├── phases/     # Phase contexts
    └── agents/     # Agent definitions
```

## Item Format

Each item is a markdown file with frontmatter:

```markdown
---
id: task-123
title: Implement feature
stage: code
type: task
agent: coder
contexts: [api-spec, database-schema]
tags: [backend, api]
created: 2025-01-01T00:00:00Z
updated: 2025-01-02T00:00:00Z
---

<!-- LLMKANBAN:MANAGED - Do not edit above this line -->
## 🎯 Stage: Code
[Stage context...]

<!-- LLMKANBAN:USER-CONTENT - Edit below this line -->
# Your notes here
```

## Commands

- `LLM Kanban: Open Board` - Open Kanban board view
- `LLM Kanban: Initialize Workspace` - Set up workspace structure
- `LLM Kanban: Create Task` - Create new task
- `LLM Kanban: Create Phase` - Create new phase
- `LLM Kanban: Migrate Workspace` - Migrate to canonical filenames

## Contributing

Issues and PRs welcome at [repository URL]

## License

MIT
