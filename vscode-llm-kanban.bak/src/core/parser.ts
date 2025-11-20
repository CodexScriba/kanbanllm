/**
 * Parser for markdown files with YAML frontmatter
 * Handles parsing and serialization of Item objects
 */

import matter from 'gray-matter';
import { Item, ItemFrontmatter, MANAGED_SEPARATOR, USER_SEPARATOR } from './types';
import { validateFrontmatter, safeValidateFrontmatter } from './validators';

/**
 * Parse a markdown file into an Item object
 * @param markdown - The markdown content to parse
 * @returns Parsed Item object
 * @throws Error if frontmatter is invalid
 */
export function parseItem(markdown: string): Item {
  // Parse YAML frontmatter
  const parsed = matter(markdown);

  // Validate frontmatter
  const validation = safeValidateFrontmatter(parsed.data);
  if (!validation.success) {
    throw new Error(`Invalid frontmatter: ${validation.error?.message}`);
  }

  const frontmatter = validation.data!;

  // Split the body into managed section and user content
  const { managedSection, userContent } = splitSections(parsed.content);

  return {
    frontmatter,
    managedSection,
    userContent,
    body: parsed.content,
  };
}

/**
 * Serialize an Item object into markdown string
 * @param item - The item to serialize
 * @returns Markdown string with frontmatter
 */
export function serializeItem(item: Item): string {
  // Validate frontmatter before serializing
  validateFrontmatter(item.frontmatter);

  // Build the complete markdown
  const frontmatter = matter.stringify('', item.frontmatter);
  const body = buildBody(item.managedSection, item.userContent);

  // Combine frontmatter and body
  return frontmatter + body;
}

/**
 * Split markdown body into managed section and user content
 * @param body - The markdown body (without frontmatter)
 * @returns Object with managedSection and userContent
 */
export function splitSections(body: string): {
  managedSection: string;
  userContent: string;
} {
  // Look for the user separator
  const parts = body.split(USER_SEPARATOR);

  if (parts.length < 2) {
    // No separator found - treat everything as user content for backward compatibility
    return {
      managedSection: '',
      userContent: body.trim(),
    };
  }

  const managedSection = parts[0].trim();
  const userContent = parts[1].trim();

  return { managedSection, userContent };
}

/**
 * Build the complete body from managed section and user content
 * @param managedSection - The auto-generated managed section
 * @param userContent - The user's freeform content
 * @returns Complete markdown body
 */
export function buildBody(managedSection: string, userContent: string): string {
  const parts: string[] = [];

  if (managedSection) {
    parts.push(MANAGED_SEPARATOR);
    parts.push('');
    parts.push(managedSection);
    parts.push('');
    parts.push('---');
  }

  parts.push(USER_SEPARATOR);
  parts.push('');

  if (userContent) {
    parts.push(userContent);
  }

  return parts.join('\n');
}

/**
 * Build the managed section with injected context
 * @param stageContext - Context for the current stage
 * @param phaseContext - Optional context for the parent phase
 * @returns Formatted managed section
 */
export function buildManagedSection(
  stageContext: string,
  phaseContext?: string
): string {
  const parts: string[] = [];

  if (stageContext) {
    parts.push(stageContext);
  }

  if (phaseContext) {
    if (parts.length > 0) {
      parts.push('');
    }
    parts.push(phaseContext);
  }

  return parts.join('\n');
}

/**
 * Extract just the user content from a markdown body
 * @param body - The complete markdown body
 * @returns User content only
 */
export function extractUserContent(body: string): string {
  const { userContent } = splitSections(body);
  return userContent;
}

/**
 * Update the managed section while preserving user content
 * @param item - The item to update
 * @param newManagedSection - The new managed section content
 * @returns Updated item
 */
export function updateManagedSection(item: Item, newManagedSection: string): Item {
  return {
    ...item,
    managedSection: newManagedSection,
    body: buildBody(newManagedSection, item.userContent),
  };
}

/**
 * Update frontmatter while preserving body content
 * @param item - The item to update
 * @param updates - Partial frontmatter updates
 * @returns Updated item
 */
export function updateFrontmatter(
  item: Item,
  updates: Partial<ItemFrontmatter>
): Item {
  const updatedFrontmatter = {
    ...item.frontmatter,
    ...updates,
    updated: new Date().toISOString(),
  };

  return {
    ...item,
    frontmatter: updatedFrontmatter,
  };
}

/**
 * Parse markdown safely, returning null if parsing fails
 * @param markdown - The markdown content to parse
 * @returns Parsed Item or null if parsing fails
 */
export function safeParseItem(markdown: string): Item | null {
  try {
    return parseItem(markdown);
  } catch (error) {
    console.error('Failed to parse item:', error);
    return null;
  }
}
