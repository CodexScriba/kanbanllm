/**
 * File system adapter for Kanban operations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Item, Stage, ItemFrontmatter, ItemType } from './types';
import { KANBAN_FOLDER, STAGES } from './types';
import { parseItem, buildMarkdown } from './parser';
import { generateSlug } from './validators';

/**
 * Get Kanban root path for a workspace
 */
export function getKanbanRoot(workspaceRoot: string): string {
  return path.join(workspaceRoot, KANBAN_FOLDER);
}

/**
 * Get stage folder path
 */
export function getStageFolderPath(workspaceRoot: string, stage: Stage): string {
  return path.join(getKanbanRoot(workspaceRoot), stage);
}

/**
 * Validate path is within .llmkanban/ directory
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
 * Check if .llmkanban folder exists
 */
export async function kanbanFolderExists(workspaceRoot: string): Promise<boolean> {
  try {
    const stats = await fs.stat(getKanbanRoot(workspaceRoot));
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read all items from all stages
 */
export async function loadAllItems(workspaceRoot: string): Promise<Item[]> {
  const items: Item[] = [];

  for (const stage of STAGES) {
    const stageItems = await loadItemsFromStage(workspaceRoot, stage);
    items.push(...stageItems);
  }

  return items;
}

/**
 * Read items from a specific stage
 */
export async function loadItemsFromStage(workspaceRoot: string, stage: Stage): Promise<Item[]> {
  const items: Item[] = [];
  const stagePath = getStageFolderPath(workspaceRoot, stage);

  try {
    // Check if stage folder exists
    const exists = await fs.access(stagePath).then(() => true).catch(() => false);
    if (!exists) {
      return items;
    }

    // Read all .md files in stage folder
    const files = await fs.readdir(stagePath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    for (const file of mdFiles) {
      const filePath = path.join(stagePath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const item = parseItem(content, filePath);

      if (item) {
        items.push(item);
      }
    }
  } catch (error) {
    console.error(`Error loading items from stage ${stage}:`, error);
  }

  return items;
}

/**
 * Read single item by ID
 */
export async function readItem(workspaceRoot: string, itemId: string): Promise<Item | null> {
  // Search through all stages
  for (const stage of STAGES) {
    const filePath = path.join(getStageFolderPath(workspaceRoot, stage), `${itemId}.md`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return parseItem(content, filePath);
    } catch {
      // File not found in this stage, continue
      continue;
    }
  }

  return null;
}

/**
 * Write item to stage folder
 */
export async function writeItem(
  workspaceRoot: string,
  item: Item,
  stage: Stage
): Promise<void> {
  const stagePath = getStageFolderPath(workspaceRoot, stage);
  const filePath = path.join(stagePath, `${item.frontmatter.id}.md`);

  // Ensure stage folder exists
  await fs.mkdir(stagePath, { recursive: true });

  // Write file
  const content = buildMarkdown(item.frontmatter, item.body.split('<!-- DOCFLOW:USER-CONTENT')[0], item.userContent);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Move item to different stage
 */
export async function moveItem(
  workspaceRoot: string,
  itemId: string,
  oldStage: Stage,
  newStage: Stage
): Promise<void> {
  const oldPath = path.join(getStageFolderPath(workspaceRoot, oldStage), `${itemId}.md`);
  const newPath = path.join(getStageFolderPath(workspaceRoot, newStage), `${itemId}.md`);

  // Ensure new stage folder exists
  await fs.mkdir(getStageFolderPath(workspaceRoot, newStage), { recursive: true });

  // Move file
  await fs.rename(oldPath, newPath);
}

/**
 * Delete item
 */
export async function deleteItem(
  workspaceRoot: string,
  itemId: string,
  stage: Stage
): Promise<void> {
  const filePath = path.join(getStageFolderPath(workspaceRoot, stage), `${itemId}.md`);
  await fs.unlink(filePath);
}

/**
 * Generate unique phase ID
 */
export async function generatePhaseId(
  workspaceRoot: string,
  title: string
): Promise<string> {
  const items = await loadAllItems(workspaceRoot);
  const phases = items.filter(item => item.frontmatter.type === 'phase');

  // Extract phase numbers
  const phaseNumbers = phases
    .map(p => {
      const match = p.frontmatter.id.match(/^phase(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  // Find next number
  const maxNumber = phaseNumbers.length > 0 ? Math.max(...phaseNumbers) : 0;
  const nextNumber = maxNumber + 1;

  // Generate slug and hash
  const slug = generateSlug(title);
  const hash = generateHash();

  return `phase${nextNumber}-${slug}-${hash}`;
}

/**
 * Generate unique task ID
 */
export async function generateTaskId(
  workspaceRoot: string,
  title: string,
  phaseId: string
): Promise<string> {
  const items = await loadAllItems(workspaceRoot);
  const tasks = items.filter(
    item => item.frontmatter.type === 'task' && item.frontmatter.phase === phaseId
  );

  // Extract task numbers for this phase
  const taskNumbers = tasks
    .map(t => {
      const match = t.frontmatter.id.match(/task(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  // Find next number
  const maxNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) : 0;
  const nextNumber = maxNumber + 1;

  // Extract phase number from phaseId
  const phaseMatch = phaseId.match(/^phase(\d+)/);
  const phaseNumber = phaseMatch ? phaseMatch[1] : '1';

  // Generate slug and hash
  const slug = generateSlug(title);
  const hash = generateHash();

  return `phase${phaseNumber}-task${nextNumber}-${slug}-${hash}`;
}

/**
 * Generate hash (last 4 chars of timestamp in base36)
 */
function generateHash(): string {
  return Date.now().toString(36).slice(-4);
}

/**
 * Create default frontmatter for new item
 */
export function createDefaultFrontmatter(
  id: string,
  type: ItemType,
  title: string,
  stage: Stage,
  phase?: string
): ItemFrontmatter {
  const now = new Date().toISOString();

  return {
    id,
    type,
    title,
    stage,
    phase,
    created: now,
    updated: now,
    tags: [],
    dependencies: []
  };
}
