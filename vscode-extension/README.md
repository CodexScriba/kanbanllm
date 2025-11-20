# LLM Kanban - File-Based Task Management for LLM-Assisted Development

A VSCode extension that provides a visual Kanban board for managing tasks during LLM-assisted development workflows. Keep your work organized with a file-based system that's Git-friendly and optimized for copying context to AI assistants.

## ✨ Features

### 📊 Visual Kanban Board
- **5-column workflow**: Queue → Planning → Coding → Auditing → Completed
- **Drag-and-drop** tasks between stages
- **Search and filter** by tags, phase, or title
- **Real-time updates** via file watcher

### 🗂️ Hierarchical Organization
- **Phases** group related tasks together
- **Tasks** can belong to phases or stand alone
- **Tags** for flexible categorization
- **Sidebar tree view** with expandable stages and phases

### 🤖 LLM Integration
- **Copy with Context** - 3 modes for sharing with AI:
  - **Full**: Frontmatter + Managed + User content
  - **Context + Content**: Managed section + User content only
  - **User Content Only**: Pure user-written content
- **Context Injection** - Stage and phase context automatically added to task files
- **Markdown format** - Easy for LLMs to parse and understand

### 💾 File-Based & Git-Friendly
- All data stored as markdown files in `.llmkanban/` folder
- Clean diffs for version control
- Offline-first - no external dependencies
- Edit files manually or through the UI

## 🚀 Getting Started

### Installation

1. Install the extension from the VSCode Marketplace
2. Or install from `.vsix` file:
   ```bash
   code --install-extension llm-kanban-0.0.1.vsix
   ```

### Quick Start

1. **Open a workspace** in VSCode
2. **Initialize LLM Kanban**:
   - Open Command Palette (Cmd/Ctrl+Shift+P)
   - Run: `LLM Kanban: Initialize Workspace`
   - This creates the `.llmkanban/` folder structure

3. **Create your first task**:
   - Open Command Palette
   - Run: `LLM Kanban: Create Task`
   - Enter task details and select a stage

4. **View the Kanban board**:
   - Click the LLM Kanban icon in the activity bar (left sidebar)
   - Or run: `LLM Kanban: Open Kanban Board`

## 📖 User Guide

### Available Commands

- `LLM Kanban: Initialize Workspace` - Create `.llmkanban/` folder structure
- `LLM Kanban: Open Kanban Board` - View visual board
- `LLM Kanban: Create Task` - Add new task
- `LLM Kanban: Create Phase` - Add new phase
- `LLM Kanban: Move Task` - Change task stage
- `LLM Kanban: Copy with Context` - Copy task for LLM
- `LLM Kanban: Delete Item` - Remove task or phase
- `LLM Kanban: Refresh Sidebar` - Reload tree view

### Workflow Example

1. **Create a phase** for your feature:
   ```
   Phase: "User Authentication System"
   Stage: Planning
   ```

2. **Break it into tasks**:
   ```
   Task: "Design database schema" → Planning
   Task: "Implement login API" → Queue
   Task: "Add JWT middleware" → Queue
   ```

3. **Move tasks as you work**:
   - Design complete → move to "Coding"
   - API implemented → move to "Auditing"
   - Review passed → move to "Completed"

4. **Copy context to LLM** when stuck:
   - Select task
   - Copy with Context (Context + Content mode)
   - Paste into ChatGPT/Claude: "Help me implement this..."

## 📁 File Structure

```
.llmkanban/
├── 1-queue/              # Tasks waiting to start
├── 2-planning/           # Tasks being designed
├── 3-coding/             # Tasks being implemented
├── 4-auditing/           # Tasks under review
├── 5-completed/          # Finished tasks
├── _context/
│   ├── stages/           # Stage context templates
│   └── phases/           # Phase-specific context
└── README.md
```

## 🔧 Development

### Prerequisites

- Node.js (v16 or higher)
- VSCode (v1.90.0 or higher)

### Setup

```bash
cd vscode-extension
npm install
npm run compile
```

### Running

1. Press `F5` in VSCode to launch Extension Development Host
2. Test commands and features
3. Check Debug Console for errors

