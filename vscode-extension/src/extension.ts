import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { KanbanPanel } from './webview/KanbanPanel';
import {
  bindKanbanRoot,
  ensureKanbanWorkspace,
  isKanbanWorkspaceInitialized,
} from './workspace/KanbanWorkspace';
import { moveItemToStage, deleteItemById, readItemById, loadBoardData, createItem, type FlatItem } from './core/fs-adapter';
import { Stage } from './core/types';

/**
 * Extension activation entry point - Complete implementation
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('LLM Kanban extension is now active');

  // Attempt to bind the kanban root on activation (best effort)
  void bindKanbanRoot(false).catch(() => undefined);

  // Create and register the sidebar tree view provider
  const sidebarProvider = new SidebarProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('llmKanban.treeView', sidebarProvider)
  );

  // File watcher for auto-refresh
  let fileWatcher: vscode.FileSystemWatcher | undefined;
  const workspaceRoot = getWorkspaceRoot();
  if (workspaceRoot) {
    const llmkanbanPath = path.join(workspaceRoot, '.llmkanban');
    fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(llmkanbanPath, '**/*.md')
    );

    fileWatcher.onDidChange(() => sidebarProvider.refresh());
    fileWatcher.onDidCreate(() => sidebarProvider.refresh());
    fileWatcher.onDidDelete(() => sidebarProvider.refresh());

    context.subscriptions.push(fileWatcher);
  }

  // ========== COMMANDS ==========

  // Open Kanban Board
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.openBoard', async () => {
      try {
        await bindKanbanRoot(true);
        KanbanPanel.createOrShow(context.extensionUri);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to open Kanban board.';
        const action = await vscode.window.showErrorMessage(
          message,
          'Initialize Workspace'
        );
        if (action === 'Initialize Workspace') {
          void vscode.commands.executeCommand('llmKanban.initializeWorkspace');
        }
      }
    })
  );

  // Initialize Workspace (using main's implementation)
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.initializeWorkspace', async () => {
      try {
        const result = await ensureKanbanWorkspace();
        sidebarProvider.refresh();
        vscode.window.showInformationMessage(
          result.created
            ? 'LLM Kanban workspace initialized with default structure.'
            : 'LLM Kanban workspace already exists.'
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to initialize workspace.';
        vscode.window.showErrorMessage(message);
      }
    })
  );

  // Create Task
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.createTask', async () => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      try {
        await createTaskWorkflow(workspaceRoot);
        sidebarProvider.refresh();
      } catch (error) {
        vscode.window.showErrorMessage(`Error creating task: ${error}`);
      }
    })
  );

  // Create Phase
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.createPhase', async () => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      try {
        await createPhaseWorkflow(workspaceRoot);
        sidebarProvider.refresh();
      } catch (error) {
        vscode.window.showErrorMessage(`Error creating phase: ${error}`);
      }
    })
  );

  // Move Task
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.moveTask', async (itemId?: string) => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      try {
        await moveTaskWorkflow(workspaceRoot, itemId);
        sidebarProvider.refresh();
      } catch (error) {
        vscode.window.showErrorMessage(`Error moving task: ${error}`);
      }
    })
  );

  // Copy with Context
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.copyWithContext', async (itemId?: string) => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      try {
        await copyWithContextWorkflow(workspaceRoot, itemId);
      } catch (error) {
        vscode.window.showErrorMessage(`Error copying: ${error}`);
      }
    })
  );

  // Delete Item
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.deleteItem', async (itemId?: string) => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      try {
        await deleteItemWorkflow(workspaceRoot, itemId);
        sidebarProvider.refresh();
      } catch (error) {
        vscode.window.showErrorMessage(`Error deleting item: ${error}`);
      }
    })
  );

  // Open Item from Sidebar
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.openItemFromSidebar', async (itemId: string) => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot) return;

      try {
        const item = await readItemById(workspaceRoot, itemId);
        if (!item) {
          vscode.window.showErrorMessage(`Item ${itemId} not found`);
          return;
        }

        const stageFolderName = getStageFolderName(item.stage);
        const filePath = path.join(workspaceRoot, '.llmkanban', stageFolderName, `${item.id}.md`);

        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);
      } catch (error) {
        vscode.window.showErrorMessage(`Error opening item: ${error}`);
      }
    })
  );

  // Refresh Sidebar
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.refreshSidebar', async () => {
      const initialized = await isKanbanWorkspaceInitialized();
      sidebarProvider.refresh();
      if (!initialized) {
        vscode.window.showWarningMessage(
          'LLM Kanban workspace not initialized yet. Run "LLM Kanban: Initialize Workspace" to get started.'
        );
      } else {
        vscode.window.showInformationMessage('LLM Kanban sidebar refreshed');
      }
    })
  );

  // Migrate workspace to canonical filenames
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.migrateWorkspace', async () => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        'This will rename all item files to the canonical format (stage.id.md). Continue?',
        'Yes', 'No'
      );

      if (confirm !== 'Yes') {
        return;
      }

      try {
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'Migrating workspace...',
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 0, message: 'Renaming files...' });
          
          const { migrateToCanonicalFilenames } = await import('./core/fs-adapter.js');
          await migrateToCanonicalFilenames(workspaceRoot);
          
          progress.report({ increment: 100, message: 'Complete' });
        });

        vscode.window.showInformationMessage('Workspace migration complete!');
        sidebarProvider.refresh();
      } catch (error) {
        vscode.window.showErrorMessage(`Migration failed: ${error}`);
      }
    })
  );

  // Settings (placeholder)
  context.subscriptions.push(
    vscode.commands.registerCommand('llmKanban.openSettings', () => {
      vscode.window.showInformationMessage('Settings - Coming soon!');
    })
  );
}

