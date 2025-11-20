/**
 * Validation schemas and type guards using Zod
 */

import { z } from 'zod';
import { Stage, ItemType, ItemFrontmatter } from './types';

/**
 * Zod schema for Stage enum
 */
export const StageSchema = z.enum(['backlog', 'in-progress', 'review', 'audit', 'completed']);

/**
 * Zod schema for ItemType enum
 */
export const ItemTypeSchema = z.enum(['phase', 'task']);

/**
 * Zod schema for ItemFrontmatter
 */
export const ItemFrontmatterSchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
  type: ItemTypeSchema,
  title: z.string().min(1, 'Title cannot be empty'),
  stage: StageSchema,
  phase: z.string().optional(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

/**
 * Type guard to check if a value is a valid Stage
 */
export function isValidStage(value: unknown): value is Stage {
  return StageSchema.safeParse(value).success;
}

/**
 * Type guard to check if a value is a valid ItemType
 */
export function isValidItemType(value: unknown): value is ItemType {
  return ItemTypeSchema.safeParse(value).success;
}

/**
 * Validate and parse frontmatter data
 * @throws {ZodError} if validation fails
 */
export function validateFrontmatter(data: unknown): ItemFrontmatter {
  return ItemFrontmatterSchema.parse(data);
}

/**
 * Safely validate frontmatter without throwing
 */
export function safeValidateFrontmatter(data: unknown): {
  success: boolean;
  data?: ItemFrontmatter;
  error?: z.ZodError;
} {
  const result = ItemFrontmatterSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Sanitize a title for use in file names and IDs
 * - Convert to lowercase
 * - Replace spaces and special characters with hyphens
 * - Remove consecutive hyphens
 * - Trim hyphens from start/end
 */
export function sanitizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50); // Limit length
}

/**
 * Validate that a phase is specified for tasks
 */
export function validateTaskPhase(frontmatter: ItemFrontmatter): void {
  if (frontmatter.type === 'task' && !frontmatter.phase) {
    throw new Error('Tasks must have a phase specified');
  }
}

/**
 * Validate that phases don't have a phase field
 */
export function validatePhaseStructure(frontmatter: ItemFrontmatter): void {
  if (frontmatter.type === 'phase' && frontmatter.phase) {
    throw new Error('Phases cannot have a phase field');
  }
}

/**
 * Comprehensive validation of item structure
 */
export function validateItem(frontmatter: ItemFrontmatter): void {
  validateFrontmatter(frontmatter);
  if (frontmatter.type === 'task') {
    validateTaskPhase(frontmatter);
  } else {
    validatePhaseStructure(frontmatter);
  }
}
