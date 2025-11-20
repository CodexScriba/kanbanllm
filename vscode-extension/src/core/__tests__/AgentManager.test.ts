import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { AgentManager } from '../AgentManager';
import { configureWorkspaceRoot } from '../fs-adapter';

describe('AgentManager', () => {
  let tempDir: string;
  let workspaceRoot: string;
  let agentManager: AgentManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban-test-agent-'));
    workspaceRoot = path.join(tempDir, 'workspace');
    await fs.mkdir(path.join(workspaceRoot, '.llmkanban', '_context', 'agents'), { recursive: true });

    configureWorkspaceRoot(workspaceRoot);
    agentManager = new AgentManager();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should retrieve an agent by ID', async () => {
    const agentId = 'coder';
    const content = `---
id: ${agentId}
type: task
title: Coder Agent
stage: chat
created: 2025-01-01T00:00:00Z
updated: 2025-01-01T00:00:00Z
description: A coding agent
model: gpt-4
temperature: 0.7
---
<!-- LLMKANBAN:MANAGED - Do not edit above this line -->
## 🎯 Stage: Chat

<!-- LLMKANBAN:USER-CONTENT - Edit below this line -->
You are a coding expert.`;

    await fs.writeFile(
      path.join(workspaceRoot, '.llmkanban', '_context', 'agents', `${agentId}.md`),
      content
    );

    const agent = await agentManager.getAgent(agentId);
    expect(agent).toBeDefined();
    expect(agent?.id).toBe(agentId);
    expect(agent?.name).toBe('Coder Agent');
    expect(agent?.description).toBe('A coding agent');
    expect(agent?.config?.model).toBe('gpt-4');
    expect(agent?.config?.temperature).toBe(0.7);
    expect(agent?.systemPrompt).toContain('You are a coding expert.');
  });

  it('should list all agents', async () => {
    const agents = ['coder', 'planner'];
    for (const agentId of agents) {
      const content = `---
id: ${agentId}
type: task
title: ${agentId} Agent
stage: chat
created: 2025-01-01T00:00:00Z
updated: 2025-01-01T00:00:00Z
---
<!-- LLMKANBAN:MANAGED - Do not edit above this line -->
<!-- LLMKANBAN:USER-CONTENT - Edit below this line -->
System prompt`;

      await fs.writeFile(
        path.join(workspaceRoot, '.llmkanban', '_context', 'agents', `${agentId}.md`),
        content
      );
    }

    const result = await agentManager.listAgents();
    expect(result).toHaveLength(2);
    expect(result.map(a => a.id).sort()).toEqual(agents.sort());
  });
});
