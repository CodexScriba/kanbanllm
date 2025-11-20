// lib/types.ts

export type Stage = 'chat' | 'queue' | 'plan' | 'code' | 'audit' | 'completed';

export type ItemType = 'phase' | 'task';

export interface Frontmatter {
  id: string;
  type: ItemType;
  title: string;
  stage: Stage;
  phase?: string;          // For tasks: reference to phase ID
  agent?: string;          // Agent ID assigned to this item
  contexts?: string[];     // Array of additional context IDs (e.g. "global/architecture")
  created: string;         // ISO 8601
  updated: string;         // ISO 8601
  tags?: string[];
  dependencies?: string[]; // Array of item IDs
  assignees?: string[];
  description?: string;    // For agents
  model?: string;          // For agents
  temperature?: number;    // For agents
}

export interface Item {
  frontmatter: Frontmatter;
  body: string;            // User content only (below separator)
  fullContent: string;     // Entire file content
  filePath: string;        // Absolute path to .md file
}

export interface StageContext {
  stage: Stage;
  content: string;         // Markdown content from stage context file
}

export interface PhaseContext {
  phaseId: string;
  content: string;         // Markdown content from phase context file
}

export interface BoardData {
  stages: {
    [K in Stage]: Item[];
  };
  contexts: {
    stages: Record<Stage, StageContext>;
    phases: Record<string, PhaseContext>;
  };
}

export interface CreateItemData {
  type: ItemType;
  title: string;
  stage: Stage;
  phase?: string;
  tags?: string[];
  initialContent?: string;
  agent?: string;
  contexts?: string[];
}
