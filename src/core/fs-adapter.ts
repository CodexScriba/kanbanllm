// lib/fs-adapter.ts
import { promises as fs } from 'fs';
import path from 'path';
import type { Stage, Item } from './types';

// Root directory for all docflow files
const DOCFLOW_ROOT = path.join(process.cwd(), 'docflow');

/**
 * Validates that a path resolves inside the docflow directory
 */
function validatePath(filePath: string): string {
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(DOCFLOW_ROOT);

  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new Error(`Path ${filePath} is outside of docflow directory`);
  }

  return resolvedPath;
}

/**
 * Lists all .md files in a given stage folder
 */
export async function listItemsInStage(stage: Stage): Promise<string[]> {
  const stagePath = validatePath(path.join(DOCFLOW_ROOT, stage));

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
    contextPath = path.join(DOCFLOW_ROOT, '_context', 'stages', `${id}.md`);
  } else {
    contextPath = path.join(DOCFLOW_ROOT, '_context', 'phases', `${id}.md`);
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
  const stages: Stage[] = ['queue', 'planning', 'coding', 'auditing', 'completed'];

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
  return path.join(DOCFLOW_ROOT, stage);
}

/**
 * Gets the full file path for an item in a specific stage
 */
export function getItemPath(itemId: string, stage: Stage): string {
  return path.join(DOCFLOW_ROOT, stage, `${itemId}.md`);
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
  const stages: Stage[] = ['queue', 'planning', 'coding', 'auditing', 'completed'];
  const allItems: Item[] = [];

  // Import parseItem dynamically to avoid circular dependency
  const { parseItem } = await import('./parser');

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
export interface BoardDataFlat {
  queue: FlatItem[];
  planning: FlatItem[];
  coding: FlatItem[];
  auditing: FlatItem[];
  completed: FlatItem[];
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
    managedSection: item.fullContent.split('<!-- DOCFLOW:USER-CONTENT')[0],
  };
}

/**
 * Reads an item by ID from workspace (higher-level function for extension)
 * @param workspaceRoot - Workspace root path
 * @param itemId - Item ID (filename without extension)
 * @returns Flattened item or null if not found
 */
export async function readItemById(workspaceRoot: string, itemId: string): Promise<FlatItem | null> {
  const { parseItem } = await import('./parser');

  const stages: Stage[] = ['queue', 'planning', 'coding', 'auditing', 'completed'];
  const stageFolders = ['1-queue', '2-planning', '3-coding', '4-auditing', '5-completed'];

  for (let i = 0; i < stages.length; i++) {
    const filePath = path.join(workspaceRoot, '.llmkanban', stageFolders[i], `${itemId}.md`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const item = parseItem(content, filePath);
      return flattenItem(item);
    } catch {
      // File not found in this stage, continue
      continue;
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
  const { parseItem } = await import('./parser');

  const boardData: BoardDataFlat = {
    queue: [],
    planning: [],
    coding: [],
    auditing: [],
    completed: [],
  };

  const stages: Stage[] = ['queue', 'planning', 'coding', 'auditing', 'completed'];
  const stageFolders = ['1-queue', '2-planning', '3-coding', '4-auditing', '5-completed'];

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const stageFolder = stageFolders[i];
    const stagePath = path.join(workspaceRoot, '.llmkanban', stageFolder);

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
          // Skip invalid files
          continue;
        }
      }
    } catch {
      // Stage folder doesn't exist, continue
      continue;
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
  const { parseItem, serializeItem, extractUserContent, buildManagedSection } = await import('./parser');

  // Find the item in current location
  const stages: Stage[] = ['queue', 'planning', 'coding', 'auditing', 'completed'];
  const stageFolders = ['1-queue', '2-planning', '3-coding', '4-auditing', '5-completed'];

  let currentPath: string | null = null;
  let currentContent: string | null = null;

  for (let i = 0; i < stages.length; i++) {
    const filePath = path.join(workspaceRoot, '.llmkanban', stageFolders[i], `${itemId}.md`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      currentPath = filePath;
      currentContent = content;
      break;
    } catch {
      continue;
    }
  }

  if (!currentPath || !currentContent) {
    throw new Error(`Item ${itemId} not found`);
  }

  // Parse the item
  const item = parseItem(currentContent, currentPath);
  const userContent = extractUserContent(currentContent);

  // Update frontmatter with new stage
  const updatedFrontmatter = {
    ...item.frontmatter,
    stage: targetStage,
    updated: new Date().toISOString(),
  };

  // Build new managed section with updated stage context
  const stageContent = await readContextFile('stage', targetStage);
  let phaseContent = '';
  let phaseTitle = '';

  if (item.frontmatter.phase) {
    phaseContent = await readContextFile('phase', item.frontmatter.phase);
    phaseTitle = item.frontmatter.phase; // Use phase ID as fallback title
  }

  const managedSection = buildManagedSection(
    targetStage,
    stageContent,
    phaseTitle,
    phaseContent
  );

  // Serialize to markdown
  const newContent = serializeItem(updatedFrontmatter, managedSection, userContent);

  // Determine target path
  const targetFolderIndex = stages.indexOf(targetStage);
  const targetFolder = stageFolders[targetFolderIndex];
  const targetPath = path.join(workspaceRoot, '.llmkanban', targetFolder, `${itemId}.md`);

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
  const stages: Stage[] = ['queue', 'planning', 'coding', 'auditing', 'completed'];
  const stageFolders = ['1-queue', '2-planning', '3-coding', '4-auditing', '5-completed'];

  for (let i = 0; i < stages.length; i++) {
    const filePath = path.join(workspaceRoot, '.llmkanban', stageFolders[i], `${itemId}.md`);
    try {
      await fs.unlink(filePath);
      return; // Successfully deleted
    } catch {
      // File not in this stage, continue
      continue;
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
  }
): Promise<FlatItem> {
  const { buildManagedSection, serializeItem } = await import('./parser');

  // Generate ID
  const id = generateId(data.title);

  // Create frontmatter
  const frontmatter = {
    id,
    type: data.type,
    title: data.title,
    stage: data.stage,
    phase: data.phaseId,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tags: data.tags || [],
    dependencies: [],
    assignees: [],
  };

  // Read stage context
  const stageContent = await readContextFile('stage', data.stage);
  let phaseContent = '';
  let phaseTitle = '';

  if (data.phaseId) {
    phaseContent = await readContextFile('phase', data.phaseId);
    phaseTitle = data.phaseId;
  }

  const managedSection = buildManagedSection(
    data.stage,
    stageContent,
    phaseTitle,
    phaseContent
  );

  // Serialize to markdown
  const content = serializeItem(frontmatter, managedSection, data.initialContent || '');

  // Determine file path
  const stageFolders = { queue: '1-queue', planning: '2-planning', coding: '3-coding', auditing: '4-auditing', completed: '5-completed' };
  const stageFolder = stageFolders[data.stage];
  const filePath = path.join(workspaceRoot, '.llmkanban', stageFolder, `${id}.md`);

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
    managedSection,
  };
}
