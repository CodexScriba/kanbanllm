// lib/parser.ts
import matter from 'gray-matter';
import { z } from 'zod';
import type { Item, Frontmatter, Stage } from './types';

// Constants for separators
export const MANAGED_SECTION_START = '<!-- DOCFLOW:MANAGED - Do not edit above the separator -->';
export const USER_CONTENT_START = '<!-- DOCFLOW:USER-CONTENT - Edit below this line -->';

// Zod schema for frontmatter validation
const stageValues = [
  'queue',
  'planning',
  'coding',
  'auditing',
  'completed',
  'backlog',
  'in-progress',
  'review',
  'audit',
] as const;

const stageNormalizationMap: Record<typeof stageValues[number], Stage> = {
  queue: 'queue',
  planning: 'planning',
  coding: 'coding',
  auditing: 'auditing',
  completed: 'completed',
  backlog: 'queue',
  'in-progress': 'planning',
  review: 'coding',
  audit: 'auditing',
};

export function normalizeStageValue(stage: typeof stageValues[number]): Stage {
  const normalized = stageNormalizationMap[stage];
  if (!normalized) {
    throw new Error(`Unsupported stage value: ${stage}`);
  }
  return normalized;
}

export const FrontmatterSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['phase', 'task']),
  title: z.string().min(1),
  stage: z.enum(stageValues),
  phase: z.string().optional(),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

/**
 * Parses a markdown file with frontmatter
 * Splits content into managed section and user content
 */
export function parseItem(content: string, filePath: string): Item {
  // Parse frontmatter with gray-matter
  const { data, content: bodyContent } = matter(content);

  // Validate frontmatter with Zod
  const parsedFrontmatter = FrontmatterSchema.parse(data);
  const frontmatter: Frontmatter = {
    ...parsedFrontmatter,
    stage: normalizeStageValue(parsedFrontmatter.stage),
  };

  // Split body content at user content separator
  let userContent = '';

  if (bodyContent.includes(USER_CONTENT_START)) {
    const parts = bodyContent.split(USER_CONTENT_START);
    // Everything after the user content separator is user content
    userContent = parts[1] || '';
  } else {
    // If no separator found, treat all content as user content
    userContent = bodyContent;
  }

  return {
    frontmatter,
    body: userContent.trim(),
    fullContent: content,
    filePath,
  };
}

/**
 * Serializes an item back to markdown format
 * Combines frontmatter, managed section, and user content
 */
export function serializeItem(
  frontmatter: Frontmatter,
  managedContent: string,
  userContent: string
): string {
  // Build the frontmatter section
  const frontmatterStr = matter.stringify('', frontmatter);

  // Build the complete file content
  const parts = [
    frontmatterStr.trim(),
    '',
    MANAGED_SECTION_START,
    '',
    managedContent.trim(),
    '',
    '---',
    USER_CONTENT_START,
    '',
    userContent.trim(),
  ];

  return parts.join('\n') + '\n';
}

/**
 * Updates frontmatter fields
 */
export function updateFrontmatter(
  current: Frontmatter,
  updates: Partial<Frontmatter>
): Frontmatter {
  return {
    ...current,
    ...updates,
    updated: new Date().toISOString(),
  };
}

/**
 * Extracts user content from a markdown file
 * Returns empty string if no user content separator found
 */
export function extractUserContent(content: string): string {
  const { content: bodyContent } = matter(content);

  if (bodyContent.includes(USER_CONTENT_START)) {
    const parts = bodyContent.split(USER_CONTENT_START);
    return (parts[1] || '').trim();
  }

  // If no separator, return all body content
  return bodyContent.trim();
}

/**
 * Builds the managed section (stage + phase context)
 */
export function buildManagedSection(
  stage: string,
  stageContent: string,
  phaseTitle?: string,
  phaseContent?: string
): string {
  const parts: string[] = [];

  // Stage section
  parts.push(`## 🎯 Stage: ${formatStageTitle(stage)}`);
  parts.push('');
  parts.push(stageContent.trim());

  // Phase section (if applicable)
  // Always emit phase block if we have a phaseTitle, even if content is empty
  if (phaseTitle) {
    parts.push('');
    parts.push(`## 📦 Phase: ${phaseTitle}`);
    parts.push('');
    if (phaseContent && phaseContent.trim()) {
      parts.push(phaseContent.trim());
    } else {
      parts.push('_No phase context defined yet._');
    }
  }

  return parts.join('\n');
}

/**
 * Formats stage name for display
 */
function formatStageTitle(stage: string): string {
  return stage
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validates that a string is valid markdown frontmatter
 */
export function validateFrontmatterString(content: string): boolean {
  try {
    const { data } = matter(content);
    FrontmatterSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
