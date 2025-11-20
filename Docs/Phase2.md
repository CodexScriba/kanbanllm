# Phase 2: CRUD Operations & Context Management

**Created:** 2025-11-20
**Project:** VSCode LLM Kanban Extension
**Status:** Planning
**Dependencies:** Phase 1 (Core Backend & Visual Components) - Complete

---

## Executive Summary

Phase 2 focuses on enabling full CRUD (Create, Read, Update, Delete) operations from the webview UI, implementing a context management dashboard, fixing file naming conventions, and adding agent assignment capabilities. This phase transforms the board from read-only to fully interactive.

**Key Objectives:**
1. Enable task/phase creation, editing, and deletion from webview
2. Implement context management UI for flexible context selection
3. Fix file naming to use stage-prefix convention
4. Add agent assignment system with dropdown selection
5. Implement inline Monaco editor for context file editing
6. Polish user experience with modals, forms, and validation

**Estimated Effort:** 40-50 hours
**Target Completion:** 2-3 weeks

---

## Critical Fixes (Must Do First)

### Fix 1: File Naming Convention
**Current:** `phase1-task3-navbar-abc123.md` (ID-based)
**Target:** `code.navbar.phase1.task3.md` (stage-prefix)

**Impact Areas:**
- `fs-adapter.ts` - File path generation
- `parser.ts` - Filename parsing
- `extension.ts` - Create/move workflows
- All file operations that construct paths

**Requirements:**
- Stage prefix comes first (e.g., `code.`, `queue.`, `audit.`)
- Feature/component name (e.g., `navbar`, `auth`)
- Phase identifier (e.g., `phase1`, `phase2`)
- Task number (e.g., `task3`)
- Extension: `.md`
- ID stored in frontmatter only (not in filename)

**Example Transformations:**
- Phase file: `queue.navbar.phase1.md`
- Task file: `code.navbar.phase1.task3.md`
- Standalone task: `queue.refactor-parser.task1.md`

---

## Phase 2.1: Agent Assignment System

### Task 2.1.1: Agent Data Model
**Objective:** Define agent structure and storage

**Requirements:**
- Agent profiles stored in `_context/agents/{agent-id}.md`
- Each agent has:
  - ID (e.g., `pcoder`, `ui-specialist`, `auditor`)
  - Display name (e.g., "Pcoder (Python Coder)")
  - Description/instructions (markdown content)
  - Best practices guidelines
  - Preferred tools/frameworks
- Agents are manually created by user (no defaults)
- Agent context is injected into managed section when assigned

**File Structure:**
```
.llmkanban/
  _context/
    agents/
      pcoder.md          # Python coding specialist
      ui-specialist.md   # Frontend/UI expert
      auditor.md         # Code review specialist
```

**Agent File Format:**
```markdown
# Pcoder (Python Coder)

## Role
Python development specialist focused on clean, maintainable code.

## Best Practices
- Follow PEP 8 style guide
- Write comprehensive docstrings
- Use type hints
- Prefer composition over inheritance
- Write unit tests for all functions

## Preferred Tools
- pytest for testing
- black for formatting
- mypy for type checking
```

### Task 2.1.2: Agent Selection in Frontmatter
**Objective:** Add agent field to task/phase metadata

**Requirements:**
- Add `agent` field to frontmatter schema (optional string)
- Update `types.ts` to include agent field
- Update parser to handle agent field
- Update validators to accept agent field
- Agent field stores agent ID (e.g., `pcoder`)

**Frontmatter Example:**
```yaml
---
id: code-navbar-phase1-task3
title: Implement navbar component
stage: code
type: task
phase: navbar-phase1
agent: pcoder
tags: [frontend, react]
created: 2025-11-20T10:00:00Z
updated: 2025-11-20T14:00:00Z
---
```

### Task 2.1.3: Agent Dropdown in UI
**Objective:** Allow users to assign agents to tasks/phases

**Requirements:**
- Dropdown component in create/edit task modal
- Loads available agents from `_context/agents/` directory
- Shows agent display name (from markdown H1)
- Stores agent ID in frontmatter
- "None" option to unassign agent
- Dropdown appears in:
  - Create Task modal
  - Create Phase modal
  - Edit Task modal
  - Edit Phase modal

**UI Behavior:**
- Scan `_context/agents/` for .md files
- Parse each file to extract display name
- Populate dropdown with options
- On selection, update frontmatter.agent field
- On save, re-inject context with agent instructions

