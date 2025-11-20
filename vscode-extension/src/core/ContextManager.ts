import { readContextFile } from './fs-adapter';

export type ContextType = 'stage' | 'phase' | 'agent' | 'context';

export class ContextManager {
  /**
   * Resolves context content by type and ID
   */
  async resolveContext(type: ContextType, id: string): Promise<string> {
    return readContextFile(type, id);
  }
}
