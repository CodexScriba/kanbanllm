# Phase 2 — Codex Work Plan

## Current Stage (reality check)
- Baseline exists: VSCode extension with command palette flows (init workspace, create/move/delete items, copy with context), tree view, and a React webview board with drag-and-drop and basic filters.
- Missing: Webview-side CRUD (no create/edit modals), agent/context management, Monaco editing, updated file naming, and context-driven copy modes described in `Docs/Phase2.md`.
- Incoherence: `IMPLEMENTATION_SUMMARY.md` claims Phases 1-6 are complete, but the code shows Phase 2 scope still pending.
- Incoherence: Stage vocabulary and folders are inconsistent (`chat/plan/code` vs `planning/coding/auditing` vs numbered folders like `1-queue`). This must be unified before adding features.

## Critical coherence fixes (do first)
1) **Stage canon + folders:** Adopt one canonical stage set (`chat`, `queue`, `plan`, `code`, `audit`, `completed`) with aliases for legacy (`planning`→`plan`, `coding`→`code`, `auditing`→`audit`). Normalize everywhere (`src/core/types.ts`, `parser.ts`, `validators.ts`, `fs-adapter.ts`, `workspace/KanbanWorkspace.ts`, `webview-src/types.ts`, `App.tsx`, `Board/Column`, `KanbanPanel.ts`). Standardize folders under `.llmkanban/{stage}`; keep compatibility readers for numbered folders but write new items to canonical paths.
2) **File naming:** Move from ID-only filenames to stage-prefix convention (`{stage}.{feature}.{phase}.task{N}.md` and `{stage}.{feature}.{phase}.md` for phases). Store IDs only in frontmatter. Add migration helper and dual-parse support.
3) **Truth source:** Treat `Docs/Phase2.md` as the active scope; update `IMPLEMENTATION_SUMMARY.md`, `Docs/architecture.md`, and `docs/context/roadmap.md` after implementation to reflect reality.

## Objectives for Phase 2
- Full CRUD from the webview (tasks and phases) with validation and confirmation flows.
- Context management: discover contexts, select per item, inject into managed section, and copy-with-context improvements.
- Agent assignments: agent metadata files, dropdown selection, and injected agent guidance.
- Inline Monaco editor for contexts (stage, phase, agent, global) with token estimates.
- UX polish: reusable modals/forms, inline title/tag editing, loading/error states, keyboard shortcuts, accessibility.

## Work Breakdown (what to build/edit)

### M0 — Stage + workspace alignment
- Update stage enums, alias map, and normalization logic (`src/core/types.ts`, `parser.ts`, `validators.ts`).
- Unify workspace scaffolding to canonical folders and context dirs (`src/workspace/KanbanWorkspace.ts`) and add migration/alias reads in `fs-adapter.ts`.
- Update webview types and column config to the canonical set (`webview-src/types.ts`, `components/Board.tsx`, `components/Column.tsx`, `App.tsx`).
- Add regression tests for stage normalization and folder discovery (`src/core/__tests__`).

### M1 — Data model & file naming
- Extend frontmatter schema with `agent?: string`, `contexts?: string[]`, and explicit `phaseId` vs display title (`src/core/types.ts`, `parser.ts`, `validators.ts`).
- Implement stage-prefix filename generator and parser with legacy support (`src/core/fs-adapter.ts`), including feature slug extraction and per-phase task numbering.
- Add migration utilities for renaming existing files; keep compatibility read path until migration is explicit.
- Update managed section builder to accept stage/phase names and placeholders for agent/context blocks (`context-injector.ts`).

### M2 — Context & agent back end
- Implement context discovery (`listContexts`) scanning `_context/{stages,phases,agents,global}` with metadata (id, name, size, path) in `fs-adapter.ts`.
- Implement agent discovery (`listAgents`) parsing H1 headings from `_context/agents/*.md`.
- Extend managed section injection to include agent + additional contexts in order (stage → phase → agent → selected contexts) with missing-file warnings (`context-injector.ts`).
- Add create/update item flows that accept `agent` and `contexts` and re-inject managed sections (`fs-adapter.ts`).

### M3 — Extension message handlers
- Add webview message types for create/update/delete phase/task, listAgents, listContexts, editContext, copyWithContext modes (`webview/KanbanPanel.ts` message router).
- Wire to new `fs-adapter` functions, including filename changes on stage change and context reinjection.
- Refresh sidebar and webview after mutations; surface errors via notifications.
- Add security checks on editable paths for context editing.

### M4 — Webview UI/UX
- Build reusable modal + form components (`webview-src/components/Modal.tsx`, `TextInput.tsx`, `Dropdown.tsx`, `TagInput.tsx`, `ContextSelector.tsx`, `AgentDropdown.tsx`, `Loading.tsx`, `Toast.tsx`).
- Implement create/edit task modal and create/edit phase modal with context selector and inline phase context button (`App.tsx` orchestration + new `components`).
- Add inline title and tag editing on cards; show per-stage add buttons on column headers.
- Implement delete confirmation and loading/error states across flows.
- Add keyboard shortcuts and focus management.

### M5 — Context editor (Monaco)
- Add Monaco bundling to webview build (`webpack.config.js`, `webview-src/ContextEditor.tsx`).
- Create context editor modal for stage/phase/agent/global contexts with char/token counts and size warnings.
- Add handlers to load/save contexts via extension messages; update managed sections on save.

### M6 — Copy with Context upgrade
- Enhance copy modes to include selected contexts and agent content; compute character/token estimates (`KanbanPanel.ts`, `fs-adapter.ts` helpers).
- Add UI affordance (card action or context menu) to choose copy mode and show toast.

### M7 — Testing, validation, and docs
- Unit tests: filename gen/parse, agent/context listing, managed section injection, create/update flows (`src/core/__tests__`).
- Integration tests: webview message → FS mutation → UI refresh (add lightweight harness or mocks).
- Update docs: `Docs/architecture.md` (new data model, message flow, naming), `docs/context/roadmap.md` (Phase 2 in progress), add `docs/migration.md` for filename changes, and expand user guide entries in `vscode-extension/README.md`.

### M8 — Migration/backward compatibility
- Provide a script/command to rename existing files to stage-prefix naming (opt-in), or add a one-time prompt in the extension.
- Keep read support for legacy IDs until migration completes; log warnings when encountering old format.

## Expected file additions
- New components: `webview-src/components/{Modal,TextInput,Dropdown,TagInput,ContextSelector,AgentDropdown,Loading,Toast}.tsx`, `webview-src/ContextEditor.tsx`.
- New tests under `src/core/__tests__/` for naming, contexts, agents, and injections.
- New docs: `docs/migration.md` (or placed under `Docs/`), updates to `Docs/architecture.md` and `Docs/Phase2.md` status once work lands.

## Delivery order
1) M0–M1 (coherence + data model + naming) — unblock everything else.
2) M2–M3 (backend + message handlers) — core behavior.
3) M4–M5 (UI + Monaco) — user-facing features.
4) M6–M8 (copy improvements, tests, docs, migration) — hardening and release readiness.
