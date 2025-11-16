# Visual Interface Design Specification

**Created:** 2025-11-16
**Project:** VSCode LLM Kanban Extension
**Phase:** Phase 1, Step 2 - Design Visual Interface
**Version:** 1.0

---

## Table of Contents

1. [Design Overview](#design-overview)
2. [Kanban Board Layout](#kanban-board-layout)
3. [Card Component Design](#card-component-design)
4. [Color Scheme & Theming](#color-scheme--theming)
5. [Sidebar Tree View](#sidebar-tree-view)
6. [Empty States & Loading](#empty-states--loading)
7. [Interactive States](#interactive-states)
8. [Typography & Spacing](#typography--spacing)
9. [Responsive Behavior](#responsive-behavior)
10. [Accessibility Considerations](#accessibility-considerations)

---

## Design Overview

### Design Philosophy

**Principle 1: Information Density**
- Users manage 50-200 tasks; UI must show many items without clutter
- Use compact cards with expandable details
- Minimize whitespace while maintaining readability

**Principle 2: Instant Feedback**
- All interactions provide immediate visual confirmation
- Optimistic UI updates before file operations complete
- Clear loading states for async operations

**Principle 3: Context Awareness**
- Visual hierarchy distinguishes phases from tasks
- Color coding reveals stage at a glance
- Badges surface critical metadata

**Principle 4: VSCode Native Feel**
- Use VSCode's codicons icon set
- Follow VSCode design patterns and conventions
- Respect user's theme settings (dark/light mode)

---

## Kanban Board Layout

### Board Structure

The board displays **6 columns** representing the workflow stages:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  KANBAN BOARD                                          [⚙] [↻] [✕]     │
├─────────────────────────────────────────────────────────────────────────┤
│  [🔍 Search...]  [🏷️ Filter: All] [↕️ Sort: Updated]  [+ New Task]    │
├──────┬──────┬──────┬──────┬──────┬──────────────────────────────────────┤
│Chats │Plan  │Queue │Coding│Audit │Completed                            │
│  (2) │  (3) │  (5) │  (4) │  (2) │  (12)                               │
├──────┼──────┼──────┼──────┼──────┼──────────────────────────────────────┤
│      │      │      │      │      │                                      │
│ 💬   │ 📋   │ 📦   │ 💻   │ 🔍   │ ✅                                   │
│Card 1│Card 1│Card 1│Card 1│Card 1│Card 1                                │
│      │      │      │      │      │                                      │
│ 💬   │ 📋   │ 📦   │ 💻   │ 🔍   │ ✅                                   │
│Card 2│Card 2│Card 2│Card 2│Card 2│Card 2                                │
│      │      │      │      │      │                                      │
│      │      │      │      │      │                                      │
│      │      │      │      │      │                                      │
└──────┴──────┴──────┴──────┴──────┴──────────────────────────────────────┘
```

### Column Specifications

#### Column 1: Chats (ai-spark)
- **Purpose:** Initial ideation conversations with ai-spark agent
- **Icon:** 💬 (codicon: comment-discussion)
- **Color:** Purple (#9665C0)
- **Max Width:** 280px
- **Items:** Phase or task files in `_context/chats/`

#### Column 2: Planning
- **Purpose:** Plans being developed by planning agent
- **Icon:** 📋 (codicon: file-text)
- **Color:** Blue (#458AC7)
- **Max Width:** 280px
- **Items:** Files in `_context/planning/`

#### Column 3: Queue
- **Purpose:** Tasks ready to be handed to coding agent
- **Icon:** 📦 (codicon: inbox)
- **Color:** Orange (#D18616)
- **Max Width:** 280px
- **Items:** Files in `_context/queue/`

#### Column 4: Coding
- **Purpose:** Tasks being actively implemented
- **Icon:** 💻 (codicon: code)
- **Color:** Green (#4C9A2A)
- **Max Width:** 280px
- **Items:** Files in `_context/coding/`

#### Column 5: Auditing
- **Purpose:** Tasks under review by auditing agent
- **Icon:** 🔍 (codicon: search)
- **Color:** Teal (#0E7C7B)
- **Max Width:** 280px
- **Items:** Files in `_context/auditing/`

#### Column 6: Completed
- **Purpose:** Finished tasks
- **Icon:** ✅ (codicon: check)
- **Color:** Gray (#6C757D)
- **Max Width:** 280px
- **Items:** Files in `_context/completed/`

### Board Header Controls

**Left Side:**
- Search input with icon (🔍)
- Filter dropdown (by tag, by phase, by type)
- Sort dropdown (by updated, by created, by title)

**Right Side:**
- "+ New Task" button (primary action)
- Refresh button (↻)
- Settings button (⚙️)
- Close button (✕)

### Drag-and-Drop Behavior

**Visual Feedback:**
- **On drag start:** Card becomes semi-transparent (opacity: 0.6)
- **During drag:** Show drag preview with card shadow
- **Drop zones:** Highlight column with dashed border when hovering
- **Valid drop:** Green border (#4C9A2A)
- **Invalid drop:** Red border (#D9534F)
- **On drop:** Smooth animation to final position (300ms ease-out)

**Constraints:**
- Can only drop in valid stage columns
- Cannot drop on self (same position)
- Show cursor: grab (when hovering), grabbing (when dragging)

---

## Card Component Design

### Card Anatomy

```
┌────────────────────────────────────┐
│ [Phase Icon] Phase Title       [⋮] │ ← Header (phase only)
├────────────────────────────────────┤
│ 📄 Task Title                      │ ← Title with icon
│                                     │
│ [tag1] [tag2] [backend]            │ ← Tags
│                                     │
│ Updated: 2 hours ago               │ ← Metadata
│ ID: phase1-task3-navbar-auth       │
└────────────────────────────────────┘
```

### Phase Card

**Visual Distinction:**
- **Border:** Thicker border (2px vs 1px)
- **Background:** Slightly darker/lighter (depending on theme)
- **Icon:** 📦 (codicon: package)
- **Title:** Bold font weight (600)
- **Padding:** 12px (vs 8px for tasks)

**Content:**
- Phase title (e.g., "Navbar - Phase 1: UI/UX")
- Tags (if any)
- Metadata: Created date, task count
- Context menu button (⋮)

**Expandable:**
- Click to expand/collapse child tasks
- Show task count badge: `(5 tasks)`
- Indented task list when expanded

### Task Card

**Visual Distinction:**
- **Border:** 1px solid
- **Background:** Theme default
- **Icon:** 📄 (codicon: file)
- **Title:** Normal font weight (400)
- **Padding:** 8px

**Content:**
- Task title
- Parent phase badge (if linked to phase)
- Tags (max 3 visible, "+2 more" if exceeds)
- Metadata row:
  - Updated timestamp (relative: "2 hours ago")
  - ID (truncated: shows first 20 chars with "...")

**Hover State:**
- Show full title in tooltip if truncated
- Highlight border with stage color
- Show quick actions: [Copy] [Edit] [Move] [Delete]

### Card States

#### Default State
- Border: 1px solid var(--vscode-panel-border)
- Background: var(--vscode-editor-background)
- Shadow: none

#### Hover State
- Border: 1px solid [stage-color]
- Background: var(--vscode-list-hoverBackground)
- Shadow: 0 2px 8px rgba(0,0,0,0.15)
- Show quick action buttons

#### Selected State
- Border: 2px solid var(--vscode-focusBorder)
- Background: var(--vscode-list-activeSelectionBackground)
- Show checkmark in top-right corner

#### Dragging State
- Opacity: 0.6
- Cursor: grabbing
- Shadow: 0 4px 12px rgba(0,0,0,0.25)

#### Disabled State
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects

### Tag Badges

**Design:**
- Rounded rectangle (border-radius: 3px)
- Font size: 11px
- Padding: 2px 6px
- Max width: 80px (truncate with "...")

**Colors (based on tag name hash):**
- Backend: Orange (#D18616)
- Frontend: Blue (#458AC7)
- Auth: Purple (#9665C0)
- UI/UX: Pink (#C9699E)
- Testing: Green (#4C9A2A)
- Default: Gray (#6C757D)

**Interaction:**
- Click tag to filter board by that tag
- Hover shows full tag name if truncated

---

## Color Scheme & Theming

### Stage Colors

| Stage | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Chats | #9665C0 | #B794F4 | Column header, borders, badges |
| Planning | #458AC7 | #63B3ED | Column header, borders, badges |
| Queue | #D18616 | #F6AD55 | Column header, borders, badges |
| Coding | #4C9A2A | #68D391 | Column header, borders, badges |
| Auditing | #0E7C7B | #4FD1C5 | Column header, borders, badges |
| Completed | #6C757D | #A0AEC0 | Column header, borders, badges |

### VSCode Theme Variables

**Backgrounds:**
- `var(--vscode-editor-background)` - Main board background
- `var(--vscode-sideBar-background)` - Column backgrounds
- `var(--vscode-panel-background)` - Card backgrounds

**Borders:**
- `var(--vscode-panel-border)` - Default borders
- `var(--vscode-focusBorder)` - Focus/active borders
- `var(--vscode-input-border)` - Input field borders

**Text:**
- `var(--vscode-editor-foreground)` - Primary text
- `var(--vscode-descriptionForeground)` - Secondary text (metadata)
- `var(--vscode-input-placeholderForeground)` - Placeholders

**Interactive Elements:**
- `var(--vscode-button-background)` - Primary buttons
- `var(--vscode-button-hoverBackground)` - Button hover
- `var(--vscode-list-hoverBackground)` - Item hover
- `var(--vscode-list-activeSelectionBackground)` - Selected items

### Dark Mode Adjustments

- **Shadows:** More prominent in dark mode (use lighter shadows)
- **Borders:** Slightly lighter in dark mode for visibility
- **Stage colors:** Use lighter/more saturated variants
- **Hover states:** Increase brightness delta

### Accessibility Colors

- **Error:** #D9534F (red)
- **Warning:** #F0AD4E (yellow)
- **Success:** #5CB85C (green)
- **Info:** #5BC0DE (light blue)

**Contrast Ratios:**
- Text on background: Minimum 4.5:1
- UI controls: Minimum 3:1
- Stage colors vs white text: Minimum 4.5:1

---

## Sidebar Tree View

### Tree Structure

```
LLM KANBAN                                [↻] [⚙️]
├─ 💬 Chats (2)
│  ├─ 💬 Navbar brainstorming
│  └─ 💬 Auth flow discussion
├─ 📋 Planning (3)
│  ├─ 📋 Main project plan
│  ├─ 📦 Navbar - Phase 1: UI/UX
│  └─ 📦 Navbar - Phase 2: Auth
├─ 📦 Queue (5)
│  ├─ 📦 Navbar - Phase 1: UI/UX (3)
│  │  ├─ 📄 Design navbar layout
│  │  ├─ 📄 Implement responsive design
│  │  └─ 📄 Add animations
│  └─ 📄 Standalone task
├─ 💻 Coding (4)
│  └─ 📄 Implement OAuth backend
├─ 🔍 Auditing (2)
│  └─ 📄 Review navbar layout
└─ ✅ Completed (12)
   └─ [collapsed]
```

### Tree Item Design

**Stage Header:**
- Icon + Label + Count badge
- Bold font
- Click to expand/collapse all items in stage
- Right-click for stage context menu

**Phase Item:**
- 📦 icon (codicon: package)
- Phase title
- Task count badge in parentheses: `(3)`
- Bold font weight
- Expandable/collapsible
- Shows child tasks when expanded

**Task Item:**
- 📄 icon (codicon: file)
- Task title
- Normal font weight
- Indented under parent phase (if applicable)
- Shows phase badge if linked

**Indentation:**
- Stage: 0px
- Phase: 8px
- Task (no parent): 8px
- Task (under phase): 16px

### Context Menu Options

**Stage Context Menu:**
- "Create New Task in [Stage]"
- "Create New Phase in [Stage]"
- "Refresh Stage"

**Phase Context Menu:**
- "Create Task in This Phase"
- "Edit Phase Context"
- "Copy Phase with Context"
- "Move Phase to..."
- "Delete Phase"

**Task Context Menu:**
- "Open File"
- "Copy with Context" (submenu: Full / Partial / Content Only)
- "Move to Stage" (submenu: stages list)
- "Link to Phase" (submenu: phases list)
- "Delete Task"

### Tree View Interactions

**Click:**
- Stage header: Expand/collapse
- Phase: Expand/collapse child tasks
- Task: Open file in editor

**Right-click:**
- Show context menu for item type

**Drag:**
- Tasks can be dragged to reorder or move between stages
- Phases can be dragged to reorder within stage

**Keyboard:**
- Arrow keys: Navigate tree
- Enter: Open file
- Space: Expand/collapse
- Delete: Delete selected item (with confirmation)

---

## Empty States & Loading

### Empty Column State

**Visual:**
```
┌────────────────────────────────┐
│                                │
│                                │
│         📭                     │
│                                │
│   No items in this stage      │
│                                │
│   [+ Create Task]              │
│                                │
│                                │
└────────────────────────────────┘
```

**Elements:**
- Large icon (48px, low opacity)
- Centered text: "No items in [Stage Name]"
- Primary action button
- Min height: 200px

### Empty Board State

**When no .llmkanban folder exists:**
```
┌─────────────────────────────────────────┐
│                                          │
│            📋 LLM Kanban                 │
│                                          │
│   Get started by initializing your      │
│   workspace with the LLM Kanban system  │
│                                          │
│   [Initialize Workspace]                │
│                                          │
│   Or open an existing workspace folder  │
│                                          │
└─────────────────────────────────────────┘
```

### Loading States

#### Board Loading (Initial)
- Full-screen spinner with text: "Loading board..."
- Duration estimate: "This may take a few seconds"

#### Column Loading (Refresh)
- Skeleton cards (3 per column)
- Pulsing animation
- Preserves layout to prevent jump

#### Card Loading (Optimistic Update)
- Show card immediately with loading indicator
- Dim slightly (opacity: 0.7)
- Small spinner in corner
- Replace with actual data when loaded

### Skeleton Card Design

```
┌────────────────────────────────┐
│ ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮               │ ← Title (animated bar)
│                                │
│ ▮▮▮▮ ▮▮▮▮                     │ ← Tags
│                                │
│ ▮▮▮▮▮▮▮▮▮▮▮                   │ ← Metadata
└────────────────────────────────┘
```

**Animation:**
- Gradient shimmer from left to right
- Duration: 1.5s
- Infinite loop
- CSS: `background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`

### Error States

#### Board Load Error
```
┌─────────────────────────────────────────┐
│                                          │
│            ⚠️ Error                      │
│                                          │
│   Failed to load kanban board            │
│                                          │
│   Error: Could not read _context folder │
│                                          │
│   [Retry] [View Logs]                   │
│                                          │
└─────────────────────────────────────────┘
```

#### Card Action Error
- Toast notification (bottom-right)
- Error icon + message
- Auto-dismiss after 5 seconds
- Example: "Failed to move task: File is read-only"

---

## Interactive States

### Button States

#### Primary Button ("[+ New Task]")
- **Default:** Background: var(--vscode-button-background)
- **Hover:** Background: var(--vscode-button-hoverBackground)
- **Active:** Background: darker by 10%
- **Disabled:** Opacity: 0.5, cursor: not-allowed
- **Focus:** Outline: 2px solid var(--vscode-focusBorder)

#### Secondary Button ("[Refresh]")
- **Default:** Border: 1px solid var(--vscode-button-border)
- **Hover:** Background: var(--vscode-button-secondaryHoverBackground)
- **Active:** Border color: var(--vscode-focusBorder)

### Drag-and-Drop States

#### Draggable Item
- **Idle:** Cursor: grab
- **Hover:** Cursor: grab, highlight border
- **Dragging:** Cursor: grabbing, opacity: 0.6

#### Drop Zone (Column)
- **Idle:** No special styling
- **Drag Over (Valid):** Dashed border: 2px dashed #4C9A2A
- **Drag Over (Invalid):** Dashed border: 2px dashed #D9534F

### Input States

#### Search Input
- **Default:** Border: var(--vscode-input-border)
- **Focus:** Border: var(--vscode-focusBorder)
- **Active (typing):** Show clear button (✕)
- **Error:** Border: #D9534F

### Dropdown States

#### Filter/Sort Dropdown
- **Closed:** Show selected value + chevron (⌄)
- **Open:** Dropdown menu overlay with options
- **Option Hover:** Background: var(--vscode-list-hoverBackground)
- **Option Selected:** Background: var(--vscode-list-activeSelectionBackground)

---

## Typography & Spacing

### Font Specifications

#### Font Families
- **Primary:** var(--vscode-font-family) [typically "Segoe UI", system-ui]
- **Monospace:** var(--vscode-editor-font-family) [for IDs and code]

#### Font Sizes
- **Board Title:** 18px (1.125rem)
- **Column Header:** 14px (0.875rem), bold
- **Card Title (Phase):** 14px (0.875rem), bold
- **Card Title (Task):** 13px (0.8125rem), normal
- **Tags:** 11px (0.6875rem)
- **Metadata:** 11px (0.6875rem)
- **Buttons:** 13px (0.8125rem)
- **Empty State Title:** 16px (1rem)
- **Empty State Text:** 13px (0.8125rem)

#### Line Heights
- **Headings:** 1.2
- **Body Text:** 1.5
- **Compact (tags, metadata):** 1.3

### Spacing System

**Base Unit:** 4px

**Spacing Scale:**
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 24px
- `2xl`: 32px

#### Component Spacing

**Card Padding:**
- Phase card: 12px (md)
- Task card: 8px (sm)

**Card Margins:**
- Between cards: 8px (sm)
- Column padding: 12px (md)

**Button Padding:**
- Small: 4px 8px
- Medium: 6px 12px
- Large: 8px 16px

**Board Layout:**
- Header padding: 16px (lg)
- Column gaps: 12px (md)
- Board outer padding: 16px (lg)

---

## Responsive Behavior

### Viewport Breakpoints

**Large (>1200px):**
- Show all 6 columns side-by-side
- Column width: 280px each
- Horizontal scroll if needed

**Medium (800px - 1200px):**
- Show all 6 columns
- Column width: flexible (min 240px)
- Horizontal scroll required

**Small (<800px):**
- Show 3 columns at a time
- Column width: 280px
- Horizontal scroll
- Sticky column headers

### Column Overflow

**Vertical Scrolling:**
- Each column independently scrollable
- Max height: calc(100vh - 200px)
- Scrollbar: Auto (show only when needed)
- Sticky column header on scroll

**Horizontal Scrolling:**
- Board container scrolls horizontally
- Scroll shadows to indicate more content
- Smooth scroll behavior

### Content Truncation

**Task Titles:**
- Max width: 100% of card
- Text overflow: ellipsis
- Max lines: 2
- Hover tooltip shows full title

**Tags:**
- Show max 3 tags
- "+N more" badge if exceeds
- Click "+N more" to expand all

**IDs:**
- Show first 20 characters
- Truncate with "..."
- Click to copy full ID

---

## Accessibility Considerations

### Keyboard Navigation

**Tab Order:**
1. Board header controls (search, filters, buttons)
2. Columns (left to right)
3. Cards within columns (top to bottom)
4. Card action buttons

**Keyboard Shortcuts:**
- `Ctrl/Cmd + N`: Create new task
- `Ctrl/Cmd + F`: Focus search
- `Enter`: Open selected card
- `Space`: Select/deselect card
- `Delete`: Delete selected card (with confirmation)
- `Ctrl/Cmd + C`: Copy selected card with context
- `Arrow Keys`: Navigate between cards
- `Tab`: Next focusable element
- `Shift + Tab`: Previous focusable element

### Screen Reader Support

**ARIA Labels:**
- Board: `role="region" aria-label="Kanban Board"`
- Columns: `role="list" aria-label="[Stage Name] (N items)"`
- Cards: `role="listitem" aria-label="[Type]: [Title]"`
- Drag handles: `aria-label="Drag to move item"`
- Buttons: Clear, descriptive labels

**Live Regions:**
- Announce when cards are moved: `aria-live="polite"`
- Announce when cards are created/deleted: `aria-live="polite"`
- Error messages: `aria-live="assertive"`

**Focus Management:**
- Visible focus indicators (2px outline)
- Focus trap in modals
- Return focus after modal close
- Maintain focus position on refresh

### Color Contrast

**WCAG AA Compliance:**
- Text on background: Minimum 4.5:1
- Large text (18px+): Minimum 3:1
- UI controls: Minimum 3:1

**High Contrast Mode:**
- Detect: `window.matchMedia('(prefers-contrast: high)')`
- Increase border thickness to 2px
- Remove subtle shadows
- Use solid colors only

### Motion Reduction

**Detect:** `window.matchMedia('(prefers-reduced-motion: reduce)')`

**When enabled:**
- Disable drag animations
- Disable skeleton shimmer
- Disable card movement transitions
- Use instant state changes
- Keep essential visual feedback (e.g., focus indicators)

---

## Design Tokens (CSS Variables)

```css
:root {
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;

  /* Stage Colors */
  --stage-chats: #9665C0;
  --stage-planning: #458AC7;
  --stage-queue: #D18616;
  --stage-coding: #4C9A2A;
  --stage-auditing: #0E7C7B;
  --stage-completed: #6C757D;

  /* Card Dimensions */
  --card-width: 280px;
  --card-padding-task: 8px;
  --card-padding-phase: 12px;
  --card-border-radius: 4px;
  --card-border-width: 1px;

  /* Typography */
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 300ms ease-out;
  --transition-slow: 500ms ease-out;

  /* Z-index layers */
  --z-card: 1;
  --z-card-dragging: 100;
  --z-dropdown: 200;
  --z-modal: 1000;
  --z-toast: 2000;
}

/* Dark Mode Overrides */
.vscode-dark {
  --stage-chats: #B794F4;
  --stage-planning: #63B3ED;
  --stage-queue: #F6AD55;
  --stage-coding: #68D391;
  --stage-auditing: #4FD1C5;
  --stage-completed: #A0AEC0;
}
```

---

## Implementation Notes

### Technology Stack Recommendations

**UI Framework:**
- React 18+ (for webview)
- TypeScript for type safety

**Styling:**
- CSS Modules or Styled Components
- Use VSCode's webview CSS variables
- Tailwind CSS (optional, for rapid prototyping)

**Drag-and-Drop:**
- @dnd-kit/core (modern, accessible)
- Alternative: react-beautiful-dnd

**Icons:**
- VSCode Codicons (built-in)
- Use icon classes: `<i class="codicon codicon-file"></i>`

**State Management:**
- React Context for global state
- Local state for UI interactions
- Message passing to extension host for data

### Performance Considerations

**Virtualization:**
- Implement virtual scrolling for columns with >50 items
- Use react-window or react-virtual

**Memoization:**
- Memoize card components (React.memo)
- Use useMemo for expensive computations
- Use useCallback for event handlers

**Debouncing:**
- Debounce search input (300ms)
- Debounce drag events (16ms for 60fps)
- Debounce file watcher updates (500ms)

**Code Splitting:**
- Lazy load modal components
- Lazy load board view (vs tree view)
- Split by route if multiple views

---

## Validation Checklist

### Visual Design
- [ ] All 6 columns are clearly distinguishable
- [ ] Stage colors are consistent and accessible (4.5:1 contrast)
- [ ] Phase cards are visually distinct from task cards
- [ ] Tags are readable and color-coded consistently
- [ ] Empty states provide clear next actions
- [ ] Loading states prevent layout shift

### Interaction Design
- [ ] Drag-and-drop provides clear visual feedback
- [ ] Hover states are consistent across all interactive elements
- [ ] Click targets are minimum 44x44px
- [ ] Keyboard navigation works for all actions
- [ ] Focus indicators are visible (2px outline)
- [ ] Modals trap focus and close with ESC

### Responsive Design
- [ ] Board works at 800px viewport width
- [ ] Columns scroll independently
- [ ] Horizontal scroll is smooth and intuitive
- [ ] Text truncates gracefully
- [ ] Touch targets are 44x44px minimum (for touch devices)

### Accessibility
- [ ] WCAG AA compliant (4.5:1 contrast for text)
- [ ] Keyboard navigation covers all actions
- [ ] Screen reader announces all state changes
- [ ] High contrast mode supported
- [ ] Reduced motion respected
- [ ] All images have alt text
- [ ] Form inputs have labels

### Dark Mode
- [ ] All colors have dark mode variants
- [ ] Stage colors are readable in dark mode
- [ ] Shadows are visible in dark mode
- [ ] Borders are visible in dark mode
- [ ] No pure white or pure black (use theme variables)

---

## Next Steps

1. **Create Low-Fidelity Wireframes**
   - Sketch board layout with 6 columns
   - Show card variations (phase vs task)
   - Illustrate empty states

2. **Build Interactive Prototype**
   - Use Figma, Sketch, or HTML/CSS
   - Test drag-and-drop flow
   - Validate color scheme

3. **Conduct Usability Testing**
   - Test with primary persona
   - Validate workflow efficiency
   - Gather feedback on visual hierarchy

4. **Create Component Library**
   - Build reusable card component
   - Build column component
   - Build modal component
   - Document all props and states

5. **Proceed to Phase 2**
   - Begin frontend implementation
   - Setup React + TypeScript environment
   - Implement drag-and-drop
   - Connect to extension backend

---

**End of Visual Interface Design Specification**

This document serves as the complete design reference for implementing the Kanban board visual interface in Phase 2.
