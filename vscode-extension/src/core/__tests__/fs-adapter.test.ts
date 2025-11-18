import { describe, expect, it } from 'vitest';
import os from 'os';
import path from 'path';
import { configureWorkspaceRoot, getKanbanRootPath } from '../fs-adapter';

describe('fs-adapter workspace binding', () => {
  it('configures and resolves the .llmkanban root path', () => {
    expect(() => getKanbanRootPath()).toThrow(/not been configured/);

    const tmpRoot = fsSafePath('kanbanllm-test');
    configureWorkspaceRoot(tmpRoot);
    expect(getKanbanRootPath()).toBe(path.join(tmpRoot, '.llmkanban'));
  });
});

function fsSafePath(folderName: string): string {
  return path.join(os.tmpdir(), folderName);
}
