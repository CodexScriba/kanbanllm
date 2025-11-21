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
  agent?: string;
  contexts?: string[];
  managedSection?: string;
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

export interface Agent {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  config?: {
    model?: string;
    temperature?: number;
    [key: string]: any;
  };
}

export interface ContextMetadata {
  id: string;
  name: string;
  type: 'stage' | 'phase' | 'agent' | 'context';
  path: string;
  size: number;
}

// Messages from extension to webview
export type ExtensionMessage =
  | { type: 'init'; data: BoardData }
  | { type: 'itemCreated'; item: Item }
  | { type: 'itemUpdated'; item: Item }
  | { type: 'itemDeleted'; itemId: string }
  | { type: 'error'; message: string }
  | { type: 'agentData'; agent: Agent }
  | { type: 'agentList'; agents: Agent[] }
  | { type: 'contextData'; contextType: 'stage' | 'phase' | 'agent' | 'context'; content: string; contextId: string }
  | { type: 'contextList'; contexts: ContextMetadata[] };

// Messages from webview to extension
export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'moveItem'; itemId: string; targetStage: Stage }
  | { type: 'openItem'; itemId: string }
  | { type: 'deleteItem'; itemId: string }
  | { type: 'createTask'; title: string; stage: Stage; phaseId?: string; tags: string[] }
  | { type: 'createPhase'; title: string; stage: Stage; tags: string[] }
  | { type: 'copyWithContext'; itemId: string; mode: 'full' | 'context' | 'user' }
  | { type: 'updateItem'; item: Item }
  | { type: 'getAgent'; agentId: string }
  | { type: 'getContext'; contextType: 'stage' | 'phase' | 'agent' | 'context'; contextId: string }
  | { type: 'saveContext'; contextType: 'stage' | 'phase' | 'agent' | 'context'; contextId: string; content: string }
  | { type: 'listAgents' }
  | { type: 'listContexts' };

