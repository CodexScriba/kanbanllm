/**
 * Copy with context command
 * Copies task content with various levels of context to clipboard
 */

import * as vscode from 'vscode';
import { getWorkspaceRoot, ensureWorkspace } from '../utils/workspace';
import { findItem } from '../core/fs-adapter';
import { serializeItem } from '../core/parser';
import { CopyMode } from '../core/types';

/**
 * Copy a task with context to clipboard
 */
export async function copyWithContext(itemId?: string): Promise<void> {
  if (!ensureWorkspace()) {
    return;
  }

  const workspaceRoot = getWorkspaceRoot();

  try {
    // If no itemId provided, try to get from active editor
    if (!itemId) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const fileName = editor.document.fileName;
        if (fileName.includes('.llmkanban') && fileName.endsWith('.md')) {
          // Extract itemId from filename
          const match = fileName.match(/([^/\\]+)\.md$/);
          if (match) {
            itemId = match[1];
          }
        }
      }
    }

    if (!itemId) {
      vscode.window.showErrorMessage('No task selected. Open a task file or select from the tree view.');
      return;
    }

    // Find the item
    const result = await findItem(workspaceRoot, itemId);
    if (!result) {
      vscode.window.showErrorMessage(`Item "${itemId}" not found.`);
      return;
    }

    const { item } = result;

    // Show copy mode picker
    const modeOptions = [
      {
        label: '📄 Full Document',
        description: 'Frontmatter + Managed Section + User Content',
        mode: 'full' as CopyMode,
      },
      {
        label: '📋 Context + Content',
        description: 'Managed Section + User Content (no frontmatter)',
        mode: 'context-content' as CopyMode,
      },
      {
        label: '✏️ User Content Only',
        description: 'Only your freeform notes',
        mode: 'user-only' as CopyMode,
      },
    ];

    const selected = await vscode.window.showQuickPick(modeOptions, {
      placeHolder: `Copy "${item.frontmatter.title}" as...`,
    });

    if (!selected) {
      return;
    }

    // Build the content based on selected mode
    let content: string;
    switch (selected.mode) {
      case 'full':
        content = serializeItem(item);
        break;
      case 'context-content':
        content = buildContextContent(item);
        break;
      case 'user-only':
        content = item.userContent;
        break;
    }

    // Copy to clipboard
    await vscode.env.clipboard.writeText(content);

    // Show success notification
    const charCount = content.length;
    vscode.window.showInformationMessage(
      `Copied "${item.frontmatter.title}" to clipboard (${charCount} characters)`
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to copy with context: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build context + content (without frontmatter)
 */
function buildContextContent(item: any): string {
  const parts: string[] = [];

  if (item.managedSection && item.managedSection.trim()) {
    parts.push(item.managedSection);
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  if (item.userContent && item.userContent.trim()) {
    parts.push(item.userContent);
  }

  return parts.join('\n');
}
