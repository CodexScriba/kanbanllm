/**
 * LLM Kanban Extension
 * File-based Kanban board for managing LLM-assisted development tasks
 */

import * as vscode from 'vscode';
import { initWorkspace } from './commands/init-workspace';
import { createTask } from './commands/create-task';
import { createPhase } from './commands/create-phase';
import { moveTask } from './commands/move-task';
import { copyWithContext } from './commands/copy-with-context';
import { openBoard } from './commands/open-board';
import { registerKanbanTreeView } from './providers/kanban-tree-provider';
import { registerKanbanWebview } from './providers/kanban-webview-provider';
import { getWorkspaceRoot, isWorkspaceOpen, getConfig } from './utils/workspace';
import { watchKanbanFolder } from './utils/file-watcher';

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('LLM Kanban extension is now active');

	// Check if workspace is open
	if (!isWorkspaceOpen()) {
		console.log('No workspace open, waiting for workspace to open');
		return;
	}

	const workspaceRoot = getWorkspaceRoot();

	// Register tree view provider
	const treeProvider = registerKanbanTreeView(context, workspaceRoot);

	// Register webview provider
	const webviewProvider = registerKanbanWebview(context, workspaceRoot);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('llmkanban.init', () => initWorkspace(context))
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('llmkanban.createTask', createTask)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('llmkanban.createPhase', createPhase)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('llmkanban.moveTask', (itemId?: string) => moveTask(itemId))
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('llmkanban.copyWithContext', (itemId?: string) => copyWithContext(itemId))
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('llmkanban.openBoard', openBoard)
	);

	// Set up file watcher if enabled
	const enableFileWatcher = getConfig<boolean>('enableFileWatcher', true);
	if (enableFileWatcher) {
		const watcher = watchKanbanFolder(workspaceRoot, () => {
			treeProvider.refresh();
			webviewProvider.refresh();
		});
		context.subscriptions.push(watcher);
	}

	console.log('LLM Kanban extension activated successfully');
}

/**
 * Extension deactivation
 */
export function deactivate() {
	console.log('LLM Kanban extension deactivated');
}
