# Phase 2: Visual Components & Frontend Development Plan

**Created:** 2025-11-16
**Project:** VSCode LLM Kanban Extension
**Phase:** Phase 2 - Frontend Implementation
**Depends On:** Phase 1 (Design Foundation) ✅

---

## Overview

This document provides a detailed, step-by-step development plan for Phase 2, focusing on building the user-facing visual components. The approach is incremental, starting with the simplest UI shell and gradually adding functionality.

**Key Principle:** Build UI first, add logic later. Each step should be testable and demonstrable.

---

## Development Approach

### Incremental Development Strategy

1. **Start Simple:** Begin with minimal UI (sidebar with 2 buttons)
2. **Add Structure:** Build component foundations (webview, board shell)
3. **Add Interactivity:** Implement drag-and-drop and interactions
4. **Connect Data:** Link to backend (in Phase 4)
5. **Polish:** Animations, loading states, error handling

### Testing at Each Step

- Run extension in debug mode after each task
- Verify UI renders correctly in both light and dark themes
- Check keyboard navigation works
- Ensure VSCode integration is seamless

---

## Phase 2 Tasks (Detailed)

### Task 0: Create Basic Sidebar View (START HERE)

**Priority:** HIGHEST - This is the foundation

**Goal:** Create a VSCode sidebar with two menu items and no backend logic.

**What to Build:**
```
LLM KANBAN
├─ 📊 Open Kanban Board
└─ ⚙️  Settings
```

**Acceptance Criteria:**
- [ ] Extension appears in VSCode Activity Bar (left sidebar)
- [ ] Clicking extension icon shows "LLM KANBAN" tree view
- [ ] Two items visible: "Open Kanban Board" and "Settings"
- [ ] Both items have correct icons (codicons: graph, gear)
- [ ] Clicking items shows notification: "Coming soon"
- [ ] Works in both light and dark themes

**Technical Implementation:**

1. **Extension Setup:**
   - Initialize TypeScript VSCode extension project
   - Configure `package.json` with activation events
   - Register tree view provider in `extension.ts`

2. **Package.json Configuration:**
```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "llm-kanban",
          "title": "LLM Kanban",
          "icon": "resources/kanban-icon.svg"
        }
      ]
    },
    "views": {
      "llm-kanban": [
        {
          "id": "llmKanban.treeView",
          "name": "LLM Kanban"
        }
      ]
    }
  }
}
```

3. **Tree Data Provider:**
```typescript
// src/sidebar/SidebarProvider.ts
class SidebarProvider implements vscode.TreeDataProvider<SidebarItem> {
  getChildren(): SidebarItem[] {
    return [
      new SidebarItem('Open Kanban Board', vscode.TreeItemCollapsibleState.None, 'graph'),
      new SidebarItem('Settings', vscode.TreeItemCollapsibleState.None, 'gear')
    ];
  }

  getTreeItem(element: SidebarItem): vscode.TreeItem {
    return element;
  }
}

class SidebarItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    iconName: string
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon(iconName);
    this.command = {
      command: 'llmKanban.placeholder',
      title: 'Placeholder',
      arguments: [label]
    };
  }
}
```

4. **Register Commands:**
```typescript
// extension.ts
export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('llmKanban.treeView', sidebarProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.placeholder', (label: string) => {
      vscode.window.showInformationMessage(`${label} - Coming soon!`);
    })
  );
}
```

**Files to Create:**
- `src/extension.ts` - Main extension entry point
- `src/sidebar/SidebarProvider.ts` - Tree view provider
- `package.json` - Extension manifest
- `tsconfig.json` - TypeScript configuration
- `resources/kanban-icon.svg` - Activity bar icon

**Estimated Time:** 2-3 hours

**Deliverable:** Working VSCode extension with basic sidebar (no functionality yet)

---

### Task 1: Setup Webview Infrastructure

**Goal:** Create a webview that opens when "Open Kanban Board" is clicked.

**What to Build:**
- Webview panel that displays "Kanban Board - Coming Soon"
- Proper message passing setup between extension and webview
- Basic HTML/CSS structure

**Acceptance Criteria:**
- [ ] Clicking "Open Kanban Board" opens webview panel
- [ ] Webview displays placeholder content
- [ ] Webview respects VSCode theme (dark/light)
- [ ] Can send messages from extension to webview
- [ ] Can send messages from webview to extension

**Technical Implementation:**

