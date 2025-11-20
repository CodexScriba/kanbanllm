# VSCode LLM Kanban Extension - Development Roadmap

**Created:** 2025-11-13
**Project:** File-based Kanban system for LLM-assisted development
**Approach:** UI/UX First → Backend Logic Second

---

## Overview

This roadmap outlines the phased development of a VSCode extension that provides a visual Kanban board for managing tasks alongside LLM interactions. The approach prioritizes user-facing features first, followed by backend implementation.

---

## Phase 1: Design Foundation & User Experience Planning

**Goal:** Define the user experience, visual design, and interaction patterns before writing code.

### Tasks

1. **Define User Personas and Use Cases**
   - Identify primary users (developers working with LLMs)
   - Document key workflows (create task, move task, copy to LLM)
   - Map pain points with current solutions
   - Define success criteria for each workflow

2. **Design Visual Interface**
   - Sketch Kanban board layout (5 columns: Queue, Planning, Coding, Auditing, Completed)
   - Design task card appearance (badges, tags, colors)
   - Define color scheme for stages and item types
   - Create dark mode compatibility plan
   - Design empty states and loading indicators

3. **Plan Sidebar Tree View Layout**
   - Design hierarchical structure (stages → items)
   - Define icons for phases (📦) and tasks (✅)
   - Plan context menu options
   - Design badge system for counts

4. **Create Interaction Patterns**
   - Define drag-and-drop behavior
   - Design click actions (open file, quick view)
   - Plan keyboard shortcuts
   - Design modal forms (create task, create phase)
   - Define hover states and tooltips

5. **Design "Copy with Context" Feature**
   - Define three copy modes (Full, Context + Content, User Content Only)
   - Design quick pick interface for mode selection
   - Plan clipboard notification messages
   - Create user documentation for feature

6. **Establish Design System**
   - Define spacing, typography, and sizing standards
   - Select icon set (VSCode codicons)
   - Define animation timing and transitions
   - Create component state specifications

---

## Phase 2: Visual Components & Frontend Development

**Goal:** Build all user-facing visual components before connecting to backend logic.

### Tasks

1. **Setup Webview Infrastructure**
   - Configure React environment for webview
   - Setup styling system (CSS or Tailwind)
   - Configure webpack for bundling
   - Establish message passing architecture (webview ↔ extension)

2. **Build Kanban Board Components**
   - Create Board container layout with 5 columns (Queue, Planning, Coding, Auditing, Completed)
   - Build Column component (droppable zones)
   - Build Card component (draggable items)
   - Add visual indicators for item types (phase vs task)
   - Implement tag badges and metadata display

3. **Implement Drag-and-Drop UI**
   - Integrate dnd-kit library
   - Create visual feedback during drag
   - Add drop zone highlighting
   - Implement drag handles and constraints
   - Add accessibility features for drag-and-drop

4. **Build Creation Modal**
   - Design form layout for new items
   - Create input fields (title, tags, phase selector)
   - Add type toggle (task vs phase)
   - Implement validation feedback
   - Add form submission and cancel actions

5. **Create Sidebar Tree View**
   - Build tree structure UI
   - Implement expand/collapse functionality
   - Add stage groupings with counts
   - Integrate icons and badges
   - Create item click handlers (placeholder)

6. **Add Search and Filter UI**
   - Design search bar component
   - Create filter controls (by tag, by phase)
   - Add sort options dropdown
   - Implement visual filtering feedback
   - Design clear/reset filters action

7. **Implement Loading States**
   - Create skeleton screens for board
   - Add spinner for async operations
   - Design progress indicators
   - Add optimistic UI updates
   - Create error state displays

8. **Polish Visual Details**
   - Add micro-animations (card movements, hover effects)
   - Implement responsive layout adjustments
   - Add focus states for accessibility
   - Create visual hierarchy with shadows and borders
   - Test dark mode appearance

---

## Phase 3: User Commands & Interaction Logic

**Goal:** Implement all user-initiated actions and command palette integration.

### Tasks

1. **Define Command Palette Commands**
   - Register "Initialize Workspace" command
   - Register "Open Board" command
   - Register "Create Task" command
   - Register "Create Phase" command
   - Register "Move Task" command
   - Register "Copy with Context" command
   - Register "Refresh Board" command

2. **Implement Quick Input Flows**
   - Build task creation input sequence (title → phase → tags)
   - Build phase creation input sequence (title → tags)
   - Create phase picker dropdown with existing phases
   - Add input validation and error messages
   - Implement cancellation handling

3. **Build Context Menu Integrations**
   - Add commands to tree view context menu
   - Add commands to editor context menu (for .md files)
   - Create conditional menu visibility (based on file type)
   - Add keyboard shortcut bindings
   - Test menu accessibility

4. **Implement Move Task Workflow**
   - Create stage picker quick pick
   - Add visual confirmation of move
   - Implement undo capability
   - Add notification messages
   - Handle edge cases (already in target stage)

5. **Build Copy with Context Feature**
   - Implement mode selection quick pick
   - Add copy mode preview
   - Integrate clipboard API
   - Add success notifications with character count
   - Handle copy errors gracefully

