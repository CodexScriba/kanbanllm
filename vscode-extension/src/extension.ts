import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { KanbanPanel } from './webview/KanbanPanel';
import {
  bindKanbanRoot,
  ensureKanbanWorkspace,
  isKanbanWorkspaceInitialized,
} from './workspace/KanbanWorkspace';

/**
 * Extension activation entry point
 *
 * Task 0: Register sidebar tree view and placeholder commands ✅
 * Task 1: Setup webview infrastructure ✅
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('LLM Kanban extension is now active');

  // Attempt to bind the kanban root on activation (best effort)
  void bindKanbanRoot(false).catch(() => undefined);

  // Create and register the sidebar tree view provider
  const sidebarProvider = new SidebarProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('llmKanban.treeView', sidebarProvider)
  );

  // Register command: Open Kanban Board
  // Task 1: Opens webview with placeholder content
  // Task 2: Will display full board layout
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.openBoard', async () => {
      try {
        await bindKanbanRoot(true);
        KanbanPanel.createOrShow(context.extensionUri);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to open Kanban board.';
        const action = await vscode.window.showErrorMessage(
          message,
          'Initialize Workspace'
        );
        if (action === 'Initialize Workspace') {
          void vscode.commands.executeCommand('llmKanban.initializeWorkspace');
        }
      }
    })
  );

  // Register command: Open Settings
  // Task 0: Shows placeholder notification
  // Future: Will open settings UI
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.openSettings', () => {
      vscode.window.showInformationMessage('Settings - Coming soon!');
      // Future implementation:
      // Open VSCode settings or custom settings panel
    })
  );

  // Register workspace initialization command
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.initializeWorkspace', async () => {
      try {
        const result = await ensureKanbanWorkspace();
        sidebarProvider.refresh();
        vscode.window.showInformationMessage(
          result.created
            ? 'LLM Kanban workspace initialized with default structure.'
            : 'LLM Kanban workspace already exists.'
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to initialize workspace.';
        vscode.window.showErrorMessage(message);
      }
    })
  );

  // Register command: Refresh sidebar
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.refreshSidebar', async () => {
      const initialized = await isKanbanWorkspaceInitialized();
      sidebarProvider.refresh();
      if (!initialized) {
        vscode.window.showWarningMessage(
          'LLM Kanban workspace not initialized yet. Run "LLM Kanban: Initialize Workspace" to get started.'
        );
      } else {
        vscode.window.showInformationMessage('LLM Kanban sidebar refreshed');
      }
    })
  );
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('LLM Kanban extension is now deactivated');
}
