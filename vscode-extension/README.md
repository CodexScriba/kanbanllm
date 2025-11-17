# LLM Kanban - VSCode Extension

A file-based Kanban board extension for VSCode, designed specifically for managing LLM-assisted development tasks.

## Overview

LLM Kanban is a lightweight, git-friendly task management system that stores all data as markdown files in your repository. It provides a visual tree view sidebar to organize tasks across different stages of development.

## Features

### Phase 2 Implementation (Current)

- **Tree View Sidebar**: Visual organization of tasks and phases by stage
  - 📦 Phases with custom icons
  - ✅ Tasks with tags and metadata
  - Expandable/collapsible stage groups
  - Badge counts per stage

- **File-Based Storage**: All data stored as markdown files in `.llmkanban/` folder
  - Git-friendly version control
  - Human-readable format
  - YAML frontmatter for metadata

- **Auto-Refresh**: File watcher monitors changes and updates the view automatically
  - Debounced updates (500ms)
  - Handles external file edits
  - Real-time synchronization

- **Initialization Command**: Quick setup of folder structure
  - Creates all stage folders
  - Generates default context templates
  - Sets up proper hierarchy

## Installation

### Development Setup

1. Install dependencies:
```bash
bun install
```

2. Compile the extension:
```bash
bun run compile
```

3. Open in VSCode:
   - Press `F5` to launch Extension Development Host
   - The extension will activate when you open a workspace

### Usage

1. **Initialize Workspace**
   - Command Palette: `LLM Kanban: Initialize Workspace`
   - Creates `.llmkanban/` folder structure
   - Generates default stage templates

2. **View Kanban Board**
   - Look for the LLM Kanban icon in the Activity Bar (sidebar)
   - Click to open the tree view
   - Expand stages to see tasks and phases

3. **Refresh Board**
   - Click the refresh icon in the tree view title bar
   - Or use Command Palette: `LLM Kanban: Refresh Board`

## Folder Structure

```
your-project/
├── .llmkanban/
│   ├── _context/
│   │   ├── architecture.md
│   │   ├── stages/
│   │   │   ├── backlog.md
│   │   │   ├── in-progress.md
│   │   │   ├── review.md
│   │   │   ├── audit.md
│   │   │   └── completed.md
│   │   └── phases/
│   │       └── [phase context files]
│   ├── backlog/
│   ├── in-progress/
│   ├── review/
│   ├── audit/
│   └── completed/
```

## File Format

Each task/phase is a markdown file with YAML frontmatter:

```markdown
---
id: phase1-task1-setup-xyz
type: task
title: "Setup Development Environment"
stage: in-progress
phase: phase1-core-mvp-abc
created: 2025-11-17T10:00:00Z
updated: 2025-11-17T14:30:00Z
tags: [setup, environment]
dependencies: []
---

<!-- DOCFLOW:MANAGED - Do not edit above the separator -->

## 🎯 In Progress

[Stage context injected here]

---
<!-- DOCFLOW:USER-CONTENT - Edit below this line -->

## Your Notes

[Your freeform content here]
```

## Architecture

### Core Modules

- **types.ts**: TypeScript interfaces and type definitions
- **validators.ts**: Zod schemas for validation and sanitization
- **parser.ts**: Markdown parsing and serialization
- **fs-adapter.ts**: File system operations and ID generation

### Providers

- **kanban-tree-provider.ts**: VSCode TreeDataProvider implementation

### Utilities

- **file-watcher.ts**: File system monitoring with debouncing

### Commands

- **init-workspace.ts**: Workspace initialization logic

## Development

### Building

```bash
# Compile TypeScript
bun run compile

# Watch mode (auto-compile on changes)
bun run watch

# Lint code
bun run lint
```

### Testing

Sample test data is included in the root `.llmkanban/` folder for verification.

## What's Next

Phase 2 is now complete! The next phases include:

- **Phase 3**: Basic CRUD commands (create task, create phase, move task, delete)
- **Phase 4**: Webview Kanban board with drag-and-drop
- **Phase 5**: Copy with context for LLM integration
- **Phase 6**: Polish and UX improvements

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: VSCode Extension API
- **Dependencies**:
  - `zod`: Schema validation
  - `gray-matter`: YAML frontmatter parsing
  - `date-fns`: Date formatting

## License

MIT

## Contributing

This project follows the development plan outlined in `docs/context/PLAN.md`.