1. **Create Webview Panel:**
```typescript
// src/webview/KanbanPanel.ts
export class KanbanPanel {
  public static currentPanel: KanbanPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (KanbanPanel.currentPanel) {
      KanbanPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'llmKanbanBoard',
      'Kanban Board',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      }
    );

    KanbanPanel.currentPanel = new KanbanPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getHtmlContent();

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(message => {
      console.log('Message from webview:', message);
    });
  }

  private _getHtmlContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kanban Board</title>
        <style>
          body {
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
            padding: 20px;
          }
          h1 {
            color: var(--vscode-editor-foreground);
          }
        </style>
      </head>
      <body>
        <h1>Kanban Board</h1>
        <p>Coming soon...</p>
      </body>
      </html>
    `;
  }
}
```

2. **Update Sidebar Command:**
```typescript
// Update the command in extension.ts
context.subscriptions.push(
  vscode.commands.registerCommand('llmKanban.openBoard', () => {
    KanbanPanel.createOrShow(context.extensionUri);
  })
);
```

**Files to Create:**
- `src/webview/KanbanPanel.ts` - Webview panel manager
- `src/webview/index.html` - Webview HTML template (optional)

**Estimated Time:** 3-4 hours

**Deliverable:** Clickable "Open Kanban Board" button that opens a webview

---

### Task 2: Create Board Layout Shell

**Goal:** Build the 6-column board structure with static placeholder cards.

**What to Build:**
- Board container with 6 columns (Chat, Queue, Plan, Code, Audit, Completed)
- Column headers with icons and count badges
- 2-3 placeholder cards per column
- Basic CSS styling using VSCode theme variables

**Acceptance Criteria:**
- [ ] 6 columns visible in webview
- [ ] Columns have correct names and icons
- [ ] Columns display in correct order (Chat → Queue → Plan → Code → Audit → Completed)
- [ ] Each column has colored header matching design spec
- [ ] Placeholder cards visible in each column
- [ ] Responsive: horizontal scroll if viewport too narrow

**Technical Implementation:**

1. **HTML Structure:**
```html
<div class="kanban-board">
  <div class="board-header">
    <h1>Kanban Board</h1>
  </div>

  <div class="board-columns">
    <div class="column" data-stage="chat">
      <div class="column-header">
        <i class="codicon codicon-comment-discussion"></i>
        <span class="column-title">Chat</span>
        <span class="column-count">(2)</span>
      </div>
      <div class="column-content">
        <div class="card">
          <div class="card-title">Sample task 1</div>
        </div>
        <div class="card">
          <div class="card-title">Sample task 2</div>
        </div>
      </div>
    </div>

    <!-- Repeat for Queue, Plan, Code, Audit, Completed -->
  </div>
</div>
```

2. **CSS Styling:**
```css
.kanban-board {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--vscode-editor-background);
}

.board-columns {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 16px;
}

.column {
  flex-shrink: 0;
  width: 280px;
  display: flex;
  flex-direction: column;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--vscode-sideBar-background);
  border-radius: 4px 4px 0 0;
  font-weight: 600;
}

