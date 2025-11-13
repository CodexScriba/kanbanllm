/**
 * Move task command
 * Move a task to a different stage with context re-injection
 */

import * as vscode from 'vscode';
import { getWorkspaceRoot, ensureWorkspace } from '../utils/workspace';
import { Stage, STAGES, STAGE_DISPLAY_NAMES } from '../core/types';
import {
  findItem,
  moveItem,
  writeItem,
  readItem,
} from '../core/fs-adapter';
import { reinjectContextForStageChange } from '../core/context-injector';
import { serializeItem } from '../core/parser';

/**
 * Move a task to a different stage
 * Can be called from editor or tree view
 */
export async function moveTask(itemId?: string): Promise<void> {
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
      vscode.window.showErrorMessage(`Task "${itemId}" not found.`);
      return;
    }

    const { item, stage: currentStage } = result;

    // Show stage picker (exclude current stage)
    const stageOptions = STAGES.filter((s) => s !== currentStage).map((stage) => ({
      label: STAGE_DISPLAY_NAMES[stage],
      description: stage,
      stage,
    }));

    const selected = await vscode.window.showQuickPick(stageOptions, {
      placeHolder: `Move "${item.frontmatter.title}" to...`,
    });

    if (!selected) {
      return;
    }

    const newStage = selected.stage;

    // Re-inject context for the new stage
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Moving task to ${STAGE_DISPLAY_NAMES[newStage]}...`,
        cancellable: false,
      },
      async () => {
        // Update item with new stage and context
        const updatedItem = await reinjectContextForStageChange(
          workspaceRoot,
          item,
          newStage
        );

        // Write updated item to new stage
        await writeItem(workspaceRoot, updatedItem, newStage);

        // Delete from old stage (move the file)
        await moveItem(workspaceRoot, itemId!, currentStage, newStage);

        // Re-write to ensure context is properly injected
        const finalItem = await readItem(workspaceRoot, itemId!, newStage);
        if (finalItem) {
          const reinjected = await reinjectContextForStageChange(
            workspaceRoot,
            finalItem,
            newStage
          );
          await writeItem(workspaceRoot, reinjected, newStage);
        }
      }
    );

    vscode.window.showInformationMessage(
      `Moved "${item.frontmatter.title}" to ${STAGE_DISPLAY_NAMES[newStage]}`
    );

    // Refresh tree view
    await vscode.commands.executeCommand('llmkanban.refreshBoard');
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to move task: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