// ========== HELPER FUNCTIONS ==========

function getWorkspaceRoot(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri.fsPath;
  }
  return undefined;
}

function getStageFolderName(stage: Stage): string {
  const folderMap: Record<Stage, string> = {
    queue: '1-queue',
    plan: '2-planning',
    code: '3-coding',
    audit: '4-auditing',
    completed: '5-completed',
    chat: 'chat'
  };
  return folderMap[stage];
}

async function initializeWorkspace(workspaceRoot: string): Promise<void> {
  const llmkanbanPath = path.join(workspaceRoot, '.llmkanban');

  // Create folder structure
  const folders = [
    llmkanbanPath,
    path.join(llmkanbanPath, '1-queue'),
    path.join(llmkanbanPath, '2-planning'),
    path.join(llmkanbanPath, '3-coding'),
    path.join(llmkanbanPath, '4-auditing'),
    path.join(llmkanbanPath, '5-completed'),
    path.join(llmkanbanPath, '_context'),
    path.join(llmkanbanPath, '_context', 'stages'),
    path.join(llmkanbanPath, '_context', 'phases'),
  ];

  for (const folder of folders) {
    await fs.mkdir(folder, { recursive: true });
  }

  // Create default context files
  const stageContexts: Record<Stage, string> = {
    queue: '# Queue Stage\n\nItems waiting to be planned and executed.',
    plan: '# Plan Stage\n\nTask refinement and specification.',
    code: '# Code Stage\n\nActive implementation.',
    audit: '# Audit Stage\n\nReview and validation.',
    completed: '# Completed Stage\n\nFinished items.',
    chat: '# Chat Stage\n\nCapture prompts and ideas from LLM chats.',
  };

  for (const [stage, content] of Object.entries(stageContexts)) {
    const filePath = path.join(llmkanbanPath, '_context', 'stages', `${stage}.md`);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  // Create README
  const readme = `# LLM Kanban Workspace

This folder contains your LLM-assisted development task board.

## Structure

- \`1-queue/\` - Tasks waiting to be started
- \`2-planning/\` - Tasks in planning phase
- \`3-coding/\` - Tasks being implemented
- \`4-auditing/\` - Tasks under review
- \`5-completed/\` - Completed tasks
- \`_context/\` - Context templates for stages and phases

## Usage

Use the LLM Kanban extension in VSCode to:
- Create and manage tasks
- Move tasks between stages
- Copy tasks with context for LLM interactions
`;

  await fs.writeFile(path.join(llmkanbanPath, 'README.md'), readme, 'utf-8');
}

async function createTaskWorkflow(workspaceRoot: string): Promise<void> {
  // Step 1: Get title
  const title = await vscode.window.showInputBox({
    prompt: 'Enter task title',
    placeHolder: 'e.g., Implement user authentication',
    validateInput: (value) => value.trim() ? null : 'Title cannot be empty'
  });

  if (!title) return;

  // Step 2: Select stage
  const stageOptions = [
    { label: 'Queue', value: 'queue' as Stage },
    { label: 'Plan', value: 'plan' as Stage },
    { label: 'Code', value: 'code' as Stage },
    { label: 'Audit', value: 'audit' as Stage },
    { label: 'Completed', value: 'completed' as Stage },
  ];

  const stageChoice = await vscode.window.showQuickPick(stageOptions, {
    placeHolder: 'Select target stage'
  });

  if (!stageChoice) return;

  // Step 3: Select phase (optional)
  const boardData = await loadBoardData(workspaceRoot);
  const allPhases = Object.values(boardData)
    .flat()
    .filter(item => item.type === 'phase');

  const phaseOptions = [
    { label: '(No phase)', value: undefined },
    ...allPhases.map(phase => ({ label: phase.title, value: phase.id }))
  ];

  const phaseChoice = await vscode.window.showQuickPick(phaseOptions, {
    placeHolder: 'Select parent phase (optional)'
  });

  if (!phaseChoice) return;

  // Step 4: Add tags (optional)
  const tagsInput = await vscode.window.showInputBox({
    prompt: 'Enter tags (comma-separated, optional)',
    placeHolder: 'e.g., backend, api, authentication'
  });

  const tags = tagsInput
    ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
    : [];

  // Create the task
  await createItem(workspaceRoot, {
    title: title.trim(),
    stage: stageChoice.value,
    type: 'task',
    phaseId: phaseChoice.value,
    tags,
  });

  vscode.window.showInformationMessage(`Task "${title}" created successfully!`);
}

async function createPhaseWorkflow(workspaceRoot: string): Promise<void> {
  // Step 1: Get title
  const title = await vscode.window.showInputBox({
    prompt: 'Enter phase title',
    placeHolder: 'e.g., User Authentication System',
    validateInput: (value) => value.trim() ? null : 'Title cannot be empty'
  });

  if (!title) return;

  // Step 2: Select stage
  const stageOptions = [
    { label: 'Queue', value: 'queue' as Stage },
    { label: 'Plan', value: 'plan' as Stage },
    { label: 'Code', value: 'code' as Stage },
    { label: 'Audit', value: 'audit' as Stage },
    { label: 'Completed', value: 'completed' as Stage },
  ];

  const stageChoice = await vscode.window.showQuickPick(stageOptions, {
    placeHolder: 'Select target stage'
  });

  if (!stageChoice) return;

  // Step 3: Add tags (optional)
  const tagsInput = await vscode.window.showInputBox({
    prompt: 'Enter tags (comma-separated, optional)',
    placeHolder: 'e.g., feature, milestone'
  });

  const tags = tagsInput
    ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
    : [];

  // Create the phase
  const item = await createItem(workspaceRoot, {
    title: title.trim(),
    stage: stageChoice.value,
    type: 'phase',
    tags,
  });

  // Create phase context file
  const phaseContextPath = path.join(
    workspaceRoot,
    '.llmkanban',
    '_context',
    'phases',
    `${item.id}.md`
  );

  const phaseContextContent = `# ${title}\n\nPhase-specific context and information.\n`;
  await fs.writeFile(phaseContextPath, phaseContextContent, 'utf-8');

  vscode.window.showInformationMessage(`Phase "${title}" created successfully!`);
}

async function moveTaskWorkflow(workspaceRoot: string, itemId?: string): Promise<void> {
  // If no itemId provided, ask user to select
  if (!itemId) {
    const boardData = await loadBoardData(workspaceRoot);
    const allItems = Object.values(boardData).flat();

    const itemOptions = allItems.map(item => ({
      label: item.title,
      description: `${item.type} in ${item.stage}`,
      value: item.id
    }));

    const itemChoice = await vscode.window.showQuickPick(itemOptions, {
      placeHolder: 'Select item to move'
    });

    if (!itemChoice) return;
    itemId = itemChoice.value;
  }

  // Get current item
  const item = await readItemById(workspaceRoot, itemId!);
  if (!item) {
    vscode.window.showErrorMessage('Item not found');
    return;
  }

  // Select target stage
  const stageOptions = [
    { label: 'Queue', value: 'queue' as Stage },
    { label: 'Plan', value: 'plan' as Stage },
    { label: 'Code', value: 'code' as Stage },
    { label: 'Audit', value: 'audit' as Stage },
    { label: 'Completed', value: 'completed' as Stage },
  ].filter(option => option.value !== item.stage); // Exclude current stage

  const stageChoice = await vscode.window.showQuickPick(stageOptions, {
    placeHolder: `Move "${item.title}" to...`
  });

  if (!stageChoice) return;

  // Move the item
  await moveItemToStage(workspaceRoot, itemId!, stageChoice.value);
  vscode.window.showInformationMessage(`Moved "${item.title}" to ${stageChoice.label}`);
}

async function copyWithContextWorkflow(workspaceRoot: string, itemId?: string): Promise<void> {
  // If no itemId provided, ask user to select
  if (!itemId) {
    const boardData = await loadBoardData(workspaceRoot);
    const allItems = Object.values(boardData).flat();

    const itemOptions = allItems.map(item => ({
      label: item.title,
      description: `${item.type} in ${item.stage}`,
      value: item.id
    }));

    const itemChoice = await vscode.window.showQuickPick(itemOptions, {
      placeHolder: 'Select item to copy'
    });

    if (!itemChoice) return;
    itemId = itemChoice.value;
  }

  // Get item
  const item = await readItemById(workspaceRoot, itemId!);
  if (!item) {
    vscode.window.showErrorMessage('Item not found');
    return;
  }

  // Select copy mode
  const modeOptions = [
    {
      label: 'Full',
      description: 'Frontmatter + Managed + User content',
      value: 'full'
    },
    {
      label: 'Context + Content',
      description: 'Managed section + User content only',
      value: 'context'
    },
    {
      label: 'User Content Only',
      description: 'Pure user-written content',
      value: 'user'
    }
  ];

  const modeChoice = await vscode.window.showQuickPick(modeOptions, {
    placeHolder: 'Select copy mode'
  });

  if (!modeChoice) return;

  // Build text to copy
  let textToCopy = '';
  switch (modeChoice.value) {
    case 'full':
      // For full mode, reconstruct from managed section and user content
      textToCopy = (item.managedSection || '') + '\n' + (item.userContent || '');
      break;
    case 'context':
      textToCopy = (item.managedSection || '') + '\n\n' + (item.userContent || '');
      break;
    case 'user':
      textToCopy = item.userContent || '';
      break;
  }

  await vscode.env.clipboard.writeText(textToCopy);
  vscode.window.showInformationMessage(
    `Copied ${textToCopy.length} characters (${modeChoice.label} mode)`
  );
}

async function deleteItemWorkflow(workspaceRoot: string, itemId?: string): Promise<void> {
  // If no itemId provided, ask user to select
  if (!itemId) {
    const boardData = await loadBoardData(workspaceRoot);
    const allItems = Object.values(boardData).flat();

    const itemOptions = allItems.map(item => ({
      label: item.title,
      description: `${item.type} in ${item.stage}`,
      value: item.id
    }));

    const itemChoice = await vscode.window.showQuickPick(itemOptions, {
      placeHolder: 'Select item to delete'
    });

    if (!itemChoice) return;
    itemId = itemChoice.value;
  }

  // Get item for confirmation
  const item = await readItemById(workspaceRoot, itemId!);
  if (!item) {
    vscode.window.showErrorMessage('Item not found');
    return;
  }

  // Confirm deletion
  const confirm = await vscode.window.showWarningMessage(
    `Delete "${item.title}"?`,
    { modal: true },
    'Delete'
  );

  if (confirm !== 'Delete') return;

  // Delete the item
  await deleteItemById(workspaceRoot, itemId!);
  vscode.window.showInformationMessage(`Deleted "${item.title}"`);
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('LLM Kanban extension is now deactivated');
}
