# UI Components Implementation Plan

**Created**: 2025-11-20  
**Updated**: 2025-11-20  
**Status**: Specification Phase  
**Goal**: Build missing UI components to complete the LLM Kanban webview experience

---

## User Decisions Summary

### ✅ Confirmed Design Decisions

1. **Webview-First Approach** - All UI interactions happen in the webview
2. **Context Management Section** - Dedicated area to view and manage contexts (like architecture.md)
3. **Comprehensive Task Creation Form** - Single "+ Add Task" button opens full form with:
   - Agent selection
   - Context selection (multi-select dropdown)
   - Phase selection
   - Stage selection
   - Template selection
   - Tags
   - All metadata
4. **Click-to-Edit Tags** - Simple click interaction for tag editing
5. **Skeleton Loading + Error Popups** - Skeleton UI for loading, popup messages for errors
6. **Toast Notifications** - For success/info feedback
7. **Keyboard Shortcut for Add Task** - Quick access to task creation
8. **Copy Mode Selector** - UI to choose copy mode (full/context/user)
9. **Design System** - Glassmorphism, dark mode, modern, subtle animations
10. **No Token Counting UI** - User copies to external LLMs (Claude Code, Codex, Gemini)

---

## Phase Visualization Design

**Decision**: Phase Badge on Cards (Flat List)

### Implementation
Cards will display phase information as a badge in the header, maintaining a flat list structure within each column. This keeps the UI compact while clearly showing which phase each task belongs to.

