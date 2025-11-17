import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { KanbanPanel } from './webview/KanbanPanel';

/**
 * Extension activation entry point
 *
 * Task 0: Register sidebar tree view and placeholder commands ✅
 * Task 1: Setup webview infrastructure ✅
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('LLM Kanban extension is now active');

  // Create and register the sidebar tree view provider
  const sidebarProvider = new SidebarProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('llmKanban.treeView', sidebarProvider)
  );

  // Register command: Open Kanban Board
  // Task 1: Opens webview with placeholder content
  // Task 2: Will display full board layout
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.openBoard', () => {
      KanbanPanel.createOrShow(context.extensionUri);
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