import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar/SidebarProvider';

/**
 * Extension activation entry point
 *
 * Task 0: Register sidebar tree view and placeholder commands
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('LLM Kanban extension is now active');

  // Create and register the sidebar tree view provider
  const sidebarProvider = new SidebarProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('llmKanban.treeView', sidebarProvider)
  );

  // Register command: Open Kanban Board
  // Task 0: Shows placeholder notification
  // Future: Will open webview with Kanban board
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.openBoard', () => {
      vscode.window.showInformationMessage('Open Kanban Board - Coming soon!');
      // Future implementation:
      // KanbanPanel.createOrShow(context.extensionUri);
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

  // Register command: Refresh sidebar
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.refreshSidebar', () => {
      sidebarProvider.refresh();
      vscode.window.showInformationMessage('Sidebar refreshed');
    })
  );
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('LLM Kanban extension is now deactivated');
}