**Visual Design**:
```
┌─────────────────────────────────────┐
│ 📋 QUEUE                        [3] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Phase 1: Auth] 🏷️ backend     │ │
│ │ Task 1: OAuth backend           │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Phase 1: Auth] 🏷️ ui           │ │
│ │ Task 2: Login UI                │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Phase 2: Dashboard] 🏷️ ui      │ │
│ │ Task 3: Layout design           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Benefits**:
- ✅ Compact layout - all tasks visible at once
- ✅ Clear phase identification on each card
- ✅ No additional UI complexity
- ✅ Works well with existing card design

**Implementation Details**:
- Phase badge appears in card header (left side)
- Badge uses subtle background color with glassmorphism
- Phase name is truncated if too long (with tooltip on hover)
- Tasks without phases show "No Phase" or no badge

---

## Existing Components (Already Built)
- ✅ `Modal.tsx` - Reusable modal wrapper
- ✅ `Button.tsx` - Button with variants (primary, secondary, destructive, ghost, icon)
- ✅ `Card.tsx` - Task card with inline editing, delete confirmation
- ✅ `ContextEditor.tsx` - Monaco editor for contexts
- ✅ `Board.tsx`, `Column.tsx`, `App.tsx` - Core board structure

---


## Component Specifications

### 1. Context Management Section

**Purpose**: Dedicated sidebar/panel to view and manage global contexts like `architecture.md`

**Location**: Left sidebar or collapsible panel in webview

**Features**:
- List all contexts (stages, phases, agents, custom)
- Click to edit in Monaco editor
- Add new context button
- Search/filter contexts
- Shows context type icons

**API**:
```typescript
interface ContextManagementProps {
  contexts: ContextMetadata[];
  onEdit: (contextId: string, type: ContextType) => void;
  onAdd: () => void;
  onRefresh: () => void;
}
```

**Visual Design**:
```
┌────────────────────────────┐
│ 📚 CONTEXTS            [+] │
├────────────────────────────┤
│ 🔍 Search contexts...      │
├────────────────────────────┤
│ 📁 Stages                  │
│   📄 chat.md               │
│   📄 plan.md               │
│   📄 code.md               │
│                            │
│ 📁 Phases                  │
│   📄 auth-phase1.md        │
│   📄 dashboard-phase2.md   │
│                            │
│ 📁 Agents                  │
│   🤖 coder.md              │
│   🤖 auditor.md            │
│                            │
│ 📁 Custom                  │
│   📄 architecture.md       │
│   📄 api-spec.md           │
└────────────────────────────┘
```

---

### 2. Task Creation Form (Modal)

**Trigger**: "+ Add Task" button (prominent, always visible)

**Keyboard Shortcut**: `Ctrl+Shift+N` or `Cmd+Shift+N`

**Form Fields**:
1. **Title** (required) - Text input
2. **Type** - Radio buttons: Task | Phase
3. **Stage** - Dropdown (chat, queue, plan, code, audit, completed)
4. **Phase** - Dropdown of existing phases + "Create New Phase" option
5. **Agent** - Dropdown of agents + "None" option
6. **Contexts** - Multi-select dropdown (grouped by type)
7. **Tags** - Tag input (comma-separated or chips)
8. **Template** - Dropdown of templates (optional)
9. **Initial Content** - Textarea (optional)

**Visual Design**:
```
┌──────────────────────────────────────────┐
│  Create New Item                    [×]  │
├──────────────────────────────────────────┤
│                                          │
│  Title *                                 │
│  ┌────────────────────────────────────┐  │
│  │ Implement OAuth backend            │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Type *                                  │
│  ( ) Task  (•) Phase                     │
│                                          │
│  Stage *                                 │
│  ┌────────────────────────────────────┐  │
│  │ Queue                           ▼  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Phase                                   │
│  ┌────────────────────────────────────┐  │
│  │ Auth - Phase 1                  ▼  │  │
│  │ + Create New Phase                 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Agent                                   │
│  ┌────────────────────────────────────┐  │
│  │ 🤖 Coder (GPT-4, temp: 0.2)    ▼  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Contexts (Select multiple)              │
│  ┌────────────────────────────────────┐  │
│  │ ☑ architecture.md                  │  │
│  │ ☑ code.md (stage context)          │  │
│  │ ☐ auth-phase1.md                   │  │
│  │ ☐ api-spec.md                   ▼  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Tags                                    │
│  ┌────────────────────────────────────┐  │
│  │ [backend ×] [oauth ×] [api ×]      │  │
│  │ Add tag...                         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Template (optional)                     │
│  ┌────────────────────────────────────┐  │
│  │ Backend Task Template           ▼  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Initial Content (optional)              │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │ Implement OAuth 2.0 flow...        │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Cancel]              [Create Task]     │
└──────────────────────────────────────────┘
```

**API**:
```typescript
interface TaskFormData {
  title: string;
  type: 'task' | 'phase';
  stage: Stage;
  phaseId?: string;
  agent?: string;
  contexts: string[];
  tags: string[];
  template?: string;
  initialContent?: string;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  defaultStage?: Stage;
}
```

---

### 3. Context Selector (Multi-Select Dropdown)

**Purpose**: Select multiple contexts when creating/editing items

**Features**:
- Grouped by type (Stages | Phases | Agents | Custom)
- Checkboxes for selection
- Search/filter
- Shows selected count
- Common contexts pre-selected (e.g., architecture.md)

**Visual Design**:
```
┌────────────────────────────────────┐
│ Contexts (3 selected)           ▼  │
├────────────────────────────────────┤
│ 🔍 Search contexts...              │
├────────────────────────────────────┤
│ 📁 Stages                          │
│   ☐ chat.md                        │
│   ☑ code.md                        │
│   ☐ plan.md                        │
│                                    │
│ 📁 Phases                          │
│   ☑ auth-phase1.md                 │
│   ☐ dashboard-phase2.md            │
│                                    │
│ 📁 Agents                          │
│   ☐ coder.md                       │
│   ☐ auditor.md                     │
│                                    │
│ 📁 Custom                          │
│   ☑ architecture.md                │
│   ☐ api-spec.md                    │
└────────────────────────────────────┘
```

**API**:
```typescript
interface ContextSelectorProps {
  contexts: ContextMetadata[];
  selected: string[];
  onChange: (selected: string[]) => void;
  grouped?: boolean; // Group by type
}
```

---

### 4. Agent Dropdown

**Purpose**: Select agent for task

**Features**:
- Shows agent name + model + temperature
- "None" option for tasks without agents
- Search/filter for large lists

**Visual Design**:
```
┌────────────────────────────────────┐
│ Agent                           ▼  │
├────────────────────────────────────┤
│ ⊘ None                             │
│ 🤖 Coder (GPT-4, temp: 0.2)        │
│ 🤖 Auditor (GPT-4, temp: 0.0)      │
│ 🤖 Planner (GPT-4, temp: 0.7)      │
│ 🤖 Researcher (Claude, temp: 0.5)  │
└────────────────────────────────────┘
```

**API**:
```typescript
interface AgentDropdownProps {
  agents: Agent[];
  selected?: string;
  onChange: (agentId: string | null) => void;
  allowNone?: boolean;
}
```

---

### 5. Tag Editor (Click-to-Edit)

**Purpose**: Edit tags inline on cards or in forms

**Interaction**:
- Click tag to remove (shows × on hover)
- Type in input to add new tag
- Enter or comma to confirm
- Autocomplete from existing tags

**Visual Design**:
```
Tags: [backend ×] [oauth ×] [api ×] [Add tag...]
      ↑ Click × to remove    ↑ Click to add
