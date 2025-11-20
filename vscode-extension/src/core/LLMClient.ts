export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  complete(messages: Message[], config: LLMConfig): Promise<string>;
}

export class MockLLMClient implements LLMProvider {
  async complete(messages: Message[], config: LLMConfig): Promise<string> {
    return `Mock response from ${config.model}. Received ${messages.length} messages.`;
  }
}
