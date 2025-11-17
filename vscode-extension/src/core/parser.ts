/**
 * Markdown parser for item files
 */

import matter from 'gray-matter';
import type { Item, ParsedSections, ItemFrontmatter } from './types';
import { MANAGED_SEPARATOR, USER_SEPARATOR } from './types';
import { validateFrontmatter, safeValidateFrontmatter } from './validators';

/**
 * Parse markdown file into Item object
 */
export function parseItem(markdown: string, filePath: string): Item | null {
  try {
    // Parse frontmatter
    const { data, content } = matter(markdown);

    // Validate frontmatter
    const validation = safeValidateFrontmatter(data);
    if (!validation.success) {
      console.error(`Invalid frontmatter in ${filePath}:`, validation.error);
      return null;
    }

    const frontmatter = validation.data!;

    // Extract user content
    const userContent = extractUserContent(content);

    return {
      frontmatter,
      body: content,
      userContent,
      filePath
    };
  } catch (error) {
    console.error(`Error parsing item ${filePath}:`, error);
    return null;
  }
}

/**
 * Serialize Item object into markdown string
 */
export function serializeItem(item: Item): string {
  // Build frontmatter
  const frontmatterStr = matter.stringify('', item.frontmatter);

  // Combine with body
  return frontmatterStr + '\n' + item.body;
}

/**
 * Build managed section with injected context
 */
export function buildManagedSection(
  stageContext: string,
  phaseContext?: string
): string {
  let managed = MANAGED_SEPARATOR + '\n\n';

  // Add stage context
  managed += stageContext + '\n\n';

  // Add phase context if provided
  if (phaseContext) {
    managed += phaseContext + '\n\n';
  }

  managed += '---\n';

  return managed;
}

/**
 * Extract user content (below separator)
 */
export function extractUserContent(markdown: string): string {
  const parts = markdown.split(USER_SEPARATOR);
  if (parts.length > 1) {
    return parts[1].trim();
  }
  return '';
}

/**
 * Split markdown into sections
 */
export function splitSections(markdown: string): ParsedSections {
  const { data, content } = matter(markdown);

  const parts = content.split(USER_SEPARATOR);
  const managedSection = parts[0] || '';
  const userContent = parts.length > 1 ? parts[1].trim() : '';

  return {
    frontmatter: matter.stringify('', data),
    managedSection,
    userContent
  };
}

/**
 * Build complete markdown file with frontmatter, managed section, and user content
 */
export function buildMarkdown(
  frontmatter: ItemFrontmatter,
  managedSection: string,
  userContent: string
): string {
  const frontmatterStr = matter.stringify('', frontmatter);
  const body = managedSection + '\n' + USER_SEPARATOR + '\n\n' + userContent;
  return frontmatterStr + '\n' + body;
}