### Task 2.1.4: Agent Context Injection
**Objective:** Include agent instructions in managed section

**Requirements:**
- When agent is assigned, read agent context file
- Inject agent section into managed section
- Format: `## 🤖 Agent: {Agent Name}`
- Agent context appears after stage/phase context
- When agent changes, re-inject context
- When agent removed, remove agent section

**Managed Section Structure:**
```markdown
## 🎯 Stage: Code
[Stage context here]

## 📦 Phase: Navbar - Phase 1
[Phase context here]

## 🤖 Agent: Pcoder (Python Coder)
[Agent instructions and best practices here]
```

---

## Phase 2.2: Context Management Dashboard

### Task 2.2.1: Context File Discovery
**Objective:** Scan and list all available context files

**Requirements:**
- Scan `_context/` directory recursively
- Discover context files in:
  - `_context/stages/` (stage contexts)
  - `_context/phases/` (phase contexts)
  - `_context/agents/` (agent contexts)
  - `_context/global/` (global contexts like architecture.md)
- Parse each file to extract:
  - File path
  - Display name (from H1 heading or filename)
  - Type (stage/phase/agent/global)
  - Size (for token estimation)
- Return structured list for UI consumption

### Task 2.2.2: Global Context Storage
**Objective:** Support global context files like architecture.md

**Requirements:**
- Create `_context/global/` directory
- Move/link `architecture.md` to `_context/global/architecture.md`
- Support multiple global context files:
  - `architecture.md` - System architecture
  - `main-plan.md` - Overall project plan
  - `conventions.md` - Coding conventions
  - `dependencies.md` - Tech stack and dependencies
- Global contexts can be selected for any task/phase

### Task 2.2.3: Context Selection UI
**Objective:** Multi-select interface for choosing contexts

**Requirements:**
- Modal/panel titled "Add Context"
- Grouped checkboxes:
  - **Global Context** (architecture.md, main-plan.md, etc.)
  - **Stage Context** (auto-selected based on current stage)
  - **Phase Context** (auto-selected if task belongs to phase)
  - **Agent Context** (auto-selected if agent assigned)
  - **Custom Context** (user-created context files)
- Checkboxes show:
  - Context name
  - File size / estimated tokens
  - Preview on hover
- "Select All" / "Deselect All" buttons
- Save selection to task metadata

### Task 2.2.4: Context Metadata Storage
**Objective:** Store selected contexts in frontmatter

