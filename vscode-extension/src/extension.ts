/**
 * LLM Kanban VSCode Extension
 * Main entry point
 */

import * as vscode from 'vscode';
import { KanbanTreeProvider } from './providers/kanban-tree-provider';
import { initWorkspace } from './commands/init-workspace';
import { createKanbanFileWatcher } from './utils/file-watcher';
import { kanbanFolderExists } from './core/fs-adapter';

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('LLM Kanban extension is activating...');

  // Get workspace root
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceRoot) {
    vscode.window.showWarningMessage(
      'LLM Kanban requires an open workspace folder. Please open a folder to use this extension.'
    );
    return;
  }

  // Check if .llmkanban folder exists
  const kanbanExists = await kanbanFolderExists(workspaceRoot);

  // Create tree data provider
  const treeDataProvider = new KanbanTreeProvider(workspaceRoot);

  // Register tree view
  const treeView = vscode.window.createTreeView('llmkanban.treeView', {
    treeDataProvider,
    showCollapseAll: true
  });

  context.subscriptions.push(treeView);

  // Register init command
  const initCommand = vscode.commands.registerCommand('llmkanban.init', async () => {
    await initWorkspace(workspaceRoot);
    // Refresh tree view after initialization
    await treeDataProvider.refresh();
  });

  context.subscriptions.push(initCommand);

  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand('llmkanban.refreshBoard', async () => {
    await treeDataProvider.refresh();
    vscode.window.showInformationMessage('Kanban board refreshed');
  });

  context.subscriptions.push(refreshCommand);

  // Create file watcher if .llmkanban exists
  if (kanbanExists) {
    const fileWatcher = createKanbanFileWatcher(workspaceRoot, () => {
      treeDataProvider.refresh();
    });

    context.subscriptions.push(fileWatcher);

    // Initial load
    await treeDataProvider.refresh();
  } else {
    // Show welcome message
    const answer = await vscode.window.showInformationMessage(
      'LLM Kanban: No .llmkanban folder found. Would you like to initialize it?',
      'Initialize',
      'Not Now'
    );

    if (answer === 'Initialize') {
      await vscode.commands.executeCommand('llmkanban.init');
    }
  }

  console.log('LLM Kanban extension activated successfully');
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('LLM Kanban extension deactivated');
}