```

**API**:
```typescript
interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[]; // For autocomplete
  maxTags?: number;
}
```

---

### 6. Skeleton Loading States

**Purpose**: Show loading placeholders during async operations

**Usage**:
- Loading board data
- Creating/updating items
- Loading contexts

**Visual Design**:
```
┌─────────────────────────────────────┐
│ 📋 QUEUE                        [3] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ │ ← Shimmer effect
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**API**:
```typescript
interface SkeletonCardProps {
  count?: number; // Number of skeleton cards
}
```

---

### 7. Error Popup (Modal)

**Purpose**: Display error messages when operations fail

**Features**:
- Clear error message
- Optional details (expandable)
- Retry button (if applicable)
- Close button

**Visual Design**:
```
┌──────────────────────────────────┐
│  ⚠️  Error                  [×]  │
├──────────────────────────────────┤
│                                  │
│  Failed to create task           │
│                                  │
│  The file already exists at      │
│  queue.task-123.md               │
│                                  │
│  [Show Details ▼]                │
│                                  │
│  [Retry]              [Close]    │
└──────────────────────────────────┘
```

**API**:
```typescript
interface ErrorPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onClose: () => void;
}
```

---

### 8. Toast Notifications

**Purpose**: Non-blocking feedback for successful operations

**Position**: Bottom-right corner

**Types**: Success, Info, Warning

**Auto-dismiss**: 3-4 seconds

**Visual Design**:
```
┌────────────────────────────────┐
│ ✅ Task created successfully   │
│    "Implement OAuth backend"   │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 📋 Copied 2,450 characters     │
│    Full context mode           │
└────────────────────────────────┘

┌────────────────────────────────┐
│ ⚠️  Task moved to Code stage   │
│    Context updated             │
└────────────────────────────────┘
```

**API**:
```typescript
interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number; // ms
}

interface ToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}
```

---

### 9. Copy Mode Selector

**Purpose**: Choose what to copy (full context, context only, user content only)

**Location**: Dropdown next to copy button on card

**Visual Design**:
```
Card Actions:
[📋 Copy ▼] [✏️ Edit] [🗑️ Delete]
     ↓
┌──────────────────────────┐
│ 📄 Copy Full Context     │ ← Task + Architecture + Phase + Stage
│ 🔗 Copy Context Only     │ ← Architecture + Phase + Stage
│ ✍️  Copy User Content    │ ← Just user-written content
└──────────────────────────┘
```

**API**:
```typescript
type CopyMode = 'full' | 'context' | 'user';

interface CopyButtonProps {
  itemId: string;
  onCopy: (itemId: string, mode: CopyMode) => void;
}
```

---

### 10. "+ Add Task" Button

**Location**: Prominent position (top-right of board or floating)

**Keyboard Shortcut**: `Ctrl+Shift+N` / `Cmd+Shift+N`

**Action**: Opens Task Creation Form modal

