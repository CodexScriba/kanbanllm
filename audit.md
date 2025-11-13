# README vs PLAN Audit

## Findings

1. **Webview board + `LLM Kanban: Open Board` command undocumented (High)**  
   - PLAN.md explicitly defines a visual drag-and-drop Kanban board delivered through a webview plus the `llmkanban.openBoard` command as part of the core solution and architecture (`PLAN.md:47-104`, `PLAN.md:185-203`).  
   - The README only documents the tree-view sidebar feature set (`vscode-llm-kanban/README.md:32-42`) and its command table omits any mention of opening a webview board (`vscode-llm-kanban/README.md:199-208`). This leaves users unaware of a marquee feature promised in the plan and hides how to launch it.

2. **Architecture section omits planned UI technologies (Medium)**  
   - The plan’s technology stack requires React, Tailwind CSS, and @dnd-kit for the webview layer plus date-fns for data handling (`PLAN.md:97-114`).  
   - The README architecture summary lists only TypeScript, Zod, gray-matter, and the VSCode API (`vscode-llm-kanban/README.md:217-231`) with no reference to the mandated UI stack or helper libraries. This mismatch can mislead contributors about dependencies and build tooling expectations (e.g., webpack bundling for the webview).

3. **Roadmap collapses seven implementation phases down to two (Medium)**  
   - The plan sequences seven phases covering commands, webview board, copy-with-context, polish, and future enhancements (`PLAN.md:960-1199`).  
   - The README roadmap claims only two phases (Phase 1 completed, Phase 2 future) (`vscode-llm-kanban/README.md:246-258`), skipping phases 3–7 entirely. That divergence obscures remaining scoped work (copy-with-context polish, advanced features) and can derail planning or stakeholder expectations.

4. **Configuration options documented incompletely (Low)**  
   - Plan Phase 6 calls for documentation of configuration covering default stage, optional custom stage names, theme customization, and toggling the watcher (`PLAN.md:1155-1159`).  
   - README documents only default stage and the file-watcher toggle (`vscode-llm-kanban/README.md:210-215`). Missing the custom stage/theme knobs either indicates features are absent or undocumented; either way, doc should clarify status per the plan.

5. **Documentation deliverables unmet (Low)**  
   - The plan’s documentation checklist requires screenshots and a keyboard-shortcut reference (`PLAN.md:1161-1165`).  
   - README currently has no screenshots or keyboard shortcut section; it stops at textual walkthroughs. This gap leaves users without visual cues or shortcut discoverability expected for Phase 6 deliverables.

6. **Stray “Implementation Notes” section unrelated to extension (Low)**  
   - Lines describing how to build a navigation bar component (`vscode-llm-kanban/README.md:159-165`) have no counterpart in PLAN.md and appear to be leftover task instructions. This content distracts from extension guidance and could confuse readers about project scope.