6. **Create Workspace Initialization Flow**
   - Design welcome screen on first use
   - Implement folder structure creation wizard
   - Add template selection options
   - Create post-initialization guidance
   - Add validation checks before initialization

7. **Implement File Watcher Triggers**
   - Setup file system watch patterns
   - Add debouncing for rapid changes
   - Trigger UI refresh on file events
   - Handle external file edits
   - Manage watcher lifecycle (start/stop)

---

## Phase 4: Backend Logic & File Operations

**Goal:** Implement core file system operations and business logic.

### Tasks

1. **Setup Core File System Operations**
   - Implement workspace root detection
   - Create `.llmkanban/` folder structure validation
   - Build path validation and security checks
   - Implement safe file read operations
   - Implement safe file write operations
   - Handle file permissions and errors

2. **Implement ID Generation System**
   - Build phase ID generator (phase{N}-{slug}-{hash})
   - Build task ID generator (phase{N}-task{M}-{slug}-{hash})
   - Implement dynamic numbering (scan existing files)
   - Add collision detection and handling
   - Create slug generation from titles
   - Implement hash generation (timestamp-based)

3. **Build File Parser**
   - Parse markdown files into structured objects
   - Extract YAML frontmatter
   - Separate managed section from user content
   - Handle separator logic (DOCFLOW:MANAGED, DOCFLOW:USER-CONTENT)
   - Serialize objects back to markdown format
   - Preserve formatting and whitespace

4. **Implement Validation Layer**
   - Create Zod schemas for frontmatter
   - Validate stage names
   - Validate item types (phase vs task)
   - Validate required fields (id, title, created, updated)
   - Handle validation errors gracefully
   - Add data sanitization

5. **Build File Move Operations**
   - Implement move between stage folders
   - Handle file rename during move
   - Validate source and destination paths
   - Clean up empty folders
   - Handle move failures and rollback
   - Update file metadata on move

6. **Implement Delete Operations**
   - Create safe delete with confirmation
   - Handle dependency checks (tasks linked to phases)
   - Clean up orphaned files
   - Log deletions for audit trail
   - Implement soft delete option (move to archive)

7. **Build Data Loading System**
   - Load all items from all stage folders
   - Filter and sort items
   - Build in-memory cache for performance
   - Implement incremental loading for large datasets
   - Handle missing or corrupted files
   - Add loading progress feedback

8. **Setup Error Handling**
   - Handle file not found errors
   - Handle permission denied errors
   - Handle corrupted YAML frontmatter
   - Handle disk space issues
   - Create user-friendly error messages
   - Implement error logging

---

## Phase 5: Context Management & LLM Integration

**Goal:** Implement context injection system and prepare content for LLM consumption.

### Tasks

1. **Build Context File System**
   - Create default stage context templates
   - Create default phase context templates
   - Setup context file locations (_context/stages/, _context/phases/)
   - Implement context file validation
   - Handle missing context files gracefully

2. **Implement Context Reading**
   - Read stage context from template files
   - Read phase context from phase-specific files
   - Cache context for performance
   - Handle context file updates
   - Parse markdown context content

3. **Build Context Injection Engine**
   - Inject stage context into managed section
   - Inject phase context for tasks
   - Preserve user content during injection
   - Update separators correctly
   - Maintain frontmatter integrity

4. **Implement Stage Change Context Updates**
   - Detect stage transitions
   - Remove old stage context
   - Inject new stage context
   - Preserve phase context
   - Preserve user content
   - Update timestamps

5. **Build Context Extraction for Copy**
   - Extract full document (frontmatter + managed + user)
   - Extract managed section + user content only
   - Extract user content only
   - Format output for readability
   - Handle missing sections gracefully

6. **Create Phase Context Management**
   - Allow users to create phase-specific context files
   - Auto-generate phase context on phase creation
   - Support editing phase context from UI
   - Update tasks when phase context changes
   - Handle phase context deletion

7. **Implement Context Templates**
   - Provide default templates for all stages
   - Create architecture.md template
   - Create design.md template
   - Allow custom template creation
   - Support template variables

---

## Phase 6: Polish, Testing & Documentation

**Goal:** Refine user experience, handle edge cases, and prepare for release.

### Tasks

1. **Implement Configuration Options**
   - Add setting for default stage (new items)
   - Add setting to enable/disable file watcher
   - Add setting for custom stage names
   - Add setting for theme customization
   - Add setting for keyboard shortcuts
   - Create settings UI documentation

2. **Handle Edge Cases**
   - Handle workspace with no .llmkanban folder
   - Handle corrupted frontmatter recovery
   - Handle concurrent file modifications
   - Handle large repositories (>500 items)
   - Handle network drives and slow file systems
   - Handle merge conflicts in markdown files

3. **Optimize Performance**
   - Add lazy loading for large datasets
   - Implement pagination in webview
   - Optimize file watcher debouncing
   - Cache parsed items in memory
   - Minimize re-renders in React components
   - Bundle optimization and code splitting

