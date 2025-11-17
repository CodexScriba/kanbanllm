/**
 * Validation schemas and type guards using Zod
 */

import { z } from 'zod';
import type { Stage, ItemType, ItemFrontmatter } from './types';

/**
 * Stage schema
 */
export const StageSchema = z.enum(['backlog', 'in-progress', 'review', 'audit', 'completed']);

/**
 * Item type schema
 */
export const ItemTypeSchema = z.enum(['phase', 'task']);

/**
 * Frontmatter schema
 */
export const ItemFrontmatterSchema = z.object({
  id: z.string().min(1),
  type: ItemTypeSchema,
  title: z.string().min(1),
  stage: StageSchema,
  phase: z.string().optional(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

/**
 * Type guard for Stage
 */
export function isValidStage(value: unknown): value is Stage {
  return StageSchema.safeParse(value).success;
}

/**
 * Type guard for ItemType
 */
export function isValidItemType(value: unknown): value is ItemType {
  return ItemTypeSchema.safeParse(value).success;
}

/**
 * Validate and parse frontmatter
 */
export function validateFrontmatter(data: unknown): ItemFrontmatter {
  return ItemFrontmatterSchema.parse(data);
}

/**
 * Safe validate frontmatter (returns result object)
 */
export function safeValidateFrontmatter(data: unknown): { success: boolean; data?: ItemFrontmatter; error?: z.ZodError } {
  const result = ItemFrontmatterSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Sanitize filename for safe file system operations
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return sanitizeFilename(title).substring(0, 30);
}
