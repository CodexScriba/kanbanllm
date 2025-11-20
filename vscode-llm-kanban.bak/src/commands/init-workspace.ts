/**
 * Initialize workspace command
 * Creates the .llmkanban folder structure and default templates
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getWorkspaceRoot, ensureWorkspace } from '../utils/workspace';
import { KANBAN_FOLDER, STAGES } from '../core/types';
import { kanbanFolderExists } from '../core/fs-adapter';

/**
 * Read a template file from the extension's resources
 */
async function readTemplate(context: vscode.ExtensionContext, relativePath: string): Promise<string> {
  const templatePath = path.join(context.extensionPath, 'src', 'templates', relativePath);
  try {
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    // Template file not found, return empty string
    console.warn(`Template not found: ${templatePath}`);
    return '';
  }
}

/**
 * Write a file with directory creation
 */
async function writeFileWithDir(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Initialize the .llmkanban folder structure
 */
export async function initWorkspace(context: vscode.ExtensionContext): Promise<void> {
  if (!ensureWorkspace()) {
    return;
  }

  const workspaceRoot = getWorkspaceRoot();
  const kanbanRoot = path.join(workspaceRoot, KANBAN_FOLDER);

  // Check if already initialized
  if (await kanbanFolderExists(workspaceRoot)) {
    const choice = await vscode.window.showWarningMessage(
      'The .llmkanban folder already exists. Do you want to reinitialize?',
      'Yes',
      'No'
    );

    if (choice !== 'Yes') {
      return;
    }
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Initializing LLM Kanban workspace...',
        cancellable: false,
      },
      async (progress) => {
        // Create main folder structure
        progress.report({ message: 'Creating folder structure...' });

        // Create stage folders
        for (const stage of STAGES) {
          await fs.mkdir(path.join(kanbanRoot, stage), { recursive: true });
        }

        // Create context folders
        await fs.mkdir(path.join(kanbanRoot, '_context', 'stages'), { recursive: true });
        await fs.mkdir(path.join(kanbanRoot, '_context', 'phases'), { recursive: true });

        progress.report({ message: 'Copying templates...', increment: 30 });

        // Copy stage context templates
        for (const stage of STAGES) {
          const template = await readTemplate(context, `stages/${stage}.md`);
          const targetPath = path.join(kanbanRoot, '_context', 'stages', `${stage}.md`);
          await writeFileWithDir(targetPath, template);
        }

        progress.report({ message: 'Creating architecture file...', increment: 30 });

        // Copy architecture template
        const architectureTemplate = await readTemplate(context, 'architecture.md');
        const architecturePath = path.join(kanbanRoot, '_context', 'architecture.md');
        await writeFileWithDir(architecturePath, architectureTemplate);

        progress.report({ message: 'Creating design file...', increment: 20 });

        // Create a design.md placeholder
        const designPath = path.join(kanbanRoot, '_context', 'design.md');
        const designTemplate = `# Design Context

Add design decisions, UI/UX guidelines, and design system documentation here.

This context will be available when working with LLMs to maintain design consistency.
`;
        await writeFileWithDir(designPath, designTemplate);

        progress.report({ message: 'Finalizing...', increment: 20 });
      }
    );

    // Show success message
    const choice = await vscode.window.showInformationMessage(
      'LLM Kanban workspace initialized successfully!',
      'Open Architecture File',
      'View Folder'
    );

    if (choice === 'Open Architecture File') {
      const architecturePath = path.join(kanbanRoot, '_context', 'architecture.md');
      const doc = await vscode.workspace.openTextDocument(architecturePath);
      await vscode.window.showTextDocument(doc);
    } else if (choice === 'View Folder') {
      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(kanbanRoot));
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to initialize workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
