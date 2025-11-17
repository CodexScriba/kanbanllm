/**
 * File watcher utility for monitoring .llmkanban folder changes
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { KANBAN_FOLDER } from '../core/types';

/**
 * Debounce utility
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Create file watcher for .llmkanban folder
 */
export function createKanbanFileWatcher(
  workspaceRoot: string,
  onChange: () => void
): vscode.FileSystemWatcher {
  const kanbanPath = path.join(workspaceRoot, KANBAN_FOLDER);
  const pattern = new vscode.RelativePattern(kanbanPath, '**/*.md');

  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  // Debounce the onChange callback to avoid rapid successive calls
  const debouncedOnChange = debounce(onChange, 500);

  watcher.onDidCreate(() => debouncedOnChange());
  watcher.onDidChange(() => debouncedOnChange());
  watcher.onDidDelete(() => debouncedOnChange());

  return watcher;
}