**Visual Design**:
```
Option A: Top-right of board
┌────────────────────────────────────────┐
│  LLM Kanban Board      [+ Add Task]    │ ← Always visible
├────────────────────────────────────────┤
│  [Chat] [Queue] [Plan] [Code] [Audit]  │
└────────────────────────────────────────┘

Option B: Floating Action Button
┌────────────────────────────────────────┐
│  LLM Kanban Board                      │
├────────────────────────────────────────┤
│  [Chat] [Queue] [Plan] [Code] [Audit]  │
│                                        │
│                                   ┌──┐ │
│                                   │ +│ │ ← Floating
│                                   └──┘ │
└────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Core Functionality (Must Have)
1. **Task Creation Form** - Essential for CRUD
2. **Context Selector** - Required for task creation
3. **Agent Dropdown** - Required for task creation
4. **"+ Add Task" Button** - Entry point for creation
5. **Error Popup** - User feedback for failures

### Phase 2: Enhanced UX (Should Have)
6. **Toast Notifications** - Better feedback
7. **Skeleton Loading** - Better perceived performance
8. **Tag Editor** - Complete inline editing
9. **Copy Mode Selector** - Enhanced copy functionality

### Phase 3: Advanced Features (Nice to Have)
10. **Context Management Section** - Advanced context management
11. **Keyboard Shortcuts** - Power user features
12. **Phase Visualization** - Better organization (after you choose option)

---

## Next Steps

1. **Choose Phase Visualization**: Pick one of the 5 options (A-E) or suggest a combination
2. **Review Specifications**: Any changes to the component designs?
3. **Confirm Priority**: Agree on implementation order?
4. **Start Building**: I'll create the components in priority order

Let me know your thoughts! 🚀

### 1. **Create Task/Phase Modal Design**

**Context**: Users need to create tasks and phases from the webview (currently only possible via command palette).

**Questions**:
- **Q1.1**: Should the modal open when clicking a "+" button on column headers, or would you prefer a floating action button (FAB) in the corner?
- **Q1.2**: For task creation, which fields should be **required** vs **optional**?
  - Title (required?)
  - Stage (pre-filled from column clicked?)
  - Phase (dropdown of existing phases?)
  - Agent (dropdown, optional?)
  - Contexts (multi-select, optional?)
  - Tags (comma-separated or tag chips?)
  - Initial content (textarea, optional?)
- **Q1.3**: Should there be separate modals for "Create Task" vs "Create Phase", or one unified "Create Item" modal with a type selector?
- **Q1.4**: When creating a task, should users be able to create a NEW phase on-the-fly, or only select from existing phases?

### 2. **Context Selector UI**

**Context**: When creating/editing items, users need to select which contexts to attach (stage contexts, phase contexts, agent contexts, custom contexts).

**Questions**:
- **Q2.1**: Should contexts be grouped by type (Stages | Phases | Agents | Custom) in the selector?
- **Q2.2**: What interaction pattern do you prefer?
  - **Option A**: Dropdown with checkboxes (click to open, check multiple, click outside to close)
  - **Option B**: Multi-select list (like VS Code's quick pick)
  - **Option C**: Tag-style chips with a search/add input
- **Q2.3**: Should the selector show context **metadata** (file size, token estimate) to help users decide?
- **Q2.4**: Should there be a "Preview" button to quickly view context content before selecting?

### 3. **Agent Dropdown**

**Context**: Users need to assign an agent to tasks (e.g., "coder", "auditor", "planner").

**Questions**:
- **Q3.1**: Should the dropdown show:
  - Just agent name?
  - Agent name + description?
  - Agent name + model + temperature?
- **Q3.2**: Should there be a "None" option (tasks without agents)?
- **Q3.3**: Should users be able to create a new agent directly from the dropdown, or should that be a separate flow?
- **Q3.4**: Should the dropdown have a search/filter for large agent lists?

### 4. **Tag Input/Editor**

**Context**: Tags are currently displayed on cards but not editable inline.

**Questions**:
- **Q4.1**: What interaction do you prefer for editing tags?
  - **Option A**: Click tag to remove, type to add (like GitHub labels)
  - **Option B**: Inline contenteditable with comma separation
  - **Option C**: Dedicated tag editor modal
- **Q4.2**: Should there be **tag autocomplete** based on existing tags in the workspace?
- **Q4.3**: Should tags have **colors** (auto-assigned or user-chosen)?
- **Q4.4**: Should clicking a tag **filter** the board to show only items with that tag?

### 5. **Loading & Error States**

**Context**: Currently no visual feedback during async operations (create, move, delete).

**Questions**:
- **Q5.1**: For loading states, what style do you prefer?
  - **Option A**: Spinner overlay on the entire board
  - **Option B**: Spinner on the specific card/column being modified
  - **Option C**: Subtle loading bar at top of webview
  - **Option D**: Skeleton UI (card placeholders)
- **Q5.2**: For errors, what do you prefer?
  - **Option A**: Toast notification (auto-dismiss after 5s)
  - **Option B**: Modal dialog (requires user to click "OK")
  - **Option C**: Inline error message on the card/form
- **Q5.3**: Should there be **optimistic updates** (UI updates immediately, then rolls back if operation fails)?

### 6. **Toast Notifications**

**Context**: Need non-blocking feedback for actions (copy, create, delete, move).

**Questions**:
- **Q6.1**: Where should toasts appear?
  - Top-right corner?
  - Bottom-right corner?
  - Top-center?
- **Q6.2**: Should toasts have **action buttons** (e.g., "Undo" for delete, "View" for create)?
- **Q6.3**: How long should toasts stay visible?
  - Success: 3 seconds?
  - Error: 5 seconds (or until dismissed)?
  - Info: 4 seconds?
- **Q6.4**: Should there be different toast **types** (success, error, warning, info) with different colors/icons?

### 7. **Per-Column Add Buttons**

**Context**: Quick way to add items directly to a specific stage.

**Questions**:
- **Q7.1**: Where should the "+" button be positioned?
  - **Option A**: Column header (next to title and count badge)
  - **Option B**: Bottom of each column (after all cards)
  - **Option C**: Both locations
- **Q7.2**: Should clicking "+" open the Create modal with the stage pre-filled?
- **Q7.3**: Should there be a **keyboard shortcut** for quick add (e.g., `Ctrl+N` when focused on a column)?

### 8. **Copy Mode Selector**

**Context**: Currently copy button exists but no UI to choose mode (full, context, user).

**Questions**:
- **Q8.1**: How should users select copy mode?
  - **Option A**: Dropdown next to copy button (click to choose mode)
  - **Option B**: Right-click context menu on card
  - **Option C**: Separate buttons for each mode (Copy Full | Copy Context | Copy User)
  - **Option D**: Hold Shift/Ctrl while clicking copy to change mode
- **Q8.2**: Should the selected mode be **remembered** per session or per card?
- **Q8.3**: Should the toast notification show **what was copied** (e.g., "Copied 2,450 characters (Full Context)")?

### 9. **Keyboard Shortcuts & Accessibility**

**Questions**:
- **Q9.1**: Which keyboard shortcuts are most important to you?
  - `Ctrl+N` - Create new task?
  - `Ctrl+E` - Edit selected card?
  - `Delete` - Delete selected card?
  - `Ctrl+C` - Copy with context?
  - Arrow keys - Navigate between cards?
  - `Enter` - Open card in editor?
- **Q9.2**: Should there be a **keyboard shortcut cheat sheet** (e.g., press `?` to show)?
- **Q9.3**: Should focus be **visible** (outline on focused card)?

### 10. **Token Counting Integration**

**Context**: We now have token counting utilities, but need to integrate them into the UI.

**Questions**:
- **Q10.1**: Where should token counts be displayed?
  - In the context editor (bottom status bar)?
  - In the create/edit modal (below content textarea)?
  - On the card itself (as a badge)?
- **Q10.2**: Should there be **warnings** when context size exceeds limits?
  - Visual indicator (yellow/red badge)?
  - Prevent saving if too large?
  - Just show warning but allow save?
- **Q10.3**: Should token counts be shown for:
  - Individual contexts?
  - Total assembled context (task + architecture + phase + stage)?
  - Both?

### 11. **Phase Management**

**Questions**:
- **Q11.1**: Should phases be **visually grouped** on the board (e.g., cards grouped by phase within each column)?
- **Q11.2**: Should there be a **phase filter** dropdown to show only tasks from a specific phase?
- **Q11.3**: Should phase cards have a **different visual style** than task cards (e.g., different color, icon)?
- **Q11.4**: Should users be able to **collapse/expand** phases to hide/show their tasks?

### 12. **Design System Preferences**

**Questions**:
- **Q12.1**: Should we maintain the **glassmorphism** aesthetic for all new components?
- **Q12.2**: What's your preferred **color scheme** for semantic states?
  - Success: Green?
  - Error: Red?
  - Warning: Yellow/Orange?
  - Info: Blue?
- **Q12.3**: Should animations be **subtle** (current style) or more **pronounced**?
- **Q12.4**: Should there be a **dark mode toggle**, or always use the current dark theme?

---

## Your Turn!

Please answer the questions above (you can just reference the question number, e.g., "Q1.1: Option A"). Feel free to:
- Skip questions where you trust my judgment
- Add additional requirements I didn't think of
- Provide mockups or examples if you have specific designs in mind
- Prioritize which components to build first

Once I have your answers, I'll create detailed component specifications with:
- Component API (props, events)
- Visual design (mockups/descriptions)
- Interaction patterns
- Implementation approach
- Integration points with existing code

Let's make this UI amazing! 🚀
