// lib/parser.ts
import matter from 'gray-matter';
import { z } from 'zod';
import type { Item, Frontmatter, Stage } from './types';

// Constants for separators
export const MANAGED_SECTION_START = '<!-- LLMKANBAN:MANAGED - Do not edit above this line -->';
export const USER_CONTENT_START = '<!-- LLMKANBAN:USER-CONTENT - Edit below this line -->';

// Zod schema for frontmatter validation
const stageValues = [
  'chat',
  'queue',
  'plan',
  'code',
  'audit',
  'completed',
  // Legacy aliases
  'planning',
  'coding',
  'auditing',
  'backlog',
  'in-progress',
  'review',
] as const;

const stageNormalizationMap: Record<typeof stageValues[number], Stage> = {
  chat: 'chat',
  queue: 'queue',
  plan: 'plan',
  code: 'code',
  audit: 'audit',
  completed: 'completed',
  // Legacy mappings
  planning: 'plan',
  coding: 'code',
  auditing: 'audit',
  backlog: 'queue',
  'in-progress': 'plan',
  review: 'audit',
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
  agent: z.string().optional(),
  contexts: z.array(z.string()).optional(),
  created: z.union([z.string(), z.date()]).transform(val => 
    val instanceof Date ? val.toISOString() : val
  ).pipe(z.string().datetime()),
  updated: z.union([z.string(), z.date()]).transform(val => 
    val instanceof Date ? val.toISOString() : val
  ).pipe(z.string().datetime()),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  description: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().optional(),
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
  phaseContent?: string,
  agentName?: string,
  agentContent?: string,
  contextItems?: { id: string; content: string }[]
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

  // Agent section (if applicable)
  if (agentName) {
    parts.push('');
    parts.push(`## 🤖 Agent: ${agentName}`);
    parts.push('');
    if (agentContent && agentContent.trim()) {
      parts.push(agentContent.trim());
    } else {
      parts.push('_No agent instructions defined._');
    }
  }

  // Additional Contexts (if applicable)
  if (contextItems && contextItems.length > 0) {
    parts.push('');
    parts.push('## 📚 Contexts');
    
    for (const ctx of contextItems) {
      parts.push('');
      parts.push(`### ${ctx.id}`);
      parts.push('');
      parts.push(ctx.content.trim());
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

// Export aliases for backward compatibility
export const parseMarkdownToItem = parseItem;
export const serializeItemToMarkdown = serializeItem;