.column[data-stage="chat"] .column-header {
  border-top: 3px solid var(--stage-chat, #9665C0);
}

.column[data-stage="queue"] .column-header {
  border-top: 3px solid var(--stage-queue, #D18616);
}

/* Repeat for other stages */

.column-content {
  flex: 1;
  background: var(--vscode-panel-background);
  padding: 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card {
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 8px;
}

.card-title {
  font-size: 13px;
}
```

**Files to Update:**
- `src/webview/KanbanPanel.ts` - Update HTML content
- Create `src/webview/styles.css` - Board styles
- Create `src/webview/board.js` - (Optional) JavaScript for interactivity

**Estimated Time:** 4-5 hours

**Deliverable:** Full 6-column board layout with placeholder cards

---

### Task 3: Setup React Environment

**Goal:** Convert static HTML to React components for easier state management.

**What to Build:**
- React setup with TypeScript
- Webpack configuration for bundling
- Component structure (Board, Column, Card)

**Acceptance Criteria:**
- [ ] React app renders in webview
- [ ] Same visual appearance as Task 2
- [ ] Components are modular and reusable
- [ ] TypeScript types defined for all props
- [ ] Hot reload works in development

**Technical Implementation:**

1. **Install Dependencies:**
```bash
npm install react react-dom
npm install -D @types/react @types/react-dom
npm install -D webpack webpack-cli ts-loader css-loader style-loader
```

2. **Component Structure:**
```typescript
// src/webview/components/Board.tsx
export const Board: React.FC = () => {
  const stages = ['chat', 'queue', 'plan', 'coding', 'audit', 'completed'];

  return (
    <div className="kanban-board">
      <BoardHeader />
      <div className="board-columns">
        {stages.map(stage => (
          <Column key={stage} stage={stage} />
        ))}
      </div>
    </div>
  );
};

// src/webview/components/Column.tsx
interface ColumnProps {
  stage: string;
}

export const Column: React.FC<ColumnProps> = ({ stage }) => {
  return (
    <div className="column" data-stage={stage}>
      <ColumnHeader stage={stage} count={2} />
      <div className="column-content">
        <Card title="Sample task 1" />
        <Card title="Sample task 2" />
      </div>
    </div>
  );
};

// src/webview/components/Card.tsx
interface CardProps {
  title: string;
}

export const Card: React.FC<CardProps> = ({ title }) => {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
    </div>
  );
};
```

3. **Webpack Config:**
```javascript
// webpack.config.js
module.exports = {
  entry: './src/webview/index.tsx',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'webview.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};
```

**Files to Create:**
- `src/webview/index.tsx` - React entry point
- `src/webview/components/Board.tsx`
- `src/webview/components/Column.tsx`
- `src/webview/components/Card.tsx`
- `webpack.config.js`

**Estimated Time:** 4-6 hours

**Deliverable:** React-based board with same appearance as static version

---

### Task 4: Build Card Component with Full Design

**Goal:** Implement complete card design with tags, metadata, icons.

**What to Build:**
- Phase cards (thicker border, bold title)
- Task cards (standard border)
- Tag badges
- Metadata (updated time, ID)
- Hover states

**Acceptance Criteria:**
- [ ] Phase cards visually distinct from task cards
- [ ] Tags displayed with colored badges
- [ ] Metadata row shows updated time and ID
- [ ] Hover shows quick action buttons
- [ ] Icons use VSCode codicons
- [ ] Truncation works for long titles

**Technical Implementation:**

```typescript
// src/webview/components/Card.tsx
interface CardProps {
  type: 'phase' | 'task';
  title: string;
  tags?: string[];
  updated: Date;
  id: string;
  parentPhase?: string;
}

export const Card: React.FC<CardProps> = ({
  type,
  title,
  tags = [],
  updated,
  id,
  parentPhase
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`card card--${type}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-header">
        <i className={`codicon codicon-${type === 'phase' ? 'package' : 'file'}`} />
        <span className="card-title">{title}</span>
      </div>

      {tags.length > 0 && (
        <div className="card-tags">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          {tags.length > 3 && <span className="tag-more">+{tags.length - 3} more</span>}
        </div>
      )}

      <div className="card-metadata">
        <span className="card-updated">{formatRelativeTime(updated)}</span>
        <span className="card-id">{truncateId(id)}</span>
      </div>

      {isHovered && (
        <div className="card-actions">
          <button>Copy</button>
          <button>Edit</button>
          <button>Move</button>
        </div>
      )}
    </div>
  );
};
```

**Files to Update:**
- `src/webview/components/Card.tsx`
- `src/webview/styles/card.css`
- `src/webview/utils/formatters.ts` - Helper functions

**Estimated Time:** 4-5 hours

**Deliverable:** Fully styled cards matching design specification

---

### Task 5: Implement Drag-and-Drop UI

**Goal:** Add drag-and-drop functionality using @dnd-kit library.

**What to Build:**
- Draggable cards
- Droppable columns
- Visual feedback during drag
- Drop zone highlighting

**Acceptance Criteria:**
- [ ] Cards can be dragged
- [ ] Cards become semi-transparent during drag
- [ ] Drop zones highlight when dragging over
- [ ] Cards drop in correct position
- [ ] Smooth animations
- [ ] Works with keyboard (accessibility)

**Technical Implementation:**

1. **Install dnd-kit:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

2. **Implement Drag Context:**
```typescript
// src/webview/components/Board.tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export const Board: React.FC = () => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Move card logic (will be implemented in Phase 4)
      console.log(`Move ${active.id} to ${over.id}`);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {/* Board content */}
      </div>
    </DndContext>
  );
};
```

3. **Make Cards Draggable:**
```typescript
// src/webview/components/Card.tsx
import { useDraggable } from '@dnd-kit/core';

export const Card: React.FC<CardProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="card"
    >
      {/* Card content */}
    </div>
  );
};
```

**Files to Update:**
- `src/webview/components/Board.tsx`
- `src/webview/components/Card.tsx`
- `src/webview/components/Column.tsx`
- `src/webview/styles/drag-drop.css`

**Estimated Time:** 6-8 hours

**Deliverable:** Working drag-and-drop (UI only, no persistence yet)

---

### Task 6: Add Search, Filter, and Sort UI

**Goal:** Build search bar and filter/sort dropdowns (UI only).

**What to Build:**
- Search input in board header
- Filter dropdown (by tag, by phase)
- Sort dropdown (by updated, created, title)
- Clear filters button

**Acceptance Criteria:**
- [ ] Search input visible in header
- [ ] Filter dropdown shows options
- [ ] Sort dropdown shows options
- [ ] UI components styled consistently
- [ ] Placeholder functionality (actual filtering in Phase 4)

**Estimated Time:** 3-4 hours

**Deliverable:** Complete board header with search/filter/sort UI

---

### Task 7: Implement Empty States

**Goal:** Design and implement empty states for columns and board.

**What to Build:**
- Empty column state (when no cards)
- Empty board state (when no .llmkanban folder)
- Helpful messages and call-to-action buttons

**Acceptance Criteria:**
- [ ] Empty columns show icon and message
- [ ] Empty board shows initialization prompt
- [ ] CTAs are clear and actionable
- [ ] Centered layout looks good

**Estimated Time:** 2-3 hours

**Deliverable:** Empty states for all scenarios

---

### Task 8: Add Loading States and Skeletons

**Goal:** Create skeleton screens and loading indicators.

**What to Build:**
- Skeleton cards with shimmer animation
- Board loading spinner
- Optimistic UI updates

**Acceptance Criteria:**
- [ ] Skeleton cards appear during load
- [ ] Shimmer animation smooth
- [ ] Loading prevents layout shift
- [ ] Spinner for full board load

**Estimated Time:** 3-4 hours

**Deliverable:** Professional loading experience

---

### Task 9: Implement Accessibility Features

**Goal:** Ensure full keyboard navigation and screen reader support.

**What to Build:**
- Keyboard shortcuts
- Focus indicators
- ARIA labels
- Screen reader announcements

**Acceptance Criteria:**
- [ ] Can navigate entire board with keyboard
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Screen reader announces actions
- [ ] WCAG AA compliant

**Estimated Time:** 4-5 hours

**Deliverable:** Fully accessible UI

---

### Task 10: Polish Visual Details

**Goal:** Add animations, transitions, and final visual polish.

**What to Build:**
- Micro-animations (hover effects, card movements)
- Smooth transitions
- Shadows and depth
- Responsive adjustments

**Acceptance Criteria:**
- [ ] Animations are smooth (60fps)
- [ ] Transitions use proper easing
- [ ] Visual hierarchy clear
- [ ] Dark mode perfect
- [ ] Responsive on different sizes

**Estimated Time:** 4-6 hours

**Deliverable:** Polished, production-ready UI

---

## Summary Checklist

**Phase 2 Complete When:**
- [ ] Task 0: Basic sidebar with "Open Kanban" and "Settings" ✅ **START HERE**
- [ ] Task 1: Webview opens and displays content
- [ ] Task 2: 6-column board layout visible
- [ ] Task 3: React components implemented
- [ ] Task 4: Cards fully styled with metadata
- [ ] Task 5: Drag-and-drop working (UI only)
- [ ] Task 6: Search/filter/sort UI present
- [ ] Task 7: Empty states implemented
- [ ] Task 8: Loading states working
- [ ] Task 9: Accessibility complete
- [ ] Task 10: Visual polish done

---

## Total Time Estimate

| Task | Hours |
|------|-------|
| Task 0: Basic Sidebar | 2-3 |
| Task 1: Webview Setup | 3-4 |
| Task 2: Board Layout | 4-5 |
| Task 3: React Setup | 4-6 |
| Task 4: Card Component | 4-5 |
| Task 5: Drag-and-Drop | 6-8 |
| Task 6: Search/Filter UI | 3-4 |
| Task 7: Empty States | 2-3 |
| Task 8: Loading States | 3-4 |
| Task 9: Accessibility | 4-5 |
| Task 10: Polish | 4-6 |
| **Total** | **39-53 hours** |

Approximately **1-2 weeks** of focused development.

---

## Next Phase

After Phase 2 is complete, proceed to:

**Phase 3: User Commands & Interaction Logic**
- Command palette integration
- Context menus
- Quick input flows
- File watcher setup

**Phase 4: Backend Logic & File Operations**
- File system operations
- Markdown parsing
- ID generation
- Move/create/delete operations

---

## Notes

- Each task should be committed to git separately
- Test in both light and dark themes after each task
- Use VSCode's built-in debugging for extension development
- Refer to `visual-interface-design.md` for design specifications
- All UI should work WITHOUT backend logic initially

---

**End of Phase 2 Development Plan**

Start with Task 0 and work sequentially. Each task builds on the previous one.
