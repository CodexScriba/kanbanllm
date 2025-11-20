/**
 * File watcher utility
 * Monitors .llmkanban folder for changes
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { KANBAN_FOLDER } from '../core/types';

export type FileChangeCallback = () => void;

/**
 * Create a file watcher for the .llmkanban folder
 * @param workspaceRoot - The workspace root path
 * @param callback - Function to call when files change
 * @param debounceMs - Debounce delay in milliseconds (default: 500)
 * @returns Disposable to stop watching
 */
export function watchKanbanFolder(
  workspaceRoot: string,
  callback: FileChangeCallback,
  debounceMs: number = 500
): vscode.Disposable {
  const pattern = new vscode.RelativePattern(
    workspaceRoot,
    `${KANBAN_FOLDER}/**/*.md`
  );

  const watcher = vscode.workspace.createFileSystemWatcher(
    pattern,
    false, // ignoreCreateEvents
    false, // ignoreChangeEvents
    false  // ignoreDeleteEvents
  );

  // Debounce mechanism
  let debounceTimer: NodeJS.Timeout | null = null;

  const debouncedCallback = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      callback();
      debounceTimer = null;
    }, debounceMs);
  };

  // Watch for changes
  const createDisposable = watcher.onDidCreate(debouncedCallback);
  const changeDisposable = watcher.onDidChange(debouncedCallback);
  const deleteDisposable = watcher.onDidDelete(debouncedCallback);

  // Return a composite disposable
  return vscode.Disposable.from(
    watcher,
    createDisposable,
    changeDisposable,
    deleteDisposable
  );
}
