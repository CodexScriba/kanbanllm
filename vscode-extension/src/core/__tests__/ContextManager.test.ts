import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ContextManager } from '../ContextManager';
import { configureWorkspaceRoot } from '../fs-adapter';

describe('ContextManager', () => {
  let tempDir: string;
  let workspaceRoot: string;
  let contextManager: ContextManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban-test-ctx-'));
    workspaceRoot = path.join(tempDir, 'workspace');
    await fs.mkdir(path.join(workspaceRoot, '.llmkanban', '_context', 'stages'), { recursive: true });
    await fs.mkdir(path.join(workspaceRoot, '.llmkanban', '_context', 'phases'), { recursive: true });
    await fs.mkdir(path.join(workspaceRoot, '.llmkanban', '_context', 'agents'), { recursive: true });

    configureWorkspaceRoot(workspaceRoot);
    contextManager = new ContextManager();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should resolve stage context', async () => {
    const content = '# Stage Context';
    await fs.writeFile(
      path.join(workspaceRoot, '.llmkanban', '_context', 'stages', 'plan.md'),
      content
    );

    const result = await contextManager.resolveContext('stage', 'plan');
    expect(result).toBe(content);
  });

  it('should resolve agent context', async () => {
    const content = '# Agent Context';
    await fs.writeFile(
      path.join(workspaceRoot, '.llmkanban', '_context', 'agents', 'coder.md'),
      content
    );

    const result = await contextManager.resolveContext('agent', 'coder');
    expect(result).toBe(content);
  });

  it('should return empty string for missing context', async () => {
    const result = await contextManager.resolveContext('stage', 'missing');
    expect(result).toBe('');
  });
});
