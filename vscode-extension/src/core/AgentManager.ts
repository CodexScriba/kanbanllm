import { promises as fs } from 'fs';
import path from 'path';
import { getKanbanRootPath } from './fs-adapter';
import { parseItem } from './parser';
import type { Frontmatter } from './types';

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

export class AgentManager {
  /**
   * Retrieves an agent by ID
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    try {
      const agentPath = path.join(getKanbanRootPath(), '_context', 'agents', `${agentId}.md`);
      const content = await fs.readFile(agentPath, 'utf-8');
      const item = parseItem(content, agentPath);
      
      return {
        id: agentId,
        name: item.frontmatter.title,
        description: item.frontmatter.description, // Assuming description might be added to frontmatter or just use title
        systemPrompt: item.body,
        config: {
          model: item.frontmatter.model, // Assuming model might be in frontmatter
          temperature: item.frontmatter.temperature,
        }
      } as Agent;
    } catch (error) {
      console.error(`Failed to load agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Lists all available agents
   */
  async listAgents(): Promise<Agent[]> {
    try {
      const agentsDir = path.join(getKanbanRootPath(), '_context', 'agents');
      const files = await fs.readdir(agentsDir);
      const agents: Agent[] = [];

      for (const file of files) {
        if (file.endsWith('.md')) {
          const agentId = path.basename(file, '.md');
          const agent = await this.getAgent(agentId);
          if (agent) {
            agents.push(agent);
          }
        }
      }

      return agents;
    } catch (error) {
      // If directory doesn't exist, return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
