# LLM Kanban - VSCode Extension

A file-based Kanban board extension for managing LLM-assisted development tasks. Perfect for developers working with AI coding assistants like Claude Code, GitHub Copilot, and other LLMs.

## Features

### 🗂️ File-Based Task Management
- All tasks stored as markdown files in `.llmkanban/` folder
- Git-friendly with clean diffs
- No external database or server required
- Full version control for your task history

### 📋 5-Stage Kanban Workflow
- **Backlog**: Planned tasks and ideas
- **In Progress**: Active development work
- **Review**: Code review and feedback
- **Audit**: Security, performance, and compliance checks
- **Completed**: Finished work for reference

### 🎯 Context Injection
- Automatic stage context injection when tasks move between stages
- Phase context for grouping related tasks
- Preserves user content while updating metadata
- Perfect for providing context to LLM assistants

### 📝 Copy with Context
Copy tasks to clipboard with different levels of context:
- **Full Document**: Frontmatter + Managed Section + User Content
- **Context + Content**: Managed Section + User Content (no frontmatter)
- **User Content Only**: Just your notes

### 🌳 Tree View Sidebar
- Visual organization by stage
- Click to open task files
- Context menu for quick actions
- Auto-refresh on file changes

### ⚡ Quick Commands
- Create tasks and phases
- Move tasks between stages
- Copy with context for LLM prompts
- Refresh board view

## Installation

### From Source
1. Clone this repository
2. Run `npm install` in the `vscode-llm-kanban` directory
3. Run `npm run compile` to build
4. Press F5 to open a new VSCode window with the extension loaded

### From VSIX (Future)
- Download the `.vsix` file from releases
- Install via `Extensions: Install from VSIX` command

## Getting Started

### 1. Initialize Workspace
Open the command palette (`Cmd+Shift+P` or `Ctrl+Shift+P`) and run:
```
LLM Kanban: Initialize Workspace
```

This creates the `.llmkanban/` folder structure:
```
.llmkanban/
├── _context/
│   ├── architecture.md
│   ├── design.md
│   ├── stages/
│   │   ├── backlog.md
│   │   ├── in-progress.md
│   │   ├── review.md
│   │   ├── audit.md
│   │   └── completed.md
│   └── phases/
├── backlog/
├── in-progress/
├── review/
├── audit/
└── completed/
```

### 2. Customize Context Files
Edit the context files in `.llmkanban/_context/` to match your project:
- **architecture.md**: System design and architecture decisions
- **design.md**: UI/UX guidelines and design system
- **stages/*.md**: Stage-specific guidelines

### 3. Create a Phase
Phases group related tasks (like sprints or features):
```
LLM Kanban: Create Phase
```

Example: "Core MVP", "UI Redesign", "Performance Optimization"

### 4. Create Tasks
Create tasks within phases:
```
LLM Kanban: Create Task
```

Tasks automatically start in the Backlog stage.

### 5. Move Tasks
Drag tasks between stages using the tree view, or use:
```
LLM Kanban: Move Task
```

Context is automatically re-injected when moving stages!

### 6. Copy with Context
Right-click a task and select "Copy with Context" to copy task details optimized for LLM prompts.

## Usage with LLMs

### Example Workflow

1. **Create a task** for a feature you want to build
2. **Add notes** in the user content section about requirements
3. **Copy with context** (Context + Content mode)
4. **Paste into Claude Code** or your LLM assistant
5. The LLM receives:
   - Current stage context (e.g., "In Progress")
   - Phase context (e.g., "Core MVP goals and timeline")
   - Your specific notes and requirements

The LLM now has full context about:
- What stage the work is in
- The broader phase goals
- Your specific requirements
- Project architecture and design patterns

### Example Copied Context

```markdown
## ⚡ In Progress

This stage represents active work that is currently being implemented.

**Guidelines:**
- Focus on one task at a time
- Update progress regularly
- Move to Review when ready for feedback

## 📦 Phase: Core MVP

This phase focuses on building the foundational features.

**Goals:**
- User authentication
- Basic CRUD operations
- Responsive UI

---

## Implementation Notes

Build a navigation bar component with the following:
- Logo on the left
- Main navigation links in center
- User profile dropdown on right
- Mobile responsive (hamburger menu)
```

## File Format

Each task/phase is a markdown file with YAML frontmatter:

```markdown
---
id: phase1-task2-navbar-d9e3
type: task
title: "Build navigation bar"
stage: in-progress
phase: phase1-core-mvp-a3f2
created: 2025-11-11T10:00:00Z
updated: 2025-11-11T14:30:00Z
tags: [ui, react]
---

<!-- DOCFLOW:MANAGED - Do not edit above the separator -->

## ⚡ Stage: In Progress
[Auto-injected stage context]

## 📦 Phase: Core MVP
[Auto-injected phase context]

---
<!-- DOCFLOW:USER-CONTENT - Edit below this line -->

## Implementation Notes
[Your notes here - never touched by automation]
```

## Commands

| Command | Description |
|---------|-------------|
| `LLM Kanban: Initialize Workspace` | Create `.llmkanban/` folder structure |
| `LLM Kanban: Create Task` | Create a new task |
| `LLM Kanban: Create Phase` | Create a new phase |
| `LLM Kanban: Move Task` | Move task to different stage |
| `LLM Kanban: Copy with Context` | Copy task with stage/phase context |
| `LLM Kanban: Refresh Board` | Refresh tree view |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `llmkanban.defaultStage` | `backlog` | Default stage for new tasks |
| `llmkanban.enableFileWatcher` | `true` | Auto-refresh on file changes |

## Architecture

The extension is built with:
- **TypeScript** for type safety
- **Zod** for runtime validation
- **gray-matter** for YAML frontmatter parsing
- **VSCode Extension API** for UI and commands

Core components:
- **Parser**: Markdown parsing and serialization
- **FS Adapter**: File system operations with path validation
- **Context Injector**: Stage and phase context management
- **Tree Provider**: Sidebar tree view
- **Commands**: User-facing actions

## Philosophy

### Files are the Database
No external storage. Everything is in git-tracked markdown files.

### Context Preservation
Auto-inject stage/phase context, but NEVER touch user content.

### Manual Control
You orchestrate, the extension assists. No automatic task progression.

### Repository-Scoped
Each repo has its own `.llmkanban/` folder. Switch projects, switch boards.

## Roadmap

**Phase 1** (Completed):
- ✅ Core infrastructure
- ✅ Tree view sidebar
- ✅ Basic commands (create, move, copy)
- ✅ Context injection

**Phase 2** (Future):
- 🔲 Webview Kanban board with drag-and-drop
- 🔲 Search and filter
- 🔲 Bulk operations
- 🔲 Analytics and time tracking

## Contributing

Contributions welcome! This project is based on lessons learned from DocFlow.

Key areas for contribution:
- Webview Kanban board implementation
- Additional export formats
- Integration with other LLM tools
- Performance optimizations

## License

MIT License - See LICENSE file for details

## Credits

Inspired by and ported from the DocFlow project. Built specifically for LLM-assisted development workflows.

## Support

- [GitHub Issues](https://github.com/your-repo/issues)
- [Documentation](https://github.com/your-repo/wiki)

---

**Happy coding with your AI assistant!** 🚀
