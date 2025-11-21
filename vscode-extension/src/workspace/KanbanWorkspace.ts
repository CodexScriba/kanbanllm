import { promises as fs } from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import type { Stage } from '../core/types';
import { configureWorkspaceRoot } from '../core/fs-adapter';

const KANBAN_FOLDER_NAME = '.llmkanban';
const STAGE_ORDER: Stage[] = ['chat', 'queue', 'plan', 'code', 'audit', 'completed'];

const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  chat: 'Capture prompts, clarifications, or spark ideas that originate in LLM chats.',
  queue: 'Stage tasks that are ready for AI agents to pick up next.',
  plan: 'Task refinement and specification work before code is written.',
  code: 'Active implementation by AI coding assistants or the developer.',
  audit: 'Review, QA, and validation work before marking items as complete.',
  completed: 'A permanent record of tasks that have shipped.',
};

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.workspaceFolders?.[0];
}

export function getWorkspaceRootPath(): string | undefined {
  return getWorkspaceFolder()?.uri.fsPath;
}

export async function bindKanbanRoot(requireInitialized: boolean = false): Promise<string> {
  const rootPath = getWorkspaceRootPath();
  if (!rootPath) {
    throw new Error('Open a folder workspace before using LLM Kanban.');
  }

  const kanbanRoot = path.join(rootPath, KANBAN_FOLDER_NAME);

  if (requireInitialized) {
    const exists = await pathExists(kanbanRoot);
    if (!exists) {
      throw new Error('No .llmkanban folder found. Run "LLM Kanban: Initialize Workspace" first.');
    }
  }

  configureWorkspaceRoot(rootPath);
  return kanbanRoot;
}

export async function ensureKanbanWorkspace(): Promise<{
  created: boolean;
  root: string;
}> {
  const workspaceRoot = await bindKanbanRoot(false);
  const kanbanRoot = path.join(workspaceRoot, KANBAN_FOLDER_NAME);

  const alreadyExists = await pathExists(kanbanRoot);
  await fs.mkdir(kanbanRoot, { recursive: true });

  // Create stage folders
  await Promise.all(
    STAGE_ORDER.map(stage => fs.mkdir(path.join(kanbanRoot, stage), { recursive: true }))
  );

  // Context folders
  const stageContextDir = path.join(kanbanRoot, '_context', 'stages');
  const phaseContextDir = path.join(kanbanRoot, '_context', 'phases');
  const agentContextDir = path.join(kanbanRoot, '_context', 'agents');
  
  await fs.mkdir(stageContextDir, { recursive: true });
  await fs.mkdir(phaseContextDir, { recursive: true });
  await fs.mkdir(agentContextDir, { recursive: true });

  // Ensure basic stage context files exist
  await Promise.all(
    STAGE_ORDER.map(async stage => {
      const stageFile = path.join(stageContextDir, `${stage}.md`);
      if (await pathExists(stageFile)) {
        return;
      }
      const content = `# ${stage.charAt(0).toUpperCase() + stage.slice(1)} Stage\n\n${
        STAGE_DESCRIPTIONS[stage]
      }\n`;
      await fs.writeFile(stageFile, content, 'utf-8');
    })
  );

  return {
    created: !alreadyExists,
    root: kanbanRoot,
  };
}

export async function isKanbanWorkspaceInitialized(): Promise<boolean> {
  const rootPath = getWorkspaceRootPath();
  if (!rootPath) {
    return false;
  }
  return pathExists(path.join(rootPath, KANBAN_FOLDER_NAME));
}
