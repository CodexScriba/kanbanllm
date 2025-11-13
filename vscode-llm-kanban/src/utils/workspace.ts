/**
 * Workspace utilities
 * Functions for detecting and validating workspace configuration
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { KANBAN_FOLDER } from '../core/types';

/**
 * Get the workspace root folder
 * @throws Error if no workspace is open
 */
export function getWorkspaceRoot(): string {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    throw new Error('No workspace folder is open');
  }

  // Use the first workspace folder
  return workspaceFolders[0].uri.fsPath;
}

/**
 * Check if a workspace is open
 */
export function isWorkspaceOpen(): boolean {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  return !!(workspaceFolders && workspaceFolders.length > 0);
}

/**
 * Get the .llmkanban folder path
 * @throws Error if no workspace is open
 */
export function getKanbanFolderPath(): string {
  return path.join(getWorkspaceRoot(), KANBAN_FOLDER);
}

/**
 * Show an error message if no workspace is open
 * @returns true if workspace is open, false otherwise
 */
export function ensureWorkspace(): boolean {
  if (!isWorkspaceOpen()) {
    vscode.window.showErrorMessage(
      'LLM Kanban requires an open workspace folder'
    );
    return false;
  }
  return true;
}

/**
 * Get configuration value
 */
export function getConfig<T>(key: string, defaultValue: T): T {
  return vscode.workspace.getConfiguration('llmkanban').get(key, defaultValue);
}

/**
 * Set configuration value
 */
export async function setConfig(key: string, value: any): Promise<void> {
  await vscode.workspace
    .getConfiguration('llmkanban')
    .update(key, value, vscode.ConfigurationTarget.Workspace);
}
