# VSCode LLM Kanban Extension - Project Plan

**Created:** 2025-11-12
**Based on:** DocFlow file-based Kanban system
**Purpose:** Bootstrap document for VSCode extension development

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Core Philosophy](#core-philosophy)
3. [Technology Stack](#technology-stack)
4. [Architecture Overview](#architecture-overview)
5. [Folder Structure](#folder-structure)
6. [File Format Specification](#file-format-specification)
7. [Core Logic Components](#core-logic-components)
8. [Extension Features](#extension-features)
9. [User Workflows](#user-workflows)
10. [Implementation Phases](#implementation-phases)
11. [Key Learnings from DocFlow](#key-learnings-from-docflow)

---

## Problem Statement

### The Challenge

Developers working with LLMs (Claude Code, Codex, etc.) need a lightweight, file-based task management system that:
- Lives in the repository alongside code
- Provides context injection for LLM interactions
- Allows manual control of task progression
- Integrates seamlessly with VSCode workflow
- Requires zero external dependencies or servers

### Current Pain Points

1. **Existing solutions are too heavy**: Web-based Kanban boards require servers, databases, authentication
2. **Context loss**: Copying tasks to LLMs loses stage/phase context
3. **Poor git integration**: External tools don't version control task history
4. **Workflow interruption**: Switching between IDE and browser breaks flow
5. **Atom8n limitations**: Missing critical features like context injection, proper file organization

### The Solution

A VSCode extension that provides:
- Visual drag-and-drop Kanban board (webview)
- File-based storage (`.llmkanban/` folder)
- Automatic context injection (stage + phase context)
- One-click "Copy with Context" for LLM prompts
- Git-friendly markdown files
- Zero server/database requirements

---

## Core Philosophy

### Design Principles

1. **Files are the Database**
   - Markdown files with YAML frontmatter
   - Human-readable and git-friendly
   - No external storage

2. **Context Preservation**
   - Auto-inject stage context when tasks move
   - Auto-inject phase context for related tasks
   - Preserve user content across all operations

3. **Manual Control**
   - User orchestrates, extension assists
   - No automatic task progression
   - Copy/paste workflow for LLM interaction

4. **Repository-Scoped**
   - Each repo has its own `.llmkanban/` folder
   - Switch projects → switch boards automatically
   - No global state or configuration

5. **VSCode-Native**
   - Uses VSCode's file system APIs
   - Integrates with git panel
   - Follows VSCode UX patterns

---

## Technology Stack

### Extension Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| VSCode Extension API | Latest | Core extension framework |
| TypeScript | 5.x | Type-safe development |
| Node.js | 18+ | Runtime environment |

### UI Layer

| Technology | Purpose |
|------------|---------|
| Webview API | Kanban board UI |
| React | UI rendering in webview |
| Tailwind CSS | Styling (optional, could use plain CSS) |
| @dnd-kit/core | Drag-and-drop functionality |

### Data Management

| Technology | Purpose |
|------------|---------|
| gray-matter | YAML frontmatter parsing |
| Zod | Schema validation |
| Node.js fs/promises | File system operations |
| date-fns | Date formatting |

### Extension-Specific

| Technology | Purpose |
|------------|---------|
| vscode.TreeDataProvider | Sidebar tree view |
| vscode.FileSystemWatcher | Auto-refresh on file changes |
| vscode.commands | Command registration |
| vscode.window.withProgress | Loading indicators |

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCode Extension Host                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Extension Entry Point                    │   │
│  │            (src/extension.ts)                         │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │                                              │
│     ┌─────────┴─────────┬──────────────┬──────────────┐    │
│     │                   │              │              │    │
│  ┌──▼──────┐  ┌────────▼────┐  ┌──────▼─────┐  ┌────▼────┐│
│  │Commands │  │Tree Provider│  │  Webview   │  │File     ││
│  │Registry │  │ (Sidebar)   │  │  Provider  │  │Watcher  ││
│  └──┬──────┘  └────┬────────┘  └──────┬─────┘  └────┬────┘│
│     │              │                   │             │     │
│     └──────────────┴───────────────────┴─────────────┘     │
│                            │                                │
│                   ┌────────▼──────────┐                     │
│                   │   Core Logic      │                     │
│                   │  ┌──────────────┐ │                     │
│                   │  │ fs-adapter   │ │                     │
│                   │  │ parser       │ │                     │
│                   │  │ context-inj. │ │                     │
│                   │  │ validators   │ │                     │
│                   │  └──────────────┘ │                     │
│                   └────────┬──────────┘                     │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼──────────┐
                    │ Node.js File API  │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────┐
                    │  .llmkanban/      │
                    │  ├── _context/    │
                    │  ├── chat/        │
                    │  ├── queue/       │
                    │  ├── plan/        │
                    │  ├── audit/       │
                    │  └── completed/   │
                    └───────────────────┘
```

### Component Responsibilities

#### Extension Host Layer

**`extension.ts`**
- Entry point (activate/deactivate)
- Register commands
- Initialize providers
- Set up file watchers

**Commands**
- `llmkanban.init` - Initialize `.llmkanban/` in workspace
- `llmkanban.createTask` - Quick create task
- `llmkanban.createPhase` - Quick create phase
- `llmkanban.moveTask` - Move task to different stage
- `llmkanban.copyWithContext` - Copy task with full/partial context
- `llmkanban.openBoard` - Open webview board
- `llmkanban.refreshBoard` - Force refresh

**Tree Provider (Sidebar)**
- Shows tasks organized by stage
- Click to open task file
- Context menu actions (move, delete, copy)
- Auto-refresh on file changes

**Webview Provider**
- Renders Kanban board UI
- Handles drag-and-drop events
- Communicates with extension via message passing
- Updates on file system changes

**File Watcher**
- Monitors `.llmkanban/**/*.md` for changes
- Triggers board refresh on external modifications
- Handles file renames/deletes

#### Core Logic Layer

**`fs-adapter.ts`** (Ported from DocFlow)
- File system operations (read, write, move, delete)
- Path validation (prevent directory traversal)
- ID generation (`generatePhaseId`, `generateTaskId`)
- Dynamic numbering (scan existing to find next number)

**`parser.ts`** (Ported from DocFlow)
- Parse markdown → Item objects
- Serialize Item → markdown
- Build managed section with injected context
- Extract user content section

**`context-injector.ts`** (Ported from DocFlow)
- Read stage context from `_context/stages/{stage}.md`
- Read phase context from `_context/phases/{phaseId}.md`
- Merge context into managed section
- Preserve user content

**`validators.ts`** (Ported from DocFlow)
- Zod schemas for frontmatter validation
- Type guards (`isValidStage`, `isValidItemType`)
- Sanitization functions

**`types.ts`** (Ported from DocFlow)
- TypeScript interfaces
- Enums for Stage, ItemType
- Shared type definitions

---

## Folder Structure

### Repository Structure

```
your-project/
├── .llmkanban/                      # Kanban data (git-tracked)
│   ├── _context/                    # Context templates
│   │   ├── architecture.md          # System design docs
│   │   ├── design.md                # Design decisions
│   │   ├── stages/                  # Stage context templates
│   │   │   ├── chat.md
│   │   │   ├── queue.md
│   │   │   ├── plan.md
│   │   │   ├── audit.md
│   │   │   └── completed.md
│   │   └── phases/                  # Phase context files
│   │       └── phase{N}-{slug}-{hash}.md
│   │
│   ├── chat/                        # Stage folders
│   │   ├── phase1-task1-xyz.md
│   │   └── phase1-task2-abc.md
│   ├── queue/
│   ├── plan/
│   ├── audit/
│   └── completed/
│
├── .vscode/                         # VSCode settings
├── src/                             # Your project code
└── README.md
```

### Extension Project Structure

```
vscode-llm-kanban/
├── src/
│   ├── extension.ts                 # Entry point
│   │
│   ├── providers/
│   │   ├── kanban-tree-provider.ts  # Sidebar tree view
│   │   └── kanban-webview-provider.ts # Webview board
│   │
│   ├── commands/
│   │   ├── init-workspace.ts        # Setup .llmkanban/
│   │   ├── create-task.ts           # Quick create task
│   │   ├── create-phase.ts          # Quick create phase
│   │   ├── move-task.ts             # Move between stages
│   │   ├── copy-with-context.ts     # Copy task + context
│   │   ├── open-board.ts            # Open webview
│   │   └── delete-item.ts           # Delete task/phase
│   │
│   ├── core/                        # Business logic (from DocFlow)
│   │   ├── fs-adapter.ts
│   │   ├── parser.ts
│   │   ├── context-injector.ts
│   │   ├── validators.ts
│   │   └── types.ts
│   │
│   ├── webview/                     # Webview UI source
│   │   ├── index.html               # Webview HTML template
│   │   ├── main.tsx                 # React entry point
│   │   ├── components/
│   │   │   ├── Board.tsx            # Kanban board
│   │   │   ├── Column.tsx           # Stage column
│   │   │   ├── Card.tsx             # Task card
│   │   │   └── CreateModal.tsx      # Create task/phase form
│   │   └── styles/
│   │       └── main.css             # Webview styles
│   │
│   ├── utils/
│   │   ├── workspace.ts             # Workspace detection
│   │   ├── file-watcher.ts          # File change monitoring
│   │   └── messaging.ts             # Extension↔Webview messaging
│   │
│   └── templates/                   # Default context templates
│       ├── stages/
│       │   ├── chat.md
│       │   ├── queue.md
│       │   ├── plan.md
│       │   ├── audit.md
│       │   └── completed.md
│       └── architecture.md
│
├── media/                           # Extension assets
│   ├── icon.png                     # Extension icon
│   └── board-icon.svg               # Command icons
│
├── out/                             # Compiled output
├── node_modules/
├── package.json                     # Extension manifest
├── tsconfig.json
├── webpack.config.js                # Bundle webview
└── README.md
```

---

## File Format Specification

### Task/Phase File Structure

Every item (task or phase) is a markdown file with three sections:

```markdown
---
id: phase1-task2-navbar-d9e3
type: task
title: "Build navigation bar"
stage: queue
phase: phase1-core-mvp-a3f2
created: 2025-11-11T10:00:00Z
updated: 2025-11-11T14:30:00Z
tags: [ui, react]
dependencies: []
---

<!-- DOCFLOW:MANAGED - Do not edit above the separator -->

## 🎯 Stage: In Progress

This stage represents active work that is currently being implemented.

**Guidelines:**
- Focus on one task at a time
- Update progress regularly
- Move to Review when ready for feedback

[Content from .llmkanban/_context/stages/queue.md]

## 📦 Phase: Core MVP

This phase focuses on building the foundational features.

**Goals:**
- User authentication
- Basic CRUD operations
- Responsive UI

[Content from .llmkanban/_context/phases/phase1-core-mvp-a3f2.md]

---
<!-- DOCFLOW:USER-CONTENT - Edit below this line -->

## Implementation Notes

[User's freeform content - NEVER TOUCHED BY AUTOMATION]
```

### Frontmatter Schema

```typescript
interface ItemFrontmatter {
  id: string;                    // Unique identifier
  type: 'phase' | 'task';        // Item type
  title: string;                 // Display name
  stage: Stage;                  // Current stage
  phase?: string;                // Parent phase ID (required for tasks)
  created: string;               // ISO 8601 timestamp
  updated: string;               // ISO 8601 timestamp
  tags?: string[];               // Optional tags
  dependencies?: string[];       // Optional dependency IDs
  assignees?: string[];          // Future use
}

type Stage = 'chat' | 'queue' | 'plan' | 'code' | 'audit' | 'completed';
```

### ID Generation Rules

**Phases:**
```
Format: phase{N}-{slug}-{hash}
Example: phase3-ui-redesign-x7y2

Algorithm:
1. Scan all existing items across all stages
2. Filter for type: 'phase'
3. Extract phase numbers (e.g., 1, 2, 5)
4. Find max number (e.g., 5)
5. Next number = max + 1 (e.g., 6)
6. Generate slug from title (lowercase, hyphenated)
7. Generate hash (last 4 chars of Date.now().toString(36))
8. Combine: "phase6-ui-redesign-x7y2"
```

**Tasks:**
```
Format: phase{N}-task{M}-{slug}-{hash}
Example: phase2-task4-navbar-d9e3

Algorithm:
1. Scan all existing items across all stages
2. Filter for type: 'task' AND phase: parentPhaseId
3. Extract task numbers within this phase (e.g., 1, 2, 5)
4. Find max number (e.g., 5)
5. Next number = max + 1 (e.g., 6)
6. Generate slug from title
7. Generate hash (timestamp-based)
8. Extract phase number from parentPhaseId
9. Combine: "phase2-task6-navbar-d9e3"
```

### File Naming Convention

```
Filename = {id}.md

Examples:
- phase1-core-mvp-a3f2.md
- phase1-task1-setup-database-x9z1.md
- phase2-task3-api-endpoints-b7c2.md
```

---

## Core Logic Components

### 1. File System Adapter

**Responsibilities:**
- Read/write markdown files
- Validate paths (security)
- Generate unique IDs
- Move files between stages
- Delete files safely

**Key Functions:**

```typescript
// Read all items from all stages
async function loadAllItems(): Promise<Item[]>

// Read single item by ID
async function readItem(itemId: string): Promise<Item | null>

// Write item to stage folder
async function writeItem(item: Item, stage: Stage): Promise<void>

// Move item to different stage
async function moveItem(itemId: string, oldStage: Stage, newStage: Stage): Promise<void>

// Delete item
async function deleteItem(itemId: string, stage: Stage): Promise<void>

// Generate unique phase ID
async function generatePhaseId(title: string): Promise<string>

// Generate unique task ID
async function generateTaskId(title: string, phaseId: string): Promise<string>

// Validate path is within .llmkanban/
function validatePath(filePath: string): string
```

**Path Security:**

```typescript
const KANBAN_ROOT = path.join(workspaceRoot, '.llmkanban');

function validatePath(filePath: string): string {
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(KANBAN_ROOT);

  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new Error(`Path ${filePath} is outside of .llmkanban directory`);
  }

  return resolvedPath;
}
```

### 2. Parser

**Responsibilities:**
- Parse markdown → Item objects
- Serialize Item → markdown
- Build managed section
- Extract user content
- Handle separator logic

**Key Functions:**

```typescript
// Parse markdown file into Item object
function parseItem(markdown: string): Item

// Serialize Item object into markdown string
function serializeItem(item: Item): string

// Build managed section with injected context
function buildManagedSection(
  stageContext: string,
  phaseContext?: string
): string

// Extract user content (below separator)
function extractUserContent(markdown: string): string

// Split markdown into sections
function splitSections(markdown: string): {
  frontmatter: string;
  managedSection: string;
  userContent: string;
}
```

**Separator Logic:**

```typescript
const MANAGED_SEPARATOR = '<!-- DOCFLOW:MANAGED - Do not edit above the separator -->';
const USER_SEPARATOR = '<!-- DOCFLOW:USER-CONTENT - Edit below this line -->';

function splitSections(markdown: string) {
  const parts = markdown.split(USER_SEPARATOR);
  const userContent = parts[1] || '';
  const managedSection = parts[0] || '';

  return { managedSection, userContent };
}
```

### 3. Context Injector

**Responsibilities:**
- Read stage context files
- Read phase context files
- Merge context into managed section
- Re-inject on stage changes
- Preserve user content

**Key Functions:**

```typescript
// Read stage context from _context/stages/{stage}.md
async function getStageContext(stage: Stage): Promise<string>

// Read phase context from _context/phases/{phaseId}.md
async function getPhaseContext(phaseId: string): Promise<string | null>

// Re-inject context when stage changes
async function reinjectContextForStageChange(
  item: Item,
  newStage: Stage
): Promise<Item>

// Re-inject context when phase changes
async function reinjectContextForPhaseChange(
  item: Item,
  newPhaseId: string
): Promise<Item>

// Build full managed section
async function buildManagedContent(
  stage: Stage,
  phaseId?: string
): Promise<string>
```

**Context Injection Flow:**

```typescript
async function reinjectContextForStageChange(item: Item, newStage: Stage): Promise<Item> {
  // 1. Get new stage context
  const stageContext = await getStageContext(newStage);

  // 2. Get phase context if task
  const phaseContext = item.frontmatter.phase
    ? await getPhaseContext(item.frontmatter.phase)
    : null;

  // 3. Build new managed section
  const managedSection = buildManagedSection(stageContext, phaseContext);

  // 4. Preserve user content
  const userContent = extractUserContent(item.body);

  // 5. Update item
  return {
    ...item,
    frontmatter: { ...item.frontmatter, stage: newStage, updated: new Date().toISOString() },
    body: managedSection + '\n\n' + USER_SEPARATOR + '\n\n' + userContent,
    userContent
  };
}
```

### 4. Validators

**Responsibilities:**
- Validate frontmatter schema
- Type guards for runtime safety
- Sanitize user input
- Validate stage names
- Validate item types

**Zod Schemas:**

```typescript
import { z } from 'zod';

const StageSchema = z.enum(['chat', 'queue', 'plan', 'code', 'audit', 'completed']);
const ItemTypeSchema = z.enum(['phase', 'task']);

const ItemFrontmatterSchema = z.object({
  id: z.string().min(1),
  type: ItemTypeSchema,
  title: z.string().min(1),
  stage: StageSchema,
  phase: z.string().optional(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

// Type guards
function isValidStage(value: unknown): value is Stage {
  return StageSchema.safeParse(value).success;
}

function isValidItemType(value: unknown): value is ItemType {
  return ItemTypeSchema.safeParse(value).success;
}

// Validation function
function validateFrontmatter(data: unknown): ItemFrontmatter {
  return ItemFrontmatterSchema.parse(data);
}
```

---

## Extension Features

### 1. Webview Kanban Board

**Visual Design:**
- 6 columns (Chat, Queue, Plan, Code, Audit, Completed)
- Drag-and-drop cards between columns
- Color-coded badges (phase/task, tags)
- Create button per column
- Dark mode support

**Interactions:**
- Drag card → auto-moves file + re-injects context
- Click card → opens markdown file in editor
- Right-click → context menu (copy, delete, move)
- Click "+" → quick create modal
- Search/filter bar at top

**Webview ↔ Extension Messaging:**

```typescript
// Extension → Webview
webview.postMessage({
  type: 'update',
  items: Item[]
});

// Webview → Extension
case 'moveItem':
  await moveItemToStage(message.itemId, message.newStage);
  break;
case 'createItem':
  await createItem(message.data);
  break;
case 'deleteItem':
  await deleteItem(message.itemId);
  break;
case 'openItem':
  vscode.workspace.openTextDocument(message.filePath);
  break;
```

### 2. Sidebar Tree View

**Hierarchy:**
```
LLM Kanban
├── Backlog (3)
│   ├── 📦 Phase 1: Core MVP
│   ├── ✅ Task 1: Setup database
│   └── ✅ Task 2: API endpoints
├── In Progress (1)
│   └── ✅ Task 3: UI components
├── Review (0)
├── Audit (0)
└── Completed (2)
    ├── 📦 Phase 0: Planning
    └── ✅ Task 0: Project setup
```

**Features:**
- Click to open file
- Expand/collapse stages
- Badge counts per stage
- Context menu (move, delete, copy)
- Auto-refresh on file changes

### 3. Commands

#### `llmkanban.init`
- **Name:** "LLM Kanban: Initialize Workspace"
- **Action:** Creates `.llmkanban/` structure with default templates
- **When:** User runs command or extension detects missing folder

#### `llmkanban.createTask`
- **Name:** "LLM Kanban: Create Task"
- **Action:** Quick input prompt → creates task in queue
- **Input:** Title, Phase (picker), Tags (comma-separated)

#### `llmkanban.createPhase`
- **Name:** "LLM Kanban: Create Phase"
- **Action:** Quick input prompt → creates phase in queue
- **Input:** Title, Tags (comma-separated)

#### `llmkanban.moveTask`
- **Name:** "LLM Kanban: Move Task"
- **Action:** Quick pick stage → moves task + re-injects context
- **Context:** Available in editor context menu, tree view

#### `llmkanban.copyWithContext`
- **Name:** "LLM Kanban: Copy with Context"
- **Action:** Shows quick pick for copy mode → copies to clipboard
- **Options:**
  - Full (frontmatter + managed + user)
  - Managed Only (stage + phase context + user content)
  - User Content Only

#### `llmkanban.openBoard`
- **Name:** "LLM Kanban: Open Board"
- **Action:** Opens webview Kanban board

#### `llmkanban.refreshBoard`
- **Name:** "LLM Kanban: Refresh Board"
- **Action:** Force refresh tree view and webview

### 4. Copy with Context Feature

**User Flow:**
1. Right-click task in tree view or editor
2. Select "Copy with Context"
3. Quick pick appears:
   - **Full Document** (frontmatter + managed + user)
   - **Context + Content** (managed section + user content)
   - **User Content Only** (just freeform notes)
4. Selected content copied to clipboard
5. Paste into Claude Code or other LLM

**Output Examples:**

**Option 1: Full Document**
```markdown
---
id: phase1-task2-navbar-d9e3
type: task
title: "Build navigation bar"
stage: queue
phase: phase1-core-mvp-a3f2
created: 2025-11-11T10:00:00Z
updated: 2025-11-11T14:30:00Z
tags: [ui, react]
---

<!-- DOCFLOW:MANAGED -->

## 🎯 Stage: In Progress
...stage context...

## 📦 Phase: Core MVP
...phase context...

---
<!-- DOCFLOW:USER-CONTENT -->

## Implementation Notes
...user notes...
```

**Option 2: Context + Content**
```markdown
## 🎯 Stage: In Progress
...stage context...

## 📦 Phase: Core MVP
...phase context...

---

## Implementation Notes
...user notes...
```

**Option 3: User Content Only**
```markdown
## Implementation Notes
...user notes...
```

### 5. File Watcher

**Behavior:**
- Watches `.llmkanban/**/*.md` for changes
- Debounces rapid changes (500ms)
- Triggers tree view refresh
- Triggers webview update
- Handles external edits gracefully

**Events:**
- File created → add to board
- File modified → update card
- File deleted → remove from board
- File moved → update stage

---

## User Workflows

### Workflow 1: Initial Setup

1. Open project in VSCode
2. Run command: "LLM Kanban: Initialize Workspace"
3. Extension creates `.llmkanban/` structure
4. Extension opens architecture.md for customization
5. User edits stage/phase contexts as needed
6. User opens board: "LLM Kanban: Open Board"

### Workflow 2: Create Phase

1. User clicks "+" in Backlog column (webview)
   - OR runs command: "LLM Kanban: Create Phase"
2. Modal/Quick Input appears
3. User enters:
   - Title: "Core MVP"
   - Tags: "mvp, foundation"
4. Extension generates ID: `phase1-core-mvp-x7y2`
5. Extension creates file: `.llmkanban/queue/phase1-core-mvp-x7y2.md`
6. Extension injects queue stage context
7. Board refreshes, new phase appears
8. User opens file to add phase-specific context

### Workflow 3: Create Task

1. User clicks "+" in Backlog column
2. Modal appears with form:
   - Title: "Setup database"
   - Type: Task
   - Phase: [dropdown of existing phases]
   - Tags: "backend, postgres"
3. Extension generates ID: `phase1-task1-setup-database-a9b3`
4. Extension creates file in queue
5. Extension injects:
   - Backlog stage context
   - Selected phase context
6. Board refreshes, new task appears

### Workflow 4: Move Task to In Progress

1. User drags task card from Backlog to In Progress column
2. Webview sends message to extension: `{ type: 'moveItem', itemId, newStage: 'code' }`
3. Extension:
   - Reads task file from queue
   - Updates frontmatter: `stage: 'code'`, `updated: (now)`
   - Re-injects In Progress stage context
   - Preserves phase context
   - Preserves user content
   - Moves file: `queue/task.md` → `code/task.md`
4. Extension triggers file watcher event
5. Board refreshes, card appears in new column

### Workflow 5: Copy Task to LLM

1. User right-clicks task in tree view
2. Selects "Copy with Context"
3. Quick pick appears: "Full / Context + Content / User Content Only"
4. User selects "Context + Content"
5. Extension:
   - Reads task file
   - Extracts managed section + user content
   - Copies to clipboard
6. User pastes into Claude Code prompt

### Workflow 6: Manual File Edit

1. User opens `.llmkanban/code/task.md` in editor
2. User edits user content section (below separator)
3. User saves file
4. File watcher detects change
5. Extension re-parses file
6. Tree view + webview update to reflect changes
7. Context sections remain untouched

### Workflow 7: Stage Transition with Context

1. Task moves from In Progress → Review (via drag)
2. Extension:
   - Reads old file
   - Parses frontmatter + sections
   - Removes "In Progress" stage context
   - Injects "Review" stage context
   - Keeps phase context unchanged
   - Keeps user content unchanged
   - Updates frontmatter timestamps
   - Writes to `audit/` folder
   - Deletes from `code/` folder

### Workflow 8: Complete Task

1. User drags task to Completed column
2. Extension moves file to `completed/`
3. Extension injects "Completed" stage context
4. File remains in git history
5. User can view completed tasks for reference

---

## Implementation Phases

### Phase 1: Core Infrastructure

**Goal:** Set up extension skeleton and file system operations

**Tasks:**
1. **Setup Extension Project**
   - Initialize TypeScript project with VSCode extension template
   - Configure webpack for webview bundling
   - Set up package.json with activation events
   - Add development scripts (compile, watch, package)

2. **Port Core Logic from DocFlow**
   - Copy `types.ts` → define interfaces
   - Copy `fs-adapter.ts` → adapt paths for `.llmkanban/`
   - Copy `parser.ts` → markdown parsing logic
   - Copy `context-injector.ts` → context merging
   - Copy `validators.ts` → Zod schemas

3. **Implement Workspace Utilities**
   - Detect workspace root
   - Find or create `.llmkanban/` folder
   - Validate folder structure
   - Initialize default templates

4. **Create Init Command**
   - Command: `llmkanban.init`
   - Create folder structure
   - Copy default stage/phase templates
   - Show welcome message

**Deliverables:**
- ✅ Working extension that activates in VSCode
- ✅ Command to initialize `.llmkanban/` folder
- ✅ Core logic tested with manual file operations

---

### Phase 2: Tree View Sidebar

**Goal:** Implement sidebar tree view for task browsing

**Tasks:**
1. **Create Tree Data Provider**
   - Implement `vscode.TreeDataProvider<TreeItem>`
   - Define tree item structure (stages → items)
   - Load items from file system
   - Show badge counts per stage

2. **Add Tree View Interactions**
   - Click item → open markdown file
   - Expand/collapse stages
   - Refresh command
   - Context menu placeholder

3. **Implement File Watcher**
   - Watch `.llmkanban/**/*.md`
   - Debounce changes
   - Trigger tree refresh on changes
   - Handle create/update/delete events

4. **Add Icons and Styling**
   - Phase icon (📦)
   - Task icon (✅)
   - Stage-specific colors

**Deliverables:**
- ✅ Sidebar showing tasks organized by stage
- ✅ Click to open files
- ✅ Auto-refresh on file changes

---

### Phase 3: Basic Commands

**Goal:** Implement core CRUD commands

**Tasks:**
1. **Create Task Command**
   - Quick input for title
   - Quick pick for phase selection
   - Input for tags (comma-separated)
   - Generate ID and create file
   - Inject default context

2. **Create Phase Command**
   - Quick input for title
   - Input for tags
   - Generate phase ID
   - Create file in queue

3. **Move Task Command**
   - Quick pick for target stage
   - Move file between folders
   - Re-inject stage context
   - Update frontmatter timestamps

4. **Delete Item Command**
   - Confirmation dialog
   - Delete file from stage folder
   - Refresh tree view

**Deliverables:**
- ✅ Working create/move/delete commands
- ✅ Context menu integration
- ✅ Keyboard shortcuts

---

### Phase 4: Webview Kanban Board

**Goal:** Build visual drag-and-drop board

**Tasks:**
1. **Setup Webview Infrastructure**
   - Create webview provider
   - Configure webpack for React + Tailwind
   - Set up message passing (extension ↔ webview)
   - Handle state synchronization

2. **Build React Components**
   - Board container (5 columns)
   - Column component (droppable)
   - Card component (draggable)
   - Create modal (form)

3. **Integrate dnd-kit**
   - Setup DndContext
   - Implement drag handlers
   - Handle drop events
   - Send move messages to extension

4. **Styling and Polish**
   - Dark mode support
   - Color-coded stages
   - Badges for type/tags
   - Loading states

**Deliverables:**
- ✅ Working drag-and-drop Kanban board
- ✅ Visual card creation
- ✅ Real-time updates on file changes

---

### Phase 5: Copy with Context

**Goal:** Implement LLM integration feature

**Tasks:**
1. **Copy Command Logic**
   - Get active task (from editor or tree selection)
   - Read file and parse sections
   - Quick pick for copy mode selection
   - Format output based on selection

2. **Copy Modes**
   - Full Document formatter
   - Context + Content formatter
   - User Content Only formatter

3. **Clipboard Integration**
   - Use `vscode.env.clipboard.writeText()`
   - Show confirmation notification
   - Include metadata in notification (chars copied)

4. **Context Menu Integration**
   - Add to editor context menu
   - Add to tree view context menu
   - Add keyboard shortcut

**Deliverables:**
- ✅ Working copy command with 3 modes
- ✅ Clipboard integration
- ✅ User notifications

---

### Phase 6: Polish and UX

**Goal:** Refine user experience and edge cases

**Tasks:**
1. **Error Handling**
   - Graceful handling of missing files
   - Validation error messages
   - Corrupted frontmatter recovery
   - Network/permission errors

2. **Loading States**
   - Progress indicators for long operations
   - Skeleton states in webview
   - Debounced refreshes

3. **Configuration**
   - Settings for default stage
   - Custom stage names (optional)
   - Theme customization
   - File watcher enable/disable

4. **Documentation**
   - README with screenshots
   - Extension marketplace description
   - Keyboard shortcut reference
   - Example workflows

**Deliverables:**
- ✅ Polished UX with loading states
- ✅ Error handling for edge cases
- ✅ Complete documentation

---

### Phase 7: Advanced Features (Future)

**Goal:** Optional enhancements based on usage

**Tasks:**
1. **Search and Filter**
   - Search bar in webview
   - Filter by tag
   - Filter by phase
   - Sort options

2. **Bulk Operations**
   - Multi-select in tree view
   - Bulk move to stage
   - Bulk tag editing

3. **Analytics**
   - Time in stage tracking
   - Completion statistics
   - Burndown charts

4. **Templates**
   - Custom task templates
   - Template picker on create
   - User-defined fields

---

## Key Learnings from DocFlow

### 1. File-Based Architecture Works

**What We Learned:**
- Markdown + YAML frontmatter is perfect for task data
- Git diffs are clean and readable
- No database = zero deployment complexity
- File system operations are fast enough for < 500 items

**Application to Extension:**
- Use same file format
- Leverage VSCode's file system APIs
- Keep all logic synchronous (no async DB calls)

### 2. Context Injection is Killer Feature

**What We Learned:**
- Auto-injecting stage context on moves saves massive time
- Separating managed vs. user content prevents accidents
- Phase context provides cross-task coherence
- Users love "copy with context" for LLM prompts

**Application to Extension:**
- Port context-injector.ts exactly as-is
- Add "copy with context" command early
- Make context files easily editable

### 3. ID Generation Must Be Robust

**What We Learned:**
- Sequential numbering (phase1, phase2, task1, task2) is intuitive
- Scanning files to find next number works well
- Hash suffix prevents collisions
- Slug in ID makes files grep-friendly

**Application to Extension:**
- Use same algorithm (scan + max + 1)
- Keep hash for collision prevention
- Make IDs predictable and readable

### 4. Separation of Concerns

**What We Learned:**
- Keeping parser, fs-adapter, context-injector separate = easy to test
- Server Actions were overkill (could be simple functions)
- TypeScript + Zod caught 90% of bugs before runtime

**Application to Extension:**
- Port core logic as-is (already well-structured)
- Skip Server Actions complexity
- Keep Zod for validation

### 5. UI/UX Insights

**What We Learned:**
- Drag-and-drop is intuitive and fast
- Tree view is good for browsing, board is good for organizing
- Color-coded stages help visual scanning
- Modal forms beat multi-step wizards

**Application to Extension:**
- Provide both tree view + webview board
- Use dnd-kit (proven to work)
- Keep forms simple (single modal)

### 6. What Didn't Work in DocFlow

**Mistakes to Avoid:**

1. **Next.js was overkill**
   - Server Components added complexity
   - Server Actions were RPC ceremony
   - Dev server requirement was annoying
   - **Fix:** Extension runs in VSCode, no server needed

2. **Optimistic updates were buggy**
   - router.refresh() timing issues
   - Race conditions on rapid moves
   - **Fix:** Extension has direct file access, no need for optimism

3. **No search/filter**
   - Board became crowded with > 20 items
   - **Fix:** Add search bar in Phase 7

4. **Hard to find completed tasks**
   - Completed column kept growing
   - **Fix:** Add collapse/pagination in webview

### 7. Git Integration Insights

**What We Learned:**
- Users want to commit task changes
- Clean diffs matter (YAML + markdown = readable)
- File moves show as renames (git handles well)
- Context injection diffs are noisy but acceptable

**Application to Extension:**
- Let VSCode's git panel handle commits
- Don't auto-commit (user stays in control)
- Preserve formatting to minimize diffs

### 8. Performance Characteristics

**What We Learned:**
- Loading 100 items: ~200ms (acceptable)
- Parsing frontmatter: ~2ms per file (fast)
- Context injection: ~5ms (negligible)
- File moves: ~10ms (instant to user)

**Application to Extension:**
- No need for caching initially
- File watcher debouncing (500ms) prevents thrashing
- Load on-demand if > 500 items

### 9. User Workflow Patterns

**What We Learned:**
- Users create phases first, then tasks
- Most tasks start in queue
- Users edit context files early, then forget about them
- "Copy with context" would be used constantly (if it existed)

**Application to Extension:**
- Default new items to queue
- Make context editing prominent in setup
- Prioritize "copy with context" command

### 10. Error Scenarios

**What We Learned:**
- Users manually edit files (and break YAML)
- Users delete files outside the app
- Users rename files manually
- Hash collisions never happened (in testing)

**Application to Extension:**
- Validate frontmatter on every read
- Handle missing files gracefully
- Support manual file renames (re-scan on watch)
- Keep hash collision retry logic anyway

---

## Technical Decisions

### Decision 1: TypeScript Only (No JavaScript)

**Rationale:**
- VSCode extension API is complex (lots of types)
- DocFlow proved TypeScript catches 90% of bugs
- Zod + TS = bulletproof validation

**Trade-off:** Slower initial development, but faster debugging

---

### Decision 2: React for Webview UI

**Rationale:**
- DocFlow UI already uses React (reusable)
- dnd-kit is React-specific
- VSCode webview supports React well

**Alternative Considered:** Svelte (smaller bundle)
**Why Not:** Less familiar, would need to rebuild UI from scratch

---

### Decision 3: Keep DocFlow's 5-Stage System

**Rationale:**
- Backlog → In Progress → Review → Audit → Completed maps well to dev workflow
- Audit stage is useful for security/performance reviews
- Users can ignore stages they don't need

**Alternative Considered:** 3-stage (TODO/DOING/DONE)
**Why Not:** Less flexible, loses nuance

---

### Decision 4: File Watcher Over Polling

**Rationale:**
- VSCode's FileSystemWatcher is efficient
- Handles external edits automatically
- No CPU overhead from polling

**Trade-off:** Slight delay on network drives (acceptable)

---

### Decision 5: No Auto-Commit

**Rationale:**
- Users want control over git history
- Auto-commits pollute history with noise
- VSCode's git panel is already perfect

**Alternative Considered:** Optional auto-commit setting
**Why Not:** Complexity not worth it (users can commit manually)

---

### Decision 6: Webview + Tree View (Not Just One)

**Rationale:**
- Tree view: fast browsing, keyboard navigation
- Webview board: visual organization, drag-and-drop
- Different use cases = both valuable

**Trade-off:** More code to maintain, but better UX

---

### Decision 7: Clipboard-Based LLM Integration (No API Calls)

**Rationale:**
- User stays in control (pastes when ready)
- Works with any LLM (Claude, Codex, ChatGPT)
- No API keys or network calls needed

**Alternative Considered:** Direct Claude API integration
**Why Not:** Adds complexity, costs, and lock-in

---

## Risks and Mitigations

### Risk 1: Large Repositories (> 500 items)

**Problem:** Loading/parsing becomes slow
**Mitigation:** Add lazy loading, pagination, or index file

### Risk 2: Merge Conflicts in Markdown Files

**Problem:** Git merges can break YAML frontmatter
**Mitigation:** Document merge strategy, validate on load

### Risk 3: Extension Bundle Size

**Problem:** React + dnd-kit = large bundle
**Mitigation:** Code splitting, tree shaking, async imports

### Risk 4: Cross-Platform Path Issues

**Problem:** Windows vs. Unix path separators
**Mitigation:** Use `path.join()` and `path.sep` everywhere

### Risk 5: File Watcher Limits

**Problem:** Some systems limit number of watched files
**Mitigation:** Watch only `.llmkanban/` directory, not entire workspace

---

## Success Metrics

### Phase 1 Success Criteria
- Extension activates without errors
- Init command creates correct folder structure
- Core logic passes unit tests

### Phase 2 Success Criteria
- Tree view renders all tasks
- File changes trigger refresh within 1 second
- Click to open works reliably

### Phase 3 Success Criteria
- Create/move/delete commands work without errors
- Context injection preserves user content 100% of time
- Commands complete in < 500ms

### Phase 4 Success Criteria
- Drag-and-drop moves files correctly
- Webview updates in < 1 second after file changes
- Board handles 100+ items without lag

### Phase 5 Success Criteria
- Copy command works from editor + tree view
- Clipboard contains correct formatted content
- Users can paste into Claude Code successfully

### Overall Success Criteria
- Users can manage 50-200 tasks without issues
- Extension uses < 50MB memory
- No data loss (user content always preserved)
- Git diffs remain readable

---

## Next Steps

1. **Create Extension Repository**
   - Initialize npm project
   - Add dependencies (see Technology Stack)
   - Set up TypeScript + webpack configs

2. **Port Core Logic**
   - Copy `types.ts`, `fs-adapter.ts`, `parser.ts`, `context-injector.ts`, `validators.ts`
   - Adapt paths for `.llmkanban/`
   - Write unit tests

3. **Implement Phase 1**
   - Extension entry point
   - Init command
   - Workspace utilities

4. **Iterate Through Phases**
   - Build incrementally
   - Test each phase before moving on
   - Get user feedback early

---

## Appendices

### Appendix A: Example Stage Context (Backlog)

```markdown
# 🗂️ Backlog

This stage contains tasks and phases that are planned but not yet started.

## Purpose

- Capture ideas and requirements
- Prioritize upcoming work
- Provide visibility into the roadmap

## Guidelines

- Keep titles clear and actionable
- Add relevant tags for filtering
- Link dependencies if applicable
- Move to In Progress when ready to start

## When to Move

Move tasks to **In Progress** when:
- You're actively working on it
- Dependencies are resolved
- You have capacity to complete it
```

### Appendix B: Example Phase Context

```markdown
# 📦 Phase 1: Core MVP

## Overview

This phase focuses on building the foundational features required for the minimum viable product.

## Goals

- User authentication and authorization
- Basic CRUD operations for core entities
- Responsive UI with dark mode
- Database schema and migrations

## Success Criteria

- All core features functional
- Unit test coverage > 80%
- Performance benchmarks met
- Security audit passed

## Timeline

- **Start:** 2025-11-01
- **Target:** 2025-12-15
- **Duration:** 6 weeks

## Dependencies

- Design system finalized
- Database infrastructure provisioned
- API contracts defined

## Notes

This is the foundation for all future phases. Prioritize code quality and test coverage.
```

### Appendix C: VSCode Extension Manifest (package.json)

```json
{
  "name": "vscode-llm-kanban",
  "displayName": "LLM Kanban",
  "description": "File-based Kanban board for managing LLM-assisted development tasks",
  "version": "0.1.0",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Other",
    "Project Management"
  ],
  "activationEvents": [
    "workspaceContains:.llmkanban"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "llmkanban.init",
        "title": "LLM Kanban: Initialize Workspace"
      },
      {
        "command": "llmkanban.openBoard",
        "title": "LLM Kanban: Open Board",
        "icon": "$(kanban)"
      },
      {
        "command": "llmkanban.createTask",
        "title": "LLM Kanban: Create Task"
      },
      {
        "command": "llmkanban.createPhase",
        "title": "LLM Kanban: Create Phase"
      },
      {
        "command": "llmkanban.moveTask",
        "title": "LLM Kanban: Move Task"
      },
      {
        "command": "llmkanban.copyWithContext",
        "title": "LLM Kanban: Copy with Context"
      },
      {
        "command": "llmkanban.refreshBoard",
        "title": "LLM Kanban: Refresh Board",
        "icon": "$(refresh)"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "llmkanban",
          "title": "LLM Kanban",
          "icon": "$(checklist)"
        }
      ]
    },
    "views": {
      "llmkanban": [
        {
          "id": "llmkanban.treeView",
          "name": "Tasks"
        }
      ]
    },
    "menus": {
      "view/item/context": [
        {
          "command": "llmkanban.moveTask",
          "when": "view == llmkanban.treeView && viewItem == task"
        },
        {
          "command": "llmkanban.copyWithContext",
          "when": "view == llmkanban.treeView"
        }
      ],
      "editor/context": [
        {
          "command": "llmkanban.copyWithContext",
          "when": "resourcePath =~ /\\.llmkanban\\/.*\\.md$/"
        }
      ]
    },
    "configuration": {
      "title": "LLM Kanban",
      "properties": {
        "llmkanban.defaultStage": {
          "type": "string",
          "default": "queue",
          "enum": ["chat", "queue", "plan", "code", "audit", "completed"],
          "description": "Default stage for new tasks"
        },
        "llmkanban.enableFileWatcher": {
          "type": "boolean",
          "default": true,
          "description": "Enable automatic refresh on file changes"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "vsce package",
    "test": "jest"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vsce": "^2.15.0",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^9.0.0",
    "gray-matter": "^4.0.3",
    "zod": "^4.1.12",
    "date-fns": "^4.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

---

**End of Plan Document**

This document contains all necessary information to bootstrap the VSCode LLM Kanban extension project. Use it as a reference during implementation and update as needed based on learnings.
