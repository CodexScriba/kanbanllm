/**
 * Core type definitions for LLM Kanban extension
 */

/**
 * Stage represents the five Kanban columns
 */
export type Stage = 'backlog' | 'in-progress' | 'review' | 'audit' | 'completed';

/**
 * ItemType distinguishes between phases and tasks
 */
export type ItemType = 'phase' | 'task';

/**
 * Frontmatter schema for all items (phases and tasks)
 */
export interface ItemFrontmatter {
  id: string;                    // Unique identifier
  type: ItemType;                // Item type (phase or task)
  title: string;                 // Display name
  stage: Stage;                  // Current stage
  phase?: string;                // Parent phase ID (required for tasks)
  created: string;               // ISO 8601 timestamp
  updated: string;               // ISO 8601 timestamp
  tags?: string[];               // Optional tags
  dependencies?: string[];       // Optional dependency IDs
  assignees?: string[];          // Future use
}

/**
 * Item represents a complete task or phase with all sections
 */
export interface Item {
  frontmatter: ItemFrontmatter;
  managedSection: string;        // Auto-generated context section
  userContent: string;           // User's freeform content
  body: string;                  // Complete markdown body
  filePath?: string;             // File system path (populated when loaded)
}

/**
 * Copy mode for the "Copy with Context" feature
 */
export type CopyMode = 'full' | 'context-content' | 'user-only';

/**
 * Message types for webview communication
 */
export interface WebviewMessage {
  type: 'moveItem' | 'createItem' | 'deleteItem' | 'openItem' | 'requestUpdate';
  itemId?: string;
  newStage?: Stage;
  data?: Partial<ItemFrontmatter>;
  filePath?: string;
}

/**
 * Extension configuration
 */
export interface KanbanConfig {
  defaultStage: Stage;
  enableFileWatcher: boolean;
}

/**
 * Constants
 */
export const KANBAN_FOLDER = '.llmkanban';
export const MANAGED_SEPARATOR = '<!-- DOCFLOW:MANAGED - Do not edit above the separator -->';
export const USER_SEPARATOR = '<!-- DOCFLOW:USER-CONTENT - Edit below this line -->';

export const STAGES: Stage[] = ['backlog', 'in-progress', 'review', 'audit', 'completed'];

export const STAGE_DISPLAY_NAMES: Record<Stage, string> = {
  'backlog': '🗂️ Backlog',
  'in-progress': '⚡ In Progress',
  'review': '👀 Review',
  'audit': '🔍 Audit',
  'completed': '✅ Completed'
};