### Verify Functionality

- Look for "LLM Kanban" icon in Activity Bar (left sidebar)
- Click icon to open sidebar
- Verify three items appear:
  - 📁 Initialize Workspace
  - 📊 Open Kanban Board
  - ⚙️ Settings
- Run **Initialize Workspace** once to create `.llmkanban/`
- Click "Open Kanban Board" → webview panel should open
- Verify webview shows "Kanban Board" title and placeholder content
- Verify webview respects your theme (light/dark mode)

### Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Building

```bash
npm run compile       # TypeScript + Webpack
npm run package       # Create .vsix file
```

### Project Structure

```
vscode-extension/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── core/                     # File-system + parsing utilities
│   ├── sidebar/
│   │   └── SidebarProvider.ts    # Tree view provider for sidebar
│   ├── webview/
│   │   └── KanbanPanel.ts        # Kanban board webview panel
│   └── workspace/
│       └── KanbanWorkspace.ts    # .llmkanban initialization helpers
├── resources/
│   └── kanban-icon.svg          # Activity bar icon
├── out/                         # Compiled JavaScript (generated)
├── package.json                 # Extension manifest
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## Features

### Task 0: Sidebar Tree View ✅

The extension adds a new sidebar to VSCode with three menu items:

1. **Initialize Workspace** (📁 icon)
   - Command: `llmKanban.initializeWorkspace`
   - Action: Creates the `.llmkanban/` folder with default stage/context files
   - Status: ✅ Implemented

2. **Open Kanban Board** (📊 icon)
   - Command: `llmKanban.openBoard`
   - Action: Opens webview panel with Kanban board
   - Status: ✅ Webview infrastructure complete (Task 1)

3. **Settings** (⚙️ icon)
   - Command: `llmKanban.openSettings`
   - Action: Shows notification "Settings - Coming soon!"
   - Status: ⏳ Future implementation

### Task 1: Webview Infrastructure ✅

**Kanban Board Webview:**
- Opens in editor panel when "Open Kanban Board" is clicked
- Displays placeholder content with task progress
- Respects VSCode theme (dark/light mode)
- Message passing configured for future interactivity
- Content Security Policy properly configured

**Message Passing:**
- Extension → Webview: Ready for sending data
- Webview → Extension: Logs messages to console
- Test: Click anywhere in webview to see message in Debug Console

### Architecture Notes

- Uses VSCode TreeView API for sidebar
- Uses VSCode Webview API for board display
- Clean separation: `SidebarProvider` for tree, `KanbanPanel` for board
- Singleton pattern for webview (only one board open at a time)
- Proper resource cleanup on panel disposal

## Testing Checklist

**Task 0:** ✅ Basic Sidebar View

- [x] Extension appears in VSCode Activity Bar
- [x] Clicking extension icon shows "LLM KANBAN" tree view
- [x] Initialize/Open/Settings commands available from sidebar
- [x] Stage initialization command creates `.llmkanban/`
- [x] Works in both light and dark themes
- [x] TypeScript compiles without errors
- [x] No runtime errors in Debug Console

**Task 1:** ✅ Webview Infrastructure

- [x] Clicking "Open Kanban Board" opens webview panel
- [x] Webview displays placeholder content
- [x] Webview respects VSCode theme (dark/light)
- [x] Can send messages from extension to webview
- [x] Can send messages from webview to extension
- [x] Content Security Policy configured correctly
- [x] Singleton pattern works (only one panel at a time)
- [x] Panel disposal cleanup works properly

## Development Commands

```bash
# Install dependencies
npm install

# Compile once
npm run compile

# Watch mode (auto-compile)
npm run watch

# Lint code
npm run lint

# Run unit tests
npm run test

# Package extension (for distribution)
npm run vscode:prepublish
```

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📜 License

MIT License - See [LICENSE](../LICENSE) for details.

## 🙏 Acknowledgments

- Built with [VSCode Extension API](https://code.visualstudio.com/api)
- UI powered by [React](https://react.dev/)
- Drag-and-drop with [@dnd-kit](https://dndkit.com/)

---

**Made with ❤️ for developers working with LLMs**
