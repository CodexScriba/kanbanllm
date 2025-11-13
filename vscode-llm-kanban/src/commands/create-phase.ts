/**
 * Create phase command
 * Quick input UI for creating new phases
 */

import * as vscode from 'vscode';
import { getWorkspaceRoot, ensureWorkspace, getConfig } from '../utils/workspace';
import { Item, ItemFrontmatter, Stage } from '../core/types';
import {
  generatePhaseId,
  writeItem,
  kanbanFolderExists,
} from '../core/fs-adapter';
import { injectInitialContext, savePhaseContext } from '../core/context-injector';

/**
 * Create a new phase
 */
export async function createPhase(): Promise<void> {
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
    // Get phase title
    const title = await vscode.window.showInputBox({
      prompt: 'Enter phase title',
      placeHolder: 'e.g., Core MVP',
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

    // Get description (optional)
    const description = await vscode.window.showInputBox({
      prompt: 'Enter phase description (optional)',
      placeHolder: 'e.g., Build foundational features for MVP',
    });

    // Get tags (optional)
    const tagsInput = await vscode.window.showInputBox({
      prompt: 'Enter tags (comma-separated, optional)',
      placeHolder: 'e.g., mvp, foundation, core',
    });

    const tags = tagsInput
      ? tagsInput.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      : [];

    // Get default stage from config
    const defaultStage = getConfig<Stage>('defaultStage', 'backlog');

    // Generate phase ID
    const phaseId = await generatePhaseId(workspaceRoot, title);

    // Create phase frontmatter
    const now = new Date().toISOString();
    const frontmatter: ItemFrontmatter = {
      id: phaseId,
      type: 'phase',
      title: title.trim(),
      stage: defaultStage,
      created: now,
      updated: now,
      tags: tags.length > 0 ? tags : undefined,
    };

    // Create item
    let item: Item = {
      frontmatter,
      managedSection: '',
      userContent: buildPhaseUserContent(description),
      body: '',
    };

    // Inject initial context
    item = await injectInitialContext(workspaceRoot, item);

    // Write to file
    await writeItem(workspaceRoot, item, defaultStage);

    // Create phase context file
    const phaseContextContent = buildPhaseContextTemplate(title, description);
    await savePhaseContext(workspaceRoot, phaseId, phaseContextContent);

    // Show success and offer to open
    const choice = await vscode.window.showInformationMessage(
      `Phase "${title}" created successfully!`,
      'Open Phase',
      'Open Phase Context',
      'View Board'
    );

    if (choice === 'Open Phase') {
      const filePath = item.filePath || `${phaseId}.md`;
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    } else if (choice === 'Open Phase Context') {
      const contextPath = `${workspaceRoot}/.llmkanban/_context/phases/${phaseId}.md`;
      const doc = await vscode.workspace.openTextDocument(contextPath);
      await vscode.window.showTextDocument(doc);
    } else if (choice === 'View Board') {
      await vscode.commands.executeCommand('llmkanban.openBoard');
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to create phase: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build the default user content for a phase
 */
function buildPhaseUserContent(description?: string): string {
  const parts: string[] = ['## Overview'];

  if (description && description.trim()) {
    parts.push('');
    parts.push(description.trim());
  } else {
    parts.push('');
    parts.push('Add phase overview and description here.');
  }

  parts.push('');
  parts.push('## Goals');
  parts.push('');
  parts.push('- Goal 1');
  parts.push('- Goal 2');
  parts.push('- Goal 3');
  parts.push('');
  parts.push('## Success Criteria');
  parts.push('');
  parts.push('- [ ] Criterion 1');
  parts.push('- [ ] Criterion 2');
  parts.push('- [ ] Criterion 3');
  parts.push('');
  parts.push('## Notes');
  parts.push('');
  parts.push('Add additional notes, timelines, or dependencies here.');

  return parts.join('\n');
}

/**
 * Build the default phase context template
 */
function buildPhaseContextTemplate(title: string, description?: string): string {
  const parts: string[] = [`# 📦 Phase: ${title}`];

  parts.push('');
  parts.push('## Overview');
  parts.push('');

  if (description && description.trim()) {
    parts.push(description.trim());
  } else {
    parts.push('This phase focuses on [describe the main focus areas].');
  }

  parts.push('');
  parts.push('## Goals');
  parts.push('');
  parts.push('- Goal 1');
  parts.push('- Goal 2');
  parts.push('- Goal 3');
  parts.push('');
  parts.push('## Success Criteria');
  parts.push('');
  parts.push('- All features functional');
  parts.push('- Tests passing');
  parts.push('- Documentation complete');
  parts.push('');
  parts.push('## Dependencies');
  parts.push('');
  parts.push('- Dependency 1');
  parts.push('- Dependency 2');
  parts.push('');
  parts.push('## Notes');
  parts.push('');
  parts.push('Add any additional context that tasks in this phase should be aware of.');

  return parts.join('\n');
}
