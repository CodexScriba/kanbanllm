/**
 * Initialize .llmkanban workspace
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getKanbanRoot, getStageFolderPath, kanbanFolderExists } from '../core/fs-adapter';
import { STAGES, CONTEXT_FOLDER, STAGES_CONTEXT_FOLDER, PHASES_CONTEXT_FOLDER } from '../core/types';

/**
 * Read template file
 */
async function readTemplate(templateName: string): Promise<string> {
  const templatePath = path.join(__dirname, '..', 'templates', 'stages', `${templateName}.md`);
  return await fs.readFile(templatePath, 'utf-8');
}

/**
 * Initialize .llmkanban folder structure
 */
export async function initWorkspace(workspaceRoot: string): Promise<void> {
  const kanbanRoot = getKanbanRoot(workspaceRoot);

  try {
    // Check if already exists
    const exists = await kanbanFolderExists(workspaceRoot);
    if (exists) {
      const answer = await vscode.window.showWarningMessage(
        '.llmkanban folder already exists. Reinitialize?',
        'Yes',
        'No'
      );

      if (answer !== 'Yes') {
        return;
      }
    }

    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Initializing LLM Kanban workspace...',
        cancellable: false
      },
      async (progress) => {
        // Create main folder
        progress.report({ message: 'Creating folder structure...' });
        await fs.mkdir(kanbanRoot, { recursive: true });

        // Create stage folders
        for (const stage of STAGES) {
          const stagePath = getStageFolderPath(workspaceRoot, stage);
          await fs.mkdir(stagePath, { recursive: true });
        }

        // Create context folders
        const contextRoot = path.join(kanbanRoot, CONTEXT_FOLDER);
        await fs.mkdir(contextRoot, { recursive: true });

        const stagesContextPath = path.join(contextRoot, STAGES_CONTEXT_FOLDER);
        await fs.mkdir(stagesContextPath, { recursive: true });

        const phasesContextPath = path.join(contextRoot, PHASES_CONTEXT_FOLDER);
        await fs.mkdir(phasesContextPath, { recursive: true });

        // Create stage context files
        progress.report({ message: 'Creating stage context templates...' });
        for (const stage of STAGES) {
          try {
            const template = await readTemplate(stage);
            const contextFilePath = path.join(stagesContextPath, `${stage}.md`);
            await fs.writeFile(contextFilePath, template, 'utf-8');
          } catch (error) {
            console.error(`Error creating context file for ${stage}:`, error);
          }
        }

        // Create architecture.md
        progress.report({ message: 'Creating architecture documentation...' });
        const architectureContent = `# Architecture & Design

This document describes the system architecture and design decisions for your project.

## Overview

[Add your project overview here]

## Architecture

[Describe your system architecture]

## Key Design Decisions

[Document important design decisions]

## Technology Stack

[List technologies used]

## Notes

This file is for your reference and can be included in task context as needed.
`;
        await fs.writeFile(path.join(contextRoot, 'architecture.md'), architectureContent, 'utf-8');

        progress.report({ message: 'Done!' });
      }
    );

    // Show success message
    vscode.window.showInformationMessage(
      'LLM Kanban workspace initialized successfully!',
      'Open Kanban Board'
    ).then(selection => {
      if (selection === 'Open Kanban Board') {
        vscode.commands.executeCommand('llmkanban.refreshBoard');
      }
    });

  } catch (error) {
    vscode.window.showErrorMessage(`Failed to initialize workspace: ${error}`);
    console.error('Init workspace error:', error);
  }
}
