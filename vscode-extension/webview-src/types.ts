// Types for the webview UI (mirror of core types)
export type Stage = 'chat' | 'queue' | 'plan' | 'code' | 'audit' | 'completed';
export type ItemType = 'phase' | 'task';

export interface Item {
  id: string;
  title: string;
  stage: Stage;
  type: ItemType;
  phaseId?: string;
  tags: string[];
  created: string;
  updated: string;
  userContent?: string;
}

export interface BoardData {
  chat: Item[];
  queue: Item[];
  plan: Item[];
  code: Item[];
  audit: Item[];
  completed: Item[];
}

export interface ColumnConfig {
  id: Stage;
  title: string;
  icon: string;
  color: string;
}

// Messages from extension to webview
export type ExtensionMessage =
  | { type: 'init'; data: BoardData }
  | { type: 'itemCreated'; item: Item }
  | { type: 'itemUpdated'; item: Item }
  | { type: 'itemDeleted'; itemId: string }
  | { type: 'error'; message: string };

// Messages from webview to extension
export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'moveItem'; itemId: string; targetStage: Stage }
  | { type: 'openItem'; itemId: string }
  | { type: 'deleteItem'; itemId: string }
  | { type: 'createTask'; title: string; stage: Stage; phaseId?: string; tags: string[] }
  | { type: 'createPhase'; title: string; stage: Stage; tags: string[] }
  | { type: 'copyWithContext'; itemId: string; mode: 'full' | 'context' | 'user' };
