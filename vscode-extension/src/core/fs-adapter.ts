// lib/fs-adapter.ts
import { promises as fs } from 'fs';
import path from 'path';
import type { Stage, Item } from './types';
import {
  USER_CONTENT_START,
  parseItem,
  serializeItem,
  extractUserContent,
  buildManagedSection,
} from './parser';

const KANBAN_FOLDER_NAME = '.llmkanban';
let workspaceRoot: string | null = null;

/**
 * Configure the workspace root where the .llmkanban folder lives.
 * Must be called by the extension before any FS operations are performed.
 */
export function configureWorkspaceRoot(rootPath: string): void {
  workspaceRoot = rootPath;
}

/**
 * Resolves the absolute kanban root path.
 */
export function getKanbanRootPath(): string {
  if (!workspaceRoot) {
    throw new Error('Kanban workspace root has not been configured');
  }
  return path.resolve(path.join(workspaceRoot, KANBAN_FOLDER_NAME));
}

/**
 * Validates that a path resolves inside the kanban directory
 */
function validatePath(filePath: string): string {
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = getKanbanRootPath();

  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new Error(`Path ${filePath} is outside of ${KANBAN_FOLDER_NAME} directory`);
  }

  return resolvedPath;
}

/**
 * Lists all .md files in a given stage folder
 */
