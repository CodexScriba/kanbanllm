/**
 * Open board command
 * Opens the webview Kanban board
 */

import * as vscode from 'vscode';
import { ensureWorkspace } from '../utils/workspace';

/**
 * Open the Kanban board webview
 */
export async function openBoard(): Promise<void> {
  if (!ensureWorkspace()) {
    return;
  }

  // The webview is registered as a view in the sidebar
  // This command will focus on it
  await vscode.commands.executeCommand('llmkanban.boardView.focus');
}
