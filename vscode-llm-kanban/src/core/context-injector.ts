/**
 * Context injection system
 * Handles reading and injecting stage and phase context into items
 */

import * as fs from 'fs/promises';
import { Item, Stage } from './types';
import { getStageContextPath, getPhaseContextPath } from './fs-adapter';
import { buildManagedSection } from './parser';
import { updateManagedSection, updateFrontmatter } from './parser';

/**
 * Read stage context from _context/stages/{stage}.md
 * Returns empty string if file doesn't exist
 */
export async function getStageContext(
  workspaceRoot: string,
  stage: Stage
): Promise<string> {
  try {
    const contextPath = getStageContextPath(workspaceRoot, stage);
    const content = await fs.readFile(contextPath, 'utf-8');
    return content.trim();
  } catch (error) {
    // Context file doesn't exist, return empty string
    return '';
  }
}

/**
 * Read phase context from _context/phases/{phaseId}.md
 * Returns null if file doesn't exist
 */
export async function getPhaseContext(
  workspaceRoot: string,
  phaseId: string
): Promise<string | null> {
  try {
    const contextPath = getPhaseContextPath(workspaceRoot, phaseId);
    const content = await fs.readFile(contextPath, 'utf-8');
    return content.trim();
  } catch (error) {
    // Context file doesn't exist
    return null;
  }
}

/**
 * Build the complete managed section for an item
 * Combines stage context and optional phase context
 */
export async function buildManagedContent(
  workspaceRoot: string,
  stage: Stage,
  phaseId?: string
): Promise<string> {
  const stageContext = await getStageContext(workspaceRoot, stage);
  let phaseContext: string | null = null;

  if (phaseId) {
    phaseContext = await getPhaseContext(workspaceRoot, phaseId);
  }

  return buildManagedSection(stageContext, phaseContext || undefined);
}

/**
 * Re-inject context when stage changes
 * Preserves user content while updating managed section
 */
export async function reinjectContextForStageChange(
  workspaceRoot: string,
  item: Item,
  newStage: Stage
): Promise<Item> {
  // Build new managed content for the new stage
  const newManagedSection = await buildManagedContent(
    workspaceRoot,
    newStage,
    item.frontmatter.phase
  );

  // Update the item with new managed section and stage
  let updatedItem = updateManagedSection(item, newManagedSection);
  updatedItem = updateFrontmatter(updatedItem, { stage: newStage });

  return updatedItem;
}

/**
 * Re-inject context when phase changes
 * Preserves user content while updating managed section
 */
export async function reinjectContextForPhaseChange(
  workspaceRoot: string,
  item: Item,
  newPhaseId: string
): Promise<Item> {
  // Build new managed content with new phase
  const newManagedSection = await buildManagedContent(
    workspaceRoot,
    item.frontmatter.stage,
    newPhaseId
  );

  // Update the item with new managed section and phase
  let updatedItem = updateManagedSection(item, newManagedSection);
  updatedItem = updateFrontmatter(updatedItem, { phase: newPhaseId });

  return updatedItem;
}

/**
 * Initialize context for a new item
 * Used when creating new tasks or phases
 */
export async function injectInitialContext(
  workspaceRoot: string,
  item: Item
): Promise<Item> {
  const managedSection = await buildManagedContent(
    workspaceRoot,
    item.frontmatter.stage,
    item.frontmatter.phase
  );

  return updateManagedSection(item, managedSection);
}

/**
 * Refresh context for an item
 * Re-reads context files and updates managed section
 * Useful when context files have been edited
 */
export async function refreshContext(
  workspaceRoot: string,
  item: Item
): Promise<Item> {
  const managedSection = await buildManagedContent(
    workspaceRoot,
    item.frontmatter.stage,
    item.frontmatter.phase
  );

  return updateManagedSection(item, managedSection);
}

/**
 * Create or update phase context file
 */
export async function savePhaseContext(
  workspaceRoot: string,
  phaseId: string,
  content: string
): Promise<void> {
  const contextPath = getPhaseContextPath(workspaceRoot, phaseId);
  const { mkdir, writeFile } = await import('fs/promises');
  const path = await import('path');

  // Ensure directory exists
  await mkdir(path.dirname(contextPath), { recursive: true });
  await writeFile(contextPath, content, 'utf-8');
}