4. **Improve Accessibility**
   - Add ARIA labels to all interactive elements
   - Support keyboard-only navigation
   - Add screen reader announcements
   - Ensure color contrast ratios meet standards
   - Test with accessibility tools
   - Add focus indicators

5. **Create User Documentation**
   - Write README with feature overview
   - Create getting started guide
   - Document all commands and shortcuts
   - Add workflow examples with screenshots
   - Create troubleshooting guide
   - Document file format specification

6. **Write Technical Documentation**
   - Document extension architecture
   - Create API reference for core functions
   - Document data flow and state management
   - Create contribution guidelines
   - Document testing procedures
   - Add inline code documentation

7. **Implement Testing**
   - Write unit tests for core logic (parser, validators, ID generation)
   - Write integration tests for file operations
   - Test webview components
   - Test command execution
   - Test error scenarios
   - Create end-to-end test suite

8. **Prepare for Release**
   - Create extension icon and branding
   - Write marketplace description
   - Add screenshots and demo GIFs
   - Create changelog template
   - Set up versioning strategy
   - Prepare extension package

9. **Gather User Feedback**
   - Conduct usability testing
   - Collect feedback on workflows
   - Identify pain points
   - Prioritize improvements
   - Plan future enhancements

10. **Create Example Projects**
    - Build example .llmkanban folder
    - Create sample tasks and phases
    - Demonstrate all features
    - Include best practices
    - Add to documentation

---

## Phase 7: Advanced Features (Future Enhancements)

**Goal:** Add optional features based on user feedback and usage patterns.

### Tasks

1. **Enhanced Search & Filtering**
   - Implement full-text search across all tasks
   - Add advanced filter combinations (AND/OR logic)
   - Create saved filter presets
   - Add search history
   - Implement fuzzy matching

2. **Bulk Operations**
   - Add multi-select in tree view
   - Implement bulk move to stage
   - Add bulk tag editing
   - Create bulk delete with safety checks
   - Add bulk export functionality

3. **Analytics & Reporting**
   - Track time spent in each stage
   - Generate completion statistics
   - Create burndown charts
   - Add velocity tracking
   - Export reports (CSV, JSON)

4. **Custom Templates**
   - Allow user-defined task templates
   - Create template picker on task creation
   - Support custom fields in templates
   - Add template sharing/import
   - Create template gallery

5. **Collaboration Features**
   - Add assignee field and tracking
   - Implement comments on tasks
   - Add @mentions in markdown
   - Create activity log
   - Support team notifications

6. **Integration Extensions**
   - Add git commit linking
   - Integrate with issue trackers (GitHub, Jira)
   - Create API for third-party integrations
   - Add export to external tools
   - Support webhooks for automation

7. **Mobile Companion**
   - Create read-only mobile view
   - Add task quick-add from mobile
   - Sync via git
   - Create mobile-optimized board view

---

## Success Criteria

### Phase 1-2 (UI/UX)
- Visual designs are clear and intuitive
- All components render correctly in light and dark modes
- Drag-and-drop provides clear visual feedback
- Users can navigate board without instructions

### Phase 3-4 (Interactions & Backend)
- All commands execute without errors
- File operations complete in <500ms
- User content is preserved 100% of the time
- Extension handles 100+ tasks without lag

### Phase 5-6 (Context & Polish)
- Context injection works correctly on all stage changes
- Copy with context produces correctly formatted output
- Error messages are clear and actionable
- Documentation is comprehensive and easy to follow

### Overall Success
- Extension uses <50MB memory
- No data loss under normal operations
- Git diffs remain clean and readable
- Users can manage 50-200 tasks efficiently
- Extension installs and activates without issues

---

## Risk Management

### UI/UX Risks
- **Risk:** Users find drag-and-drop confusing
- **Mitigation:** Add onboarding tutorial, provide keyboard alternatives

### Performance Risks
- **Risk:** Large repositories (>500 items) slow down the extension
- **Mitigation:** Implement lazy loading, pagination, and indexed caching

### Data Integrity Risks
- **Risk:** Concurrent edits cause data loss
- **Mitigation:** Implement file locking, conflict detection, and backup system

### Compatibility Risks
- **Risk:** Cross-platform path issues (Windows vs Unix)
- **Mitigation:** Use Node.js path module consistently, test on all platforms

---

## Timeline Estimates

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Design Foundation | 1 week | None |
| Phase 2: Visual Components | 2 weeks | Phase 1 |
| Phase 3: User Commands | 1.5 weeks | Phase 2 |
| Phase 4: Backend Logic | 2 weeks | Phase 2 |
| Phase 5: Context Management | 1.5 weeks | Phase 4 |
| Phase 6: Polish & Testing | 2 weeks | Phase 3, 4, 5 |
| **Total** | **10 weeks** | |

---

## Next Steps

1. **Review and approve this roadmap** with stakeholders
2. **Create design mockups** for Phase 1 (can be low-fidelity)
3. **Setup development environment** and extension boilerplate
4. **Begin Phase 1** design work immediately
5. **Schedule weekly reviews** to track progress and adjust priorities

---

**End of Roadmap**

This roadmap prioritizes user experience and visual design before diving into backend implementation, ensuring a polished and intuitive product.
