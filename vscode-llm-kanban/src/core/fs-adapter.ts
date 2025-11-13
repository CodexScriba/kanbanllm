/**
 * File system adapter for Kanban items
 * Handles reading, writing, moving, and deleting markdown files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Item, ItemFrontmatter, Stage, KANBAN_FOLDER, STAGES } from './types';
import { parseItem, serializeItem, safeParseItem } from './parser';
import { sanitizeTitle } from './validators';

/**
 * Get the root .llmkanban folder path for the workspace
 */
export function getKanbanRoot(workspaceRoot: string): string {
  return path.join(workspaceRoot, KANBAN_FOLDER);
}

/**
 * Get the path for a specific stage folder
 */
export function getStagePath(workspaceRoot: string, stage: Stage): string {
  return path.join(getKanbanRoot(workspaceRoot), stage);
}

/**
 * Get the path for the context folder
 */
export function getContextPath(workspaceRoot: string): string {
  return path.join(getKanbanRoot(workspaceRoot), '_context');
}

/**
 * Get the path for stage context files
 */
export function getStageContextPath(workspaceRoot: string, stage: Stage): string {
  return path.join(getContextPath(workspaceRoot), 'stages', `${stage}.md`);
}

/**
 * Get the path for phase context files
 */
export function getPhaseContextPath(workspaceRoot: string, phaseId: string): string {
  return path.join(getContextPath(workspaceRoot), 'phases', `${phaseId}.md`);
}

/**
 * Validate that a path is within the .llmkanban directory
 * Prevents directory traversal attacks
 */
export function validatePath(workspaceRoot: string, filePath: string): string {
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(getKanbanRoot(workspaceRoot));

  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new Error(`Path ${filePath} is outside of .llmkanban directory`);
  }

  return resolvedPath;
}

/**
 * Generate a unique hash for IDs (timestamp-based)
 */
function generateHash(): string {
  return Date.now().toString(36).slice(-4);
}

/**
 * Extract phase number from a phase ID
 * Example: "phase3-ui-redesign-x7y2" → 3
 */
function extractPhaseNumber(phaseId: string): number {
  const match = phaseId.match(/^phase(\d+)-/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Extract task number from a task ID
 * Example: "phase2-task4-navbar-d9e3" → 4
 */
function extractTaskNumber(taskId: string): number {
  const match = taskId.match(/^phase\d+-task(\d+)-/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Read all items from all stages
 */
export async function loadAllItems(workspaceRoot: string): Promise<Item[]> {
  const items: Item[] = [];

  for (const stage of STAGES) {
    const stagePath = getStagePath(workspaceRoot, stage);

    try {
      await fs.access(stagePath);
      const files = await fs.readdir(stagePath);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(stagePath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const item = safeParseItem(content);

          if (item) {
            item.filePath = filePath;
            items.push(item);
          }
        }
      }
    } catch (error) {
      // Stage folder doesn't exist or is empty, skip it
      continue;
    }
  }

  return items;
}

/**
 * Read a single item by ID from a specific stage
 */
export async function readItem(
  workspaceRoot: string,
  itemId: string,
  stage: Stage
): Promise<Item | null> {
  const filePath = path.join(getStagePath(workspaceRoot, stage), `${itemId}.md`);
  validatePath(workspaceRoot, filePath);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const item = parseItem(content);
    item.filePath = filePath;
    return item;
  } catch (error) {
    return null;
  }
}

/**
 * Find an item by ID across all stages
 */
export async function findItem(
  workspaceRoot: string,
  itemId: string
): Promise<{ item: Item; stage: Stage } | null> {
  for (const stage of STAGES) {
    const item = await readItem(workspaceRoot, itemId, stage);
    if (item) {
      return { item, stage };
    }
  }
  return null;
}

/**
 * Write an item to a stage folder
 */
export async function writeItem(
  workspaceRoot: string,
  item: Item,
  stage: Stage
): Promise<void> {
  const filePath = path.join(
    getStagePath(workspaceRoot, stage),
    `${item.frontmatter.id}.md`
  );
  validatePath(workspaceRoot, filePath);

  const markdown = serializeItem(item);
  await fs.writeFile(filePath, markdown, 'utf-8');
}

/**
 * Move an item from one stage to another
 */
export async function moveItem(
  workspaceRoot: string,
  itemId: string,
  oldStage: Stage,
  newStage: Stage
): Promise<void> {
  const oldPath = path.join(getStagePath(workspaceRoot, oldStage), `${itemId}.md`);
  const newPath = path.join(getStagePath(workspaceRoot, newStage), `${itemId}.md`);

  validatePath(workspaceRoot, oldPath);
  validatePath(workspaceRoot, newPath);

  await fs.rename(oldPath, newPath);
}

/**
 * Delete an item from a stage
 */
export async function deleteItem(
  workspaceRoot: string,
  itemId: string,
  stage: Stage
): Promise<void> {
  const filePath = path.join(getStagePath(workspaceRoot, stage), `${itemId}.md`);
  validatePath(workspaceRoot, filePath);

  await fs.unlink(filePath);
}

/**
 * Generate a unique phase ID
 * Format: phase{N}-{slug}-{hash}
 */
export async function generatePhaseId(
  workspaceRoot: string,
  title: string
): Promise<string> {
  const items = await loadAllItems(workspaceRoot);
  const phases = items.filter((item) => item.frontmatter.type === 'phase');

  // Find the highest phase number
  const maxPhaseNumber = phases.reduce((max, item) => {
    const num = extractPhaseNumber(item.frontmatter.id);
    return Math.max(max, num);
  }, 0);

  const nextNumber = maxPhaseNumber + 1;
  const slug = sanitizeTitle(title);
  const hash = generateHash();

  return `phase${nextNumber}-${slug}-${hash}`;
}

/**
 * Generate a unique task ID
 * Format: phase{N}-task{M}-{slug}-{hash}
 */
export async function generateTaskId(
  workspaceRoot: string,
  title: string,
  phaseId: string
): Promise<string> {
  const items = await loadAllItems(workspaceRoot);

  // Filter tasks within this phase
  const tasks = items.filter(
    (item) =>
      item.frontmatter.type === 'task' && item.frontmatter.phase === phaseId
  );

  // Find the highest task number within this phase
  const maxTaskNumber = tasks.reduce((max, item) => {
    const num = extractTaskNumber(item.frontmatter.id);
    return Math.max(max, num);
  }, 0);

  const nextNumber = maxTaskNumber + 1;
  const phaseNumber = extractPhaseNumber(phaseId);
  const slug = sanitizeTitle(title);
  const hash = generateHash();

  return `phase${phaseNumber}-task${nextNumber}-${slug}-${hash}`;
}

/**
 * Check if the .llmkanban folder exists
 */
export async function kanbanFolderExists(workspaceRoot: string): Promise<boolean> {
  try {
    await fs.access(getKanbanRoot(workspaceRoot));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a file from the .llmkanban directory
 */
export async function readFile(
  workspaceRoot: string,
  relativePath: string
): Promise<string> {
  const filePath = path.join(getKanbanRoot(workspaceRoot), relativePath);
  validatePath(workspaceRoot, filePath);

  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Write a file to the .llmkanban directory
 */
export async function writeFile(
  workspaceRoot: string,
  relativePath: string,
  content: string
): Promise<void> {
  const filePath = path.join(getKanbanRoot(workspaceRoot), relativePath);
  validatePath(workspaceRoot, filePath);

  // Ensure directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  await fs.writeFile(filePath, content, 'utf-8');
}
