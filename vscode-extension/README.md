# LLM Kanban - VSCode Extension

File-based Kanban board for managing LLM-assisted development workflows.

## Development Status

**Current Implementation:** Task 0 - Basic Sidebar View ✅

### Completed Features

- ✅ VSCode sidebar with "LLM Kanban" activity bar icon
- ✅ Two menu items: "Open Kanban Board" and "Settings"
- ✅ Placeholder commands (show "Coming soon" notifications)
- ✅ Proper TypeScript structure and compilation

### Next Steps

- Task 1: Setup Webview Infrastructure
- Task 2: Create Board Layout Shell
- See `../docs/context/phase2-development-plan.md` for full roadmap

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- VSCode (v1.90.0 or higher)
- TypeScript knowledge

### Installation

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-recompile on changes)
npm run watch
```

### Testing the Extension

1. **Open in VSCode:**
   ```bash
   code /home/user/kanbanllm/vscode-extension
   ```

2. **Launch Extension:**
   - Press `F5` to open Extension Development Host
   - Or: Run > Start Debugging

3. **Verify Functionality:**
   - Look for "LLM Kanban" icon in Activity Bar (left sidebar)
   - Click icon to open sidebar
   - Verify two items appear:
     - 📊 Open Kanban Board
     - ⚙️ Settings
   - Click each item - should show "Coming soon" notification

### Project Structure

```
vscode-extension/
├── src/
│   ├── extension.ts              # Main extension entry point
│   └── sidebar/
│       └── SidebarProvider.ts    # Tree view provider for sidebar
├── resources/
│   └── kanban-icon.svg          # Activity bar icon
├── out/                         # Compiled JavaScript (generated)
├── package.json                 # Extension manifest
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## Features (Task 0)

### Sidebar Tree View

The extension adds a new sidebar to VSCode with two menu items:

1. **Open Kanban Board** (📊 icon)
   - Command: `llmKanban.openBoard`
   - Action: Shows notification "Open Kanban Board - Coming soon!"
   - Future: Will open webview with Kanban board

2. **Settings** (⚙️ icon)
   - Command: `llmKanban.openSettings`
   - Action: Shows notification "Settings - Coming soon!"
   - Future: Will open settings configuration

### Architecture Notes

- Uses VSCode TreeView API for sidebar
- Clean separation: `SidebarProvider` handles tree data
- Placeholder commands registered in `extension.ts`
- No backend logic yet (pure UI shell)

## Testing Checklist

Task 0 is complete when:

- [x] Extension appears in VSCode Activity Bar
- [x] Clicking extension icon shows "LLM KANBAN" tree view
- [x] Two items visible: "Open Kanban Board" and "Settings"
- [x] Both items have correct icons (graph, gear)
- [x] Clicking items shows notification: "Coming soon"
- [x] Works in both light and dark themes
- [x] TypeScript compiles without errors
- [x] No runtime errors in Debug Console

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

# Package extension (for distribution)
npm run vscode:prepublish
```

## Troubleshooting

### Extension doesn't appear in Activity Bar

1. Check compilation succeeded: `npm run compile`
2. Look for errors in Debug Console (Help > Toggle Developer Tools)
3. Verify `package.json` contributes section is correct

### "Coming soon" notifications don't show

1. Check Debug Console for errors
2. Verify commands are registered in `extension.ts`
3. Try reloading Extension Development Host (Ctrl+R)

### Icons not showing

1. Verify `resources/kanban-icon.svg` exists
2. Check icon path in `package.json` is correct
3. Try rebuilding: `npm run compile`

## Design Reference

- Full UI/UX specifications: `../docs/context/visual-interface-design.md`
- Development plan: `../docs/context/phase2-development-plan.md`
- User personas: `../docs/context/user-personas-and-use-cases.md`

## License

MIT

## Contributing

This extension follows the Phase 2 development plan:
1. Build UI first
2. Add logic later
3. Incremental, testable steps

See development plan for detailed task breakdown.
