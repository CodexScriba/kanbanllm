/**
 * Create task command
 * Quick input UI for creating new tasks
 */

import * as vscode from 'vscode';
import { getWorkspaceRoot, ensureWorkspace, getConfig } from '../utils/workspace';
import { Item, ItemFrontmatter, Stage } from '../core/types';
import {
  loadAllItems,
  generateTaskId,
  writeItem,
  kanbanFolderExists,
} from '../core/fs-adapter';
import { injectInitialContext } from '../core/context-injector';

/**
 * Create a new task
 */
export async function createTask(): Promise<void> {
  if (!ensureWorkspace()) {
    return;
  }

  const workspaceRoot = getWorkspaceRoot();

  // Check if .llmkanban exists
  if (!(await kanbanFolderExists(workspaceRoot))) {
    const choice = await vscode.window.showWarningMessage(
      'LLM Kanban is not initialized in this workspace.',
      'Initialize Now'
    );

    if (choice === 'Initialize Now') {
      await vscode.commands.executeCommand('llmkanban.init');
      return;
    }
    return;
  }

  try {
    // Get task title
    const title = await vscode.window.showInputBox({
      prompt: 'Enter task title',
      placeHolder: 'e.g., Build navigation bar',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Title cannot be empty';
        }
        return undefined;
      },
    });

    if (!title) {
      return;
    }

    // Load all items to get phases
    const items = await loadAllItems(workspaceRoot);
    const phases = items.filter((item) => item.frontmatter.type === 'phase');

    if (phases.length === 0) {
      const choice = await vscode.window.showWarningMessage(
        'No phases found. Create a phase first, or create one now?',
        'Create Phase',
        'Cancel'
      );

      if (choice === 'Create Phase') {
        await vscode.commands.executeCommand('llmkanban.createPhase');
        return;
      }
      return;
    }

    // Select phase
    const phaseItems = phases.map((phase) => ({
      label: phase.frontmatter.title,
      description: phase.frontmatter.id,
      phase,
    }));

    const selectedPhase = await vscode.window.showQuickPick(phaseItems, {
      placeHolder: 'Select a phase for this task',
    });

    if (!selectedPhase) {
      return;
    }

    // Get tags (optional)
    const tagsInput = await vscode.window.showInputBox({
      prompt: 'Enter tags (comma-separated, optional)',
      placeHolder: 'e.g., ui, react, frontend',
    });

    const tags = tagsInput
      ? tagsInput.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

    // Get default stage from config
    const defaultStage = getConfig<Stage>('defaultStage', 'backlog');

    // Generate task ID
    const taskId = await generateTaskId(
      workspaceRoot,
      title,
      selectedPhase.phase.frontmatter.id
    );

    // Create task frontmatter
    const now = new Date().toISOString();
    const frontmatter: ItemFrontmatter = {
      id: taskId,
      type: 'task',
      title: title.trim(),
      stage: defaultStage,
      phase: selectedPhase.phase.frontmatter.id,
      created: now,
      updated: now,
      tags: tags.length > 0 ? tags : undefined,
    };

    // Create item
    let item: Item = {
      frontmatter,
      managedSection: '',
      userContent: '## Notes\n\nAdd your implementation notes here.',
      body: '',
    };

    // Inject initial context
    item = await injectInitialContext(workspaceRoot, item);

    // Write to file
    await writeItem(workspaceRoot, item, defaultStage);

    // Show success and offer to open
    const choice = await vscode.window.showInformationMessage(
      `Task "${title}" created successfully!`,
      'Open Task',
      'View Board'
    );

    if (choice === 'Open Task') {
      const filePath = item.filePath || `${taskId}.md`;
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    } else if (choice === 'View Board') {
      await vscode.commands.executeCommand('llmkanban.openBoard');
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
