/**
 * Core type definitions for the LLM Kanban system
 */

/**
 * Kanban stage enum
 */
export type Stage = 'backlog' | 'in-progress' | 'review' | 'audit' | 'completed';

/**
 * All available stages
 */
export const STAGES: Stage[] = ['backlog', 'in-progress', 'review', 'audit', 'completed'];

/**
 * Stage display names
 */
export const STAGE_DISPLAY_NAMES: Record<Stage, string> = {
  'backlog': 'Backlog',
  'in-progress': 'In Progress',
  'review': 'Review',
  'audit': 'Audit',
  'completed': 'Completed'
};

/**
 * Item type enum
 */
export type ItemType = 'phase' | 'task';

/**
 * Frontmatter structure for items (tasks/phases)
 */
export interface ItemFrontmatter {
  id: string;
  type: ItemType;
  title: string;
  stage: Stage;
  phase?: string;
  created: string;
  updated: string;
  tags?: string[];
  dependencies?: string[];
  assignees?: string[];
}

/**
 * Full item structure
 */
export interface Item {
  frontmatter: ItemFrontmatter;
  body: string;
  userContent: string;
  filePath: string;
}

/**
 * Parsed sections of a markdown file
 */
export interface ParsedSections {
  frontmatter: string;
  managedSection: string;
  userContent: string;
}

/**
 * File watcher event types
 */
export type FileChangeType = 'created' | 'changed' | 'deleted';

/**
 * Kanban folder structure constants
 */
export const KANBAN_FOLDER = '.llmkanban';
export const CONTEXT_FOLDER = '_context';
export const STAGES_CONTEXT_FOLDER = 'stages';
export const PHASES_CONTEXT_FOLDER = 'phases';

/**
 * Markdown separator constants
 */
export const MANAGED_SEPARATOR = '<!-- DOCFLOW:MANAGED - Do not edit above the separator -->';
export const USER_SEPARATOR = '<!-- DOCFLOW:USER-CONTENT - Edit below this line -->';
