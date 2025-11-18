// lib/fs-adapter.ts
import { promises as fs } from 'fs';
import path from 'path';
import type { Stage, Item } from './types';

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
export async function readContextFile(type: 'stage' | 'phase', id: string): Promise<string> {
  let contextPath: string;

  if (type === 'stage') {
    contextPath = path.join(getKanbanRootPath(), '_context', 'stages', `${id}.md`);
  } else {
    contextPath = path.join(getKanbanRootPath(), '_context', 'phases', `${id}.md`);
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
 * Finds an item by ID across all stage folders
 */
export async function findItemById(itemId: string): Promise<string | null> {
  const stages: Stage[] = ['chat', 'queue', 'plan', 'code', 'audit', 'completed'];

  for (const stage of stages) {
    const items = await listItemsInStage(stage);
    const found = items.find(itemPath => {
      const filename = path.basename(itemPath, '.md');
      return filename === itemId;
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
 * Load all items from all stages
 */
export async function loadAllItems(): Promise<Item[]> {
  const stages: Stage[] = ['chat', 'queue', 'plan', 'code', 'audit', 'completed'];
  const allItems: Item[] = [];

  // Import parseItem dynamically to avoid circular dependency
  const { parseItem } = await import('./parser.js');

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