**Requirements:**
- Add `contexts` field to frontmatter (array of context IDs)
- Context IDs are relative paths (e.g., `global/architecture`, `phases/navbar-phase1`)
- Auto-include stage/phase/agent contexts (don't store in array)
- Only store explicitly selected additional contexts
- Update parser/validator to handle contexts field

**Frontmatter Example:**
```yaml
---
id: code-navbar-phase1-task3
title: Implement navbar component
stage: code
type: task
phase: navbar-phase1
agent: pcoder
contexts:
  - global/architecture
  - global/main-plan
tags: [frontend, react]
---
```

### Task 2.2.5: Context Injection in Managed Section
**Objective:** Inject all selected contexts into managed section

**Requirements:**
- Read all selected context files
- Inject in order:
  1. Stage context (always included)
  2. Phase context (if phase assigned)
  3. Agent context (if agent assigned)
  4. Additional contexts (from contexts array)
- Each context gets its own section with heading
- Format: `## 📄 Context: {Context Name}`
- Update managed section when contexts change

### Task 2.2.6: "Copy with Context" Implementation
**Objective:** One-click copy of task with all contexts

**Requirements:**
- Context menu on task cards: "Copy with Context"
- Quick pick menu with modes:
  - **Full Context** - Frontmatter + All Contexts + User Content
  - **Context + Content** - All Contexts + User Content (no frontmatter)
  - **User Content Only** - Just user-written content
- Assemble content based on mode:
  - Read all context files (stage, phase, agent, additional)
  - Combine in proper order
  - Format as clean markdown
- Copy to clipboard
- Show notification: "Copied {character_count} characters ({token_estimate} tokens)"
- Token estimation: characters / 4 (rough estimate)

---

## Phase 2.3: Webview CRUD Operations

### Task 2.3.1: Add Task Button in Webview
**Objective:** Enable task creation from board UI

**Requirements:**
- Add "+" button in each column header
- Button shows: "+ Add Task" or "+ Add Phase"
- Click opens modal dialog
- Modal positioned center of screen
- Backdrop dims background
- ESC key closes modal

**Button Placement:**
- Top-right of each column header
- Icon: "+" or "➕"
- Tooltip: "Add task to {stage}"
- Disabled if workspace not initialized

### Task 2.3.2: Create Task Modal
**Objective:** Form for creating new tasks

**Requirements:**
- Modal title: "Create New Task"
- Form fields:
  - **Title** (required, text input, max 200 chars)
  - **Stage** (pre-filled from column, dropdown, required)
  - **Phase** (dropdown, optional, loads existing phases)
  - **Agent** (dropdown, optional, loads from _context/agents/)
  - **Tags** (multi-input, comma-separated or tag chips)
  - **Contexts** (button: "Add Context" → opens context selector)
  - **Initial Content** (textarea, optional, markdown)
- Validation:
  - Title required and non-empty
  - Title max 200 characters
  - Stage must be valid enum
- Buttons:
  - "Create Task" (primary, submits form)
  - "Cancel" (secondary, closes modal)
- On submit:
  - Send message to extension: `{ type: 'createTask', data: {...} }`
  - Extension calls `createItem()` backend function
  - File created with stage-prefix naming
  - Webview receives `itemCreated` message
  - Modal closes
  - New card appears in column

### Task 2.3.3: Create Phase Modal
**Objective:** Form for creating new phases

**Requirements:**
- Modal title: "Create New Phase"
- Form fields:
  - **Title** (required, text input, max 200 chars)
  - **Stage** (pre-filled from column, dropdown, required)
  - **Tags** (multi-input, comma-separated or tag chips)
  - **Contexts** (button: "Add Context" → opens context selector)
  - **Phase Context** (button: "Edit Context" → opens Monaco editor)
  - **Initial Content** (textarea, optional, markdown)
- Phase context editing:
  - Optional at creation time
  - If user clicks "Edit Context", show inline Monaco editor
  - Monaco editor pre-filled with template
  - User can write phase instructions
  - Context saved to `_context/phases/{phase-id}.md`
- On submit:
  - Create phase file with stage-prefix naming
  - Optionally create phase context file
  - Phase appears in board and phase dropdowns

### Task 2.3.4: Edit Task Modal
**Objective:** Modify existing task metadata

**Requirements:**
- Trigger: Click "Edit" button on task card (add to card actions)
- Modal title: "Edit Task: {task_title}"
- Pre-fill all fields with current values:
  - Title
  - Stage
  - Phase
  - Agent
  - Tags
  - Contexts
- Allow editing all fields except ID
- "Save Changes" button updates frontmatter
- On save:
  - Update frontmatter in file
  - Re-inject context if stage/phase/agent changed
  - Update `updated` timestamp
  - Refresh webview
- "Cancel" button discards changes

### Task 2.3.5: Edit Phase Modal
**Objective:** Modify existing phase metadata

**Requirements:**
- Similar to Edit Task Modal
- Additional option: "Edit Phase Context"
- Opens Monaco editor with current phase context
- Can edit phase instructions inline
- Save updates both phase file and context file

### Task 2.3.6: Delete Confirmation
**Objective:** Safe deletion with user confirmation

**Requirements:**
- Trigger: Click delete button on card (already exists)
- Confirmation dialog:
  - Title: "Delete {item_type}: {item_title}?"
  - Message: "This will permanently delete the file. This cannot be undone."
  - If phase: "Warning: This phase has {N} tasks. They will become orphaned."
- Buttons:
  - "Delete" (danger, red)
  - "Cancel" (secondary)
- On confirm:
  - Send delete message to extension
  - Extension deletes file
  - Webview removes card
  - Show notification: "{item_title} deleted"

### Task 2.3.7: Inline Title Editing
**Objective:** Quick edit task/phase title without modal

**Requirements:**
- Double-click card title to edit
- Title becomes editable input field
- Enter key saves
- ESC key cancels
- Click outside saves
- Update frontmatter on save
- Update filename if using title-based naming
- Show loading indicator during save

### Task 2.3.8: Inline Tag Editing
**Objective:** Quick add/remove tags without modal

**Requirements:**
- Click tag to remove (shows "x" on hover)
- Click "+ Add Tag" to add new tag
- Inline input appears
- Type tag name, press Enter to add
- ESC cancels
- Update frontmatter on change
- Re-inject context if needed

---

## Phase 2.4: Context File Editor (Monaco Integration)

### Task 2.4.1: Monaco Editor Setup
**Objective:** Integrate Monaco editor into webview

**Requirements:**
- Install Monaco editor for React
- Configure webpack to bundle Monaco
- Create `ContextEditor.tsx` component
- Support markdown syntax highlighting
- Support VSCode themes (light/dark)
- Configurable height (default: 400px)
- Read-only mode option

### Task 2.4.2: Inline Context Editor Modal
**Objective:** Edit context files without leaving webview

**Requirements:**
- Modal title: "Edit {context_type}: {context_name}"
- Monaco editor fills modal body
- Toolbar:
  - File path display
  - Character count
  - Token estimate
  - "Save" button
  - "Cancel" button
- Load file content from extension
- Edit in Monaco
- Save sends content back to extension
- Extension writes to file system
- Show save confirmation

### Task 2.4.3: Stage Context Editor
**Objective:** Edit stage context files

**Requirements:**
- Accessible from:
  - Column header menu (gear icon → "Edit Stage Context")
  - Command palette: "Edit Stage Context"
- Opens Monaco editor with current stage context
- File: `_context/stages/{stage}.md`
- Save updates file
- All tasks in that stage get updated context on next move/edit

### Task 2.4.4: Phase Context Editor
**Objective:** Edit phase context files

**Requirements:**
- Accessible from:
  - Phase card menu (gear icon → "Edit Phase Context")
  - Create/Edit Phase modal ("Edit Context" button)
  - Command palette: "Edit Phase Context"
- Opens Monaco editor with current phase context
- File: `_context/phases/{phase-id}.md`
- If file doesn't exist, create with template
- Save updates file
- All tasks in that phase get updated context on next edit

### Task 2.4.5: Agent Context Editor
**Objective:** Edit agent instruction files

**Requirements:**
- Accessible from:
  - Agent dropdown menu ("Edit Agent" button)
  - Command palette: "Edit Agent Context"
- Opens Monaco editor with agent instructions
- File: `_context/agents/{agent-id}.md`
- Template for new agents:
  ```markdown
  # {Agent Name}
  
  ## Role
  [Describe the agent's role]
  
  ## Best Practices
  - [Practice 1]
  - [Practice 2]
  
  ## Preferred Tools
  - [Tool 1]
  - [Tool 2]
  ```
- Save updates file
- All tasks assigned to that agent get updated context

### Task 2.4.6: Global Context Editor
**Objective:** Edit global context files (architecture.md, etc.)

**Requirements:**
- Accessible from:
  - Context selector modal ("Edit" button next to context)
  - Command palette: "Edit Global Context"
- Opens Monaco editor with global context
- File: `_context/global/{context-name}.md`
- Large files (>100KB) show warning
- Save updates file
- All tasks using that context get updated

---

## Phase 2.5: Backend Updates

### Task 2.5.1: Update File Naming in fs-adapter
**Objective:** Generate stage-prefix filenames

**Requirements:**
- Update `getItemPath()` function
- Format: `{stage}.{feature}.{phase}.task{N}.md`
- Extract feature from title (slugify)
- Extract phase from frontmatter
- Extract task number from existing tasks in phase
- Handle edge cases:
  - Standalone tasks (no phase): `{stage}.{feature}.task{N}.md`
  - Phases: `{stage}.{feature}.{phase}.md`
  - Special characters in feature name
- Update all file path generation logic

### Task 2.5.2: Update Parser for New Naming
**Objective:** Parse stage-prefix filenames

**Requirements:**
- Update filename parsing logic
- Extract stage from filename prefix
- Extract feature/component name
- Extract phase identifier
- Extract task number
- Validate filename format
- Handle legacy ID-based filenames (migration)

### Task 2.5.3: Agent Context Injection
**Objective:** Include agent instructions in managed section

**Requirements:**
- Update `buildManagedSection()` function
- Accept agent parameter
- Read agent context file if agent assigned
- Inject agent section after phase context
- Format with proper heading and emoji
- Handle missing agent files gracefully

### Task 2.5.4: Additional Contexts Injection
**Objective:** Include user-selected contexts in managed section

**Requirements:**
- Update `buildManagedSection()` function
- Accept contexts array parameter
- Read each context file
- Inject in order after agent context
- Format each with heading
- Handle missing context files
- Show warning if context file not found

### Task 2.5.5: Create Item with Contexts
**Objective:** Support contexts in createItem function

**Requirements:**
- Update `createItem()` function signature
- Accept agent parameter
- Accept contexts array parameter
- Generate stage-prefix filename
- Create frontmatter with agent and contexts
- Inject all contexts into managed section
- Write file to correct location
- Return created item

### Task 2.5.6: Update Item with Contexts
**Objective:** Support updating agent and contexts

**Requirements:**
- Create `updateItem()` function
- Accept item ID and updates object
- Read current item
- Update frontmatter fields
- Re-inject contexts if changed
- Preserve user content
- Update filename if stage changed
- Write back to file system

### Task 2.5.7: List Available Agents
**Objective:** Scan and return available agents

**Requirements:**
- Create `listAgents()` function
- Scan `_context/agents/` directory
- Read each .md file
- Parse H1 heading for display name
- Return array of agents:
  ```typescript
  {
    id: string;        // filename without .md
    name: string;      // display name from H1
    path: string;      // full file path
  }
  ```
- Handle empty directory
- Handle malformed files

### Task 2.5.8: List Available Contexts
**Objective:** Scan and return all context files

**Requirements:**
- Create `listContexts()` function
- Scan `_context/` directory recursively
- Categorize by type (global, stage, phase, agent)
- Return structured object:
  ```typescript
  {
    global: Context[];
    stages: Context[];
    phases: Context[];
    agents: Context[];
  }
  ```
- Each Context includes:
  - ID (relative path)
  - Name (from H1 or filename)
  - Type
  - Size (bytes)
  - Path (absolute)

---

## Phase 2.6: Extension Message Handlers

### Task 2.6.1: Create Task Message Handler
**Objective:** Handle createTask message from webview

**Requirements:**
- Listen for `{ type: 'createTask', data: {...} }` message
- Validate data (title, stage, etc.)
- Call `createItem()` with all parameters
- Send success message back to webview
- Send error message if creation fails
- Refresh sidebar tree view
- Show notification to user

### Task 2.6.2: Update Task Message Handler
**Objective:** Handle updateTask message from webview

**Requirements:**
- Listen for `{ type: 'updateTask', itemId, updates }` message
- Validate updates
- Call `updateItem()` function
- Handle filename changes if stage changed
- Send updated item back to webview
- Show notification to user

### Task 2.6.3: Create Phase Message Handler
**Objective:** Handle createPhase message from webview

**Requirements:**
- Listen for `{ type: 'createPhase', data: {...} }` message
- Create phase file
- Optionally create phase context file
- Send success message back to webview
- Refresh sidebar and webview
- Show notification

### Task 2.6.4: Update Phase Message Handler
**Objective:** Handle updatePhase message from webview

**Requirements:**
- Listen for `{ type: 'updatePhase', itemId, updates }` message
- Update phase file
- Update phase context if provided
- Send updated phase back to webview
- Refresh all tasks in that phase

### Task 2.6.5: Edit Context Message Handler
**Objective:** Handle context file editing from webview

**Requirements:**
- Listen for `{ type: 'editContext', contextPath, content }` message
- Validate context path (security check)
- Write content to file
- Send success confirmation
- Trigger context re-injection for affected items
- Show notification

### Task 2.6.6: List Agents Message Handler
**Objective:** Send available agents to webview

**Requirements:**
- Listen for `{ type: 'listAgents' }` message
- Call `listAgents()` function
- Send agents array back to webview
- Handle errors gracefully

### Task 2.6.7: List Contexts Message Handler
**Objective:** Send available contexts to webview

**Requirements:**
- Listen for `{ type: 'listContexts' }` message
- Call `listContexts()` function
- Send contexts object back to webview
- Handle errors gracefully

---

## Phase 2.7: UI/UX Polish

### Task 2.7.1: Modal Component Library
**Objective:** Reusable modal components

**Requirements:**
- Create `Modal.tsx` base component
- Props: title, onClose, children, size (small/medium/large)
- Backdrop with click-to-close
- ESC key handler
- Smooth open/close animations
- Accessible (ARIA labels, focus trap)
- Responsive (mobile-friendly)

### Task 2.7.2: Form Components
**Objective:** Reusable form inputs

**Requirements:**
- `TextInput.tsx` - Single-line text input
- `TextArea.tsx` - Multi-line text input
- `Dropdown.tsx` - Select dropdown
- `TagInput.tsx` - Multi-tag input with chips
- `Checkbox.tsx` - Checkbox input
- All components:
  - VSCode theme integration
  - Validation support
  - Error messages
  - Labels and placeholders
  - Keyboard navigation

### Task 2.7.3: Context Selector Component
**Objective:** Multi-select context picker

**Requirements:**
- `ContextSelector.tsx` component
- Grouped checkboxes by type
- Search/filter contexts
- Preview on hover (tooltip with first 200 chars)
- Token count estimation
- "Select All" / "Deselect All" per group
- Return selected context IDs

### Task 2.7.4: Agent Dropdown Component
**Objective:** Agent selection dropdown

**Requirements:**
- `AgentDropdown.tsx` component
- Load agents on mount
- Show agent display names
- "None" option to unassign
- "Edit Agent" button (opens Monaco editor)
- "Create New Agent" option
- Refresh when new agents added

### Task 2.7.5: Loading States
**Objective:** Show progress during async operations

**Requirements:**
- Spinner component for loading
- Skeleton cards while loading board
- Disabled state for buttons during save
- Progress indicators for file operations
- Timeout handling (show error after 10s)

### Task 2.7.6: Error Handling
**Objective:** User-friendly error messages

**Requirements:**
- Toast notifications for errors
- Error modal for critical failures
- Validation errors inline in forms
- Retry buttons for failed operations
- Clear error messages (no stack traces)
- Log errors to console for debugging

### Task 2.7.7: Keyboard Shortcuts
**Objective:** Power user efficiency

**Requirements:**
- `Cmd/Ctrl + N` - New task in current column
- `Cmd/Ctrl + Shift + N` - New phase
- `Cmd/Ctrl + E` - Edit selected card
- `Delete` - Delete selected card
- `Cmd/Ctrl + C` - Copy with context
- `Escape` - Close modal/cancel action
- Arrow keys - Navigate between cards
- Enter - Open selected card

### Task 2.7.8: Accessibility
**Objective:** WCAG AA compliance

**Requirements:**
- ARIA labels on all interactive elements
- Keyboard navigation for all features
- Focus indicators (visible outlines)
- Screen reader announcements
- Color contrast validation
- Reduced motion support
- Alt text for icons

---

## Phase 2.8: Testing & Validation

### Task 2.8.1: Unit Tests for New Functions
**Objective:** Test backend functions

**Requirements:**
- Test `createItem()` with contexts
- Test `updateItem()` function
- Test `listAgents()` function
- Test `listContexts()` function
- Test stage-prefix filename generation
- Test context injection logic
- Test agent context reading
- 80%+ code coverage

### Task 2.8.2: Integration Tests
**Objective:** Test end-to-end workflows

**Requirements:**
- Test create task workflow (webview → extension → file)
- Test update task workflow
- Test delete task workflow
- Test context selection and injection
- Test agent assignment
- Test Monaco editor save
- Test file watcher updates

### Task 2.8.3: UI Component Tests
**Objective:** Test React components

**Requirements:**
- Test modal open/close
- Test form validation
- Test dropdown selection
- Test tag input
- Test context selector
- Test Monaco editor integration
- Use React Testing Library

### Task 2.8.4: Manual Testing Checklist
**Objective:** Verify all features work

**Checklist:**
- [ ] Create task from webview
- [ ] Create phase from webview
- [ ] Edit task metadata
- [ ] Edit phase metadata
- [ ] Delete task with confirmation
- [ ] Delete phase with warning
- [ ] Assign agent to task
- [ ] Select additional contexts
- [ ] Copy with context (all modes)
- [ ] Edit stage context in Monaco
- [ ] Edit phase context in Monaco
- [ ] Edit agent context in Monaco
- [ ] Inline title editing
- [ ] Inline tag editing
- [ ] Drag-and-drop still works
- [ ] File watcher updates board
- [ ] Keyboard shortcuts work
- [ ] Error handling works
- [ ] Loading states appear
- [ ] Accessibility features work

### Task 2.8.5: Performance Testing
**Objective:** Ensure UI remains responsive

**Requirements:**
- Test with 100+ tasks
- Test with 50+ phases
- Test with 20+ agents
- Test with 10+ global contexts
- Measure board load time (target: <2s)
- Measure modal open time (target: <200ms)
- Measure save time (target: <500ms)
- Check memory usage (target: <100MB)

---

## Phase 2.9: Documentation

### Task 2.9.1: Update Architecture.md
**Objective:** Document new features

**Requirements:**
- Document agent system
- Document context management
- Document file naming convention
- Update file tree
- Update component relationships
- Add mermaid diagrams

### Task 2.9.2: User Guide
**Objective:** Help users learn new features

**Requirements:**
- Create `docs/user-guide.md`
- Document how to:
  - Create tasks and phases
  - Assign agents
  - Select contexts
  - Edit context files
  - Copy with context
  - Use keyboard shortcuts
- Include screenshots
- Include examples

### Task 2.9.3: Developer Guide
**Objective:** Help future developers

**Requirements:**
- Create `docs/developer-guide.md`
- Document:
  - Message passing architecture
  - File naming logic
  - Context injection flow
  - Monaco editor integration
  - Testing approach
- Include code examples

### Task 2.9.4: Migration Guide
**Objective:** Help users migrate from old naming

**Requirements:**
- Create `docs/migration.md`
- Document breaking changes
- Provide migration script (optional)
- Explain new file naming
- Show before/after examples

---

## Success Criteria

Phase 2 is **COMPLETE** when:

- ✅ Users can create tasks/phases from webview UI
- ✅ Users can edit task/phase metadata inline or in modals
- ✅ Users can delete tasks/phases with confirmation
- ✅ Users can assign agents to tasks/phases
- ✅ Users can select additional contexts for tasks
- ✅ Users can edit context files in Monaco editor without leaving webview
- ✅ "Copy with Context" works with all selected contexts
- ✅ File naming uses stage-prefix convention
- ✅ All CRUD operations update files correctly
- ✅ File watcher refreshes UI automatically
- ✅ Keyboard shortcuts work for common actions
- ✅ Error handling is user-friendly
- ✅ Loading states appear during async operations
- ✅ Accessibility features work (keyboard nav, screen readers)
- ✅ Performance is acceptable with 100+ tasks
- ✅ All tests pass (unit, integration, UI)
- ✅ Documentation is complete and accurate

---

## Dependencies & Risks

### Dependencies
- Monaco editor for React
- Existing backend functions (fs-adapter, parser, etc.)
- VSCode extension API
- File watcher functionality

### Risks
- **Monaco editor bundle size** - May increase extension size significantly
  - Mitigation: Use lazy loading, only load when needed
- **File naming migration** - Existing users may have old naming convention
  - Mitigation: Support both formats, provide migration tool
- **Context file performance** - Reading many context files may be slow
  - Mitigation: Cache context files, lazy load
- **Webview complexity** - Many modals and components may impact performance
  - Mitigation: Code splitting, lazy loading, React.memo

### Technical Debt
- Need to refactor fs-adapter for new naming convention
- Need to update all tests for new file format
- Need to handle backward compatibility
- Need to optimize context injection for performance

---

## Timeline Estimate

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| 2.1 Agent System | 4 tasks | 8 hours |
| 2.2 Context Management | 6 tasks | 10 hours |
| 2.3 CRUD Operations | 8 tasks | 12 hours |
| 2.4 Monaco Integration | 6 tasks | 8 hours |
| 2.5 Backend Updates | 8 tasks | 10 hours |
| 2.6 Message Handlers | 7 tasks | 6 hours |
| 2.7 UI/UX Polish | 8 tasks | 10 hours |
| 2.8 Testing | 5 tasks | 8 hours |
| 2.9 Documentation | 4 tasks | 4 hours |
| **Total** | **56 tasks** | **76 hours** |

**Realistic Timeline:** 3-4 weeks (assuming 20 hours/week)

---

## Next Steps

1. Review this plan with stakeholders
2. Prioritize tasks (can some be deferred to Phase 3?)
3. Set up development branch
4. Begin with Critical Fixes (file naming)
5. Implement in order: Backend → Message Handlers → UI → Polish → Testing
6. Test continuously throughout development
7. Document as you build
8. Deploy to testing environment
9. Gather feedback
10. Iterate and improve

---

**End of Phase 2 Plan**
