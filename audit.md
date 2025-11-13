# README vs PLAN Audit

## Current Status
- ✅ Previous high-severity gaps (webview/command docs, architecture tech stack, roadmap coverage) are now addressed.
- ⚠️ Three plan-alignment issues remain, summarized below.

## Findings

1. **Documentation deliverables still incomplete (Medium)**  
   - Phase 6 calls for “README with screenshots” plus a “Keyboard shortcut reference” (`PLAN.md:1161-1165`).  
   - The updated README still has no screenshots and the shortcut table remains placeholders (`-`) with only a customization note (`vscode-llm-kanban/README.md:221-232, 319`). Readers still lack the visual guidance and concrete keybindings the plan treats as required deliverables.

2. **Configuration coverage remains partial (Low)**  
   - Configuration tasks include documenting “Custom stage names (optional)” and “Theme customization” in addition to default stage and watcher toggles (`PLAN.md:1155-1159`).  
   - README documents only the default stage and file watcher settings and relegates the custom stage/theme options to a future note (`vscode-llm-kanban/README.md:233-240`). That leaves contributors guessing about the plan-mandated configuration surface area and status.

3. **Stray implementation-task content still embedded (Low)**  
   - The README continues to embed specific “Build a navigation bar” instructions twice in the Implementation Notes example (`vscode-llm-kanban/README.md:179-186, 215-216`), which are unrelated to extension usage or architecture. PLAN.md never references this UI task, so keeping it in user-facing docs risks confusing readers about the extension’s scope.