export async function listItemsInStage(stage: Stage): Promise<string[]> {
  const stagePath = validatePath(path.join(getKanbanRootPath(), stage));

  try {
    const files = await fs.readdir(stagePath);
    const mdFiles = files
      .filter(file => file.endsWith('.md') && !file.startsWith('.'))
      .map(file => path.join(stagePath, file));

    return mdFiles;
  } catch (error) {
    // If directory doesn't exist or is empty, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Reads the content of a file
 */
export async function readItem(filePath: string): Promise<string> {
  const validatedPath = validatePath(filePath);
  return await fs.readFile(validatedPath, 'utf-8');
}

/**
 * Writes content to a file (creates parent directories if needed)
 */
export async function writeItem(filePath: string, content: string): Promise<void> {
  const validatedPath = validatePath(filePath);
  const dirPath = path.dirname(validatedPath);

  // Create parent directory if it doesn't exist
  await fs.mkdir(dirPath, { recursive: true });

  await fs.writeFile(validatedPath, content, 'utf-8');
}

/**
 * Moves a file from one location to another
 */
export async function moveItem(fromPath: string, toPath: string): Promise<void> {
  const validatedFromPath = validatePath(fromPath);
  const validatedToPath = validatePath(toPath);
  const toDirPath = path.dirname(validatedToPath);

  // Create destination directory if it doesn't exist
  await fs.mkdir(toDirPath, { recursive: true });

  // Check if destination file already exists
  try {
    await fs.access(validatedToPath);
    throw new Error(`File already exists at ${toPath}`);
  } catch (error) {
    // File doesn't exist, proceed with move
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  // Move the file
  await fs.rename(validatedFromPath, validatedToPath);
}

/**
 * Deletes a file
 */
export async function deleteItem(filePath: string): Promise<void> {
  const validatedPath = validatePath(filePath);
  await fs.unlink(validatedPath);
}

/**
 * Generates a unique ID from a title
 * Format: {slug}-{4-char-hash}
 */
export function generateId(title: string, prefix?: string): string {
  // Create slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .split('-')
    .slice(0, 4)  // Max 4 words
    .join('-');

  // Generate 4-char hash from timestamp
  const hash = Date.now().toString(36).slice(-4);

  // Add prefix if provided (e.g., "phase1-task1")
  const fullSlug = prefix ? `${prefix}-${slug}` : slug;

  return `${fullSlug}-${hash}`;
}

/**
 * Reads a context file (stage or phase context)
 */
export async function readContextFile(type: 'stage' | 'phase' | 'agent' | 'context', id: string): Promise<string> {
  let contextPath: string;

  if (type === 'stage') {
    contextPath = path.join(getKanbanRootPath(), '_context', 'stages', `${id}.md`);
  } else if (type === 'phase') {
    contextPath = path.join(getKanbanRootPath(), '_context', 'phases', `${id}.md`);
  } else if (type === 'agent') {
    contextPath = path.join(getKanbanRootPath(), '_context', 'agents', `${id}.md`);
  } else {
    // context
    contextPath = path.join(getKanbanRootPath(), '_context', `${id}.md`);
  }

  const validatedPath = validatePath(contextPath);

  try {
    return await fs.readFile(validatedPath, 'utf-8');
  } catch (error) {
    // If context file doesn't exist, return empty string
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

/**
 * Writes a context file (stage or phase context)
 */
export async function writeContextFile(type: 'stage' | 'phase' | 'agent' | 'context', id: string, content: string): Promise<void> {
  let contextPath: string;

  if (type === 'stage') {
    contextPath = path.join(getKanbanRootPath(), '_context', 'stages', `${id}.md`);
  } else if (type === 'phase') {
    contextPath = path.join(getKanbanRootPath(), '_context', 'phases', `${id}.md`);
  } else if (type === 'agent') {
    contextPath = path.join(getKanbanRootPath(), '_context', 'agents', `${id}.md`);
  } else {
    // context
    contextPath = path.join(getKanbanRootPath(), '_context', `${id}.md`);
  }

  const validatedPath = validatePath(contextPath);
  const dirPath = path.dirname(validatedPath);

  // Create parent directory if it doesn't exist
  await fs.mkdir(dirPath, { recursive: true });

  await fs.writeFile(validatedPath, content, 'utf-8');
}

/**
 * Finds an item by ID across all stage folders
 */
export async function findItemById(itemId: string): Promise<string | null> {
  const stages: Stage[] = ['queue', 'plan', 'code', 'audit', 'completed'];

  for (const stage of stages) {
    const items = await listItemsInStage(stage);
    const found = items.find(itemPath => {
      const filename = path.basename(itemPath, '.md');
      // Exact match (legacy or ID-only)
      if (filename === itemId) return true;
      
      // Check for stage prefix: {stage}.{id}
      const parts = filename.split('.');
      if (parts.length > 1 && parts[0] === stage) {
        const idPart = parts.slice(1).join('.');
        return idPart === itemId;
      }
      return false;
    });

    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Gets the stage folder path for a given stage
 */
export function getStagePath(stage: Stage): string {
  return path.join(getKanbanRootPath(), stage);
}

/**
 * Gets the full file path for an item in a specific stage
 */
export function getItemPath(itemId: string, stage: Stage): string {
  return path.join(getKanbanRootPath(), stage, `${itemId}.md`);
}

/**
 * Extract phase number from ID
 * e.g., "phase2-task1-foo-abc" -> 2
 */
export function extractPhaseNumber(id: string): number {
  const match = id.match(/phase(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Extract task number from ID
 * e.g., "phase1-task3-bar-def" -> 3
 */
export function extractTaskNumber(id: string): number {
  const match = id.match(/task(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Generate slug from title
 * Converts title to URL-friendly slug
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Extract slug portion from ID
 * Removes phase/task prefixes and hash suffix
 */
export function extractSlugFromId(id: string): string {
  const parts = id.split('-');
  // Remove phase{N}, task{M} (if present), and hash (last part)
  const filtered = parts.filter(part =>
    !part.match(/^phase\d+$/) &&
    !part.match(/^task\d+$/)
  );
  // Remove last part (hash)
  filtered.pop();
  return filtered.join('-');
}

/**
 * Generates a filename for an item based on its frontmatter
 * Format: {stage}.{id}.md
 */
export function generateFilename(stage: Stage, id: string): string {
  return `${stage}.${id}.md`;
}

/**
 * Load all items from all stages
 */
export async function loadAllItems(): Promise<Item[]> {
  const stages: Stage[] = ['queue', 'plan', 'code', 'audit', 'completed', 'chat'];
  const allItems: Item[] = [];

  for (const stage of stages) {
    const itemPaths = await listItemsInStage(stage);
    for (const itemPath of itemPaths) {
      try {
        const content = await readItem(itemPath);
        const item = parseItem(content, itemPath);
        allItems.push(item);
      } catch {
        // Skip invalid items
        continue;
      }
    }
  }

  return allItems;
}

// ===============================================
// VSCode Extension Adapter Functions
// These functions work with workspace roots and return flattened data
// ===============================================

/**
 * Flattened item type for VSCode extension (matches webview types)
 */
export interface FlatItem {
  id: string;
  title: string;
  stage: Stage;
  type: 'phase' | 'task';
  phaseId?: string;
  tags: string[];
  created: string;
  updated: string;
  userContent?: string;
  managedSection?: string;
}

/**
 * Board data structure for VSCode extension
 */
export interface BoardDataFlat extends Record<Stage, FlatItem[]> {
  queue: FlatItem[];
  planning: FlatItem[];
  coding: FlatItem[];
  auditing: FlatItem[];
  completed: FlatItem[];
  chat: FlatItem[];
  plan: FlatItem[];
  code: FlatItem[];
  audit: FlatItem[];
}

/**
 * Converts core Item to flat structure
 */
function flattenItem(item: Item): FlatItem {
  return {
    id: item.frontmatter.id,
    title: item.frontmatter.title,
    stage: item.frontmatter.stage,
    type: item.frontmatter.type,
    phaseId: item.frontmatter.phase,
    tags: item.frontmatter.tags || [],
    created: item.frontmatter.created,
    updated: item.frontmatter.updated,
    userContent: item.body,
    managedSection: item.fullContent.split(USER_CONTENT_START)[0],
  };
}

/**
 * Reads an item by ID from workspace (higher-level function for extension)
 * @param workspaceRoot - Workspace root path
 * @param itemId - Item ID (filename without extension)
 * @returns Flattened item or null if not found
 */
export async function readItemById(workspaceRoot: string, itemId: string): Promise<FlatItem | null> {
  const stages: Stage[] = ['queue', 'plan', 'code', 'audit', 'completed', 'chat'];
  // Map stages to possible folders (canonical + legacy)
  // We check canonical first, then legacy
  const stageFolderMap: Record<Stage, string[]> = {
    queue: ['queue', '1-queue'],
    plan: ['plan', 'planning', '2-planning'],
    code: ['code', 'coding', '3-coding'],
    audit: ['audit', 'auditing', '4-auditing'],
    completed: ['completed', '5-completed'],
    chat: ['chat']
  };

  for (const stage of stages) {
    const folders = stageFolderMap[stage];
    for (const folder of folders) {
      const filePath = path.join(workspaceRoot, '.llmkanban', folder, `${itemId}.md`);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const item = parseItem(content, filePath);
        return flattenItem(item);
      } catch {
        continue;
      }
    }
  }

  return null;
}

/**
 * Loads all items organized by stage (higher-level function for extension)
 * @param workspaceRoot - Workspace root path
 * @returns Board data with items organized by stage
 */
export async function loadBoardData(workspaceRoot: string): Promise<BoardDataFlat> {
  const boardData: BoardDataFlat = {
    queue: [],
    planning: [],
    coding: [],
    auditing: [],
    completed: [],
    chat: [],
    plan: [],
    code: [],
    audit: [],
  };

  const stages: Stage[] = ['queue', 'plan', 'code', 'audit', 'completed', 'chat'];
  
  // Map stages to possible folders (canonical + legacy)
  const stageFolderMap: Record<Stage, string[]> = {
    queue: ['queue', '1-queue'],
    plan: ['plan', 'planning', '2-planning'],
    code: ['code', 'coding', '3-coding'],
    audit: ['audit', 'auditing', '4-auditing'],
    completed: ['completed', '5-completed'],
    chat: ['chat']
  };

  for (const stage of stages) {
    const folders = stageFolderMap[stage];
    for (const folder of folders) {
      const stagePath = path.join(workspaceRoot, '.llmkanban', folder);
      try {
        const files = await fs.readdir(stagePath);
        const mdFiles = files.filter(f => f.endsWith('.md'));

        for (const file of mdFiles) {
          const filePath = path.join(stagePath, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const item = parseItem(content, filePath);
            const flatItem = flattenItem(item);
            boardData[stage].push(flatItem);
          } catch {
            continue;
          }
        }
      } catch {
        continue;
      }
    }
  }

  return boardData;
}

/**
 * Moves an item to a different stage (higher-level function for extension)
 * @param workspaceRoot - Workspace root path
 * @param itemId - Item ID
 * @param targetStage - Target stage
 */
export async function moveItemToStage(workspaceRoot: string, itemId: string, targetStage: Stage): Promise<void> {
  const { reinjectContextForStageChange } = await import('./context-injector.js');
  // Find the item in current location
  // Find item in any valid folder
  const stages: Stage[] = ['queue', 'plan', 'code', 'audit', 'completed', 'chat'];
  const stageFolderMap: Record<Stage, string[]> = {
    queue: ['queue', '1-queue'],
    plan: ['plan', 'planning', '2-planning'],
    code: ['code', 'coding', '3-coding'],
    audit: ['audit', 'auditing', '4-auditing'],
    completed: ['completed', '5-completed'],
    chat: ['chat']
  };

  let currentPath: string | null = null;
  let currentContent: string | null = null;

  outerLoop:
  for (const stage of stages) {
    const folders = stageFolderMap[stage];
    for (const folder of folders) {
      const filePath = path.join(workspaceRoot, '.llmkanban', folder, `${itemId}.md`);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        currentPath = filePath;
        currentContent = content;
        break outerLoop;
      } catch {
        continue;
      }
    }
  }

  if (!currentPath || !currentContent) {
    throw new Error(`Item ${itemId} not found`);
  }

  // Re-inject context for new stage
  const newContent = await reinjectContextForStageChange(
    currentContent,
    currentPath,
    targetStage
  );

  // Determine target path
  // Determine target path (always use canonical folder)
  const targetFolder = targetStage;
  const newFilename = generateFilename(targetStage, itemId);
  const targetPath = path.join(workspaceRoot, '.llmkanban', targetFolder, newFilename);

  // Write to new location
  const targetDir = path.dirname(targetPath);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, newContent, 'utf-8');

  // Delete old file if it's different
  if (currentPath !== targetPath) {
    await fs.unlink(currentPath);
  }
}

/**
 * Deletes an item by ID (higher-level function for extension)
 * @param workspaceRoot - Workspace root path
 * @param itemId - Item ID
 */
export async function deleteItemById(workspaceRoot: string, itemId: string): Promise<void> {
  const stages: Stage[] = ['queue', 'plan', 'code', 'audit', 'completed', 'chat'];
  const stageFolderMap: Record<Stage, string[]> = {
    queue: ['queue', '1-queue'],
    plan: ['plan', 'planning', '2-planning'],
    code: ['code', 'coding', '3-coding'],
    audit: ['audit', 'auditing', '4-auditing'],
    completed: ['completed', '5-completed'],
    chat: ['chat']
  };

  for (const stage of stages) {
    const folders = stageFolderMap[stage];
    for (const folder of folders) {
      const filePath = path.join(workspaceRoot, '.llmkanban', folder, `${itemId}.md`);
      try {
        await fs.unlink(filePath);
        return; // Successfully deleted
      } catch {
        continue;
      }
    }
  }

  throw new Error(`Item ${itemId} not found`);
}

/**
 * Creates a new item (higher-level function for extension)
 * @param workspaceRoot - Workspace root path
 * @param data - Item creation data
 * @returns Created item with ID
 */
export async function createItem(
  workspaceRoot: string,
  data: {
    title: string;
    stage: Stage;
    type: 'phase' | 'task';
    phaseId?: string;
    tags?: string[];
    initialContent?: string;
    agent?: string;
    contexts?: string[];
  }
): Promise<FlatItem> {
  const { createItemWithContext } = await import('./context-injector.js');
  // Generate ID
  const id = generateId(data.title);

  // Create frontmatter
  // Create frontmatter
  const frontmatter = {
    id,
    type: data.type,
    title: data.title,
    stage: data.stage,
    phase: data.phaseId,
    agent: data.agent,
    contexts: data.contexts,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tags: data.tags || [],
    dependencies: [],
    assignees: [],
  };

  // Create content with context
  const content = await createItemWithContext(frontmatter, data.initialContent || '');

  // Determine file path
  // Determine file path (always use canonical folder)
  const stageFolder = data.stage;
  const filename = generateFilename(data.stage, id);
  const filePath = path.join(workspaceRoot, '.llmkanban', stageFolder, filename);

  // Write file
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');

  // Return flat item
  return {
    id,
    title: data.title,
    stage: data.stage,
    type: data.type,
    phaseId: data.phaseId,
    tags: data.tags || [],
    created: frontmatter.created,
    updated: frontmatter.updated,
    userContent: data.initialContent || '',
    managedSection: content.split(USER_CONTENT_START)[0],
  };
}

/**
 * Migrates all items in the workspace to the canonical filename format
 */
export async function migrateToCanonicalFilenames(workspaceRoot: string): Promise<void> {
  const items = await loadAllItems(); // This loads from all stages

  for (const item of items) {
    const oldPath = item.filePath;
    const stage = item.frontmatter.stage;
    const id = item.frontmatter.id;
    
    const newFilename = generateFilename(stage, id);
    const newPath = path.join(workspaceRoot, '.llmkanban', stage, newFilename);

    // If path is different, move it
    if (oldPath !== newPath) {
      // Ensure target directory exists
      const targetDir = path.dirname(newPath);
      await fs.mkdir(targetDir, { recursive: true });
      
      // Move file
      await fs.rename(oldPath, newPath);
    }
  }
}

/**
 * Updates an item's frontmatter (higher-level function for extension)
 * @param workspaceRoot - Workspace root path
 * @param itemId - Item ID
 * @param updates - Partial updates for the item
 */
export async function updateItem(
  workspaceRoot: string,
  itemId: string,
  updates: {
    title?: string;
    stage?: Stage;
    phaseId?: string;
    tags?: string[];
    agent?: string;
    contexts?: string[];
  }
): Promise<void> {
  const { updateFrontmatterOnly } = await import('./context-injector.js');
  
  // Find the item
  const stages: Stage[] = ['queue', 'plan', 'code', 'audit', 'completed', 'chat'];
  const stageFolderMap: Record<Stage, string[]> = {
    queue: ['queue', '1-queue'],
    plan: ['plan', 'planning', '2-planning'],
    code: ['code', 'coding', '3-coding'],
    audit: ['audit', 'auditing', '4-auditing'],
    completed: ['completed', '5-completed'],
    chat: ['chat']
  };

  let currentPath: string | null = null;
  let currentContent: string | null = null;

  outerLoop:
  for (const stage of stages) {
    const folders = stageFolderMap[stage];
    for (const folder of folders) {
      const filePath = path.join(workspaceRoot, '.llmkanban', folder, `${itemId}.md`);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        currentPath = filePath;
        currentContent = content;
        break outerLoop;
      } catch {
        continue;
      }
    }
  }

  if (!currentPath || !currentContent) {
    throw new Error(`Item ${itemId} not found`);
  }

  // Update frontmatter
  const newContent = await updateFrontmatterOnly(currentContent, currentPath, updates);
  
  // Write back
  await fs.writeFile(currentPath, newContent, 'utf-8');
}
