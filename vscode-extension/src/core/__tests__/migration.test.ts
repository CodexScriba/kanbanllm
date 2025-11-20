import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { 
  configureWorkspaceRoot, 
  createItem, 
  migrateToCanonicalFilenames, 
  listItemsInStage,
  generateFilename
} from '../fs-adapter';

describe('Migration', () => {
  let tempDir: string;
  let workspaceRoot: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban-test-'));
    workspaceRoot = path.join(tempDir, 'workspace');
    await fs.mkdir(path.join(workspaceRoot, '.llmkanban'), { recursive: true });
    
    // Create stage directories
    const stages = ['queue', 'plan', 'code', 'audit', 'completed', 'chat'];
    for (const stage of stages) {
      await fs.mkdir(path.join(workspaceRoot, '.llmkanban', stage), { recursive: true });
      await fs.mkdir(path.join(workspaceRoot, '.llmkanban', '_context', 'stages'), { recursive: true });
      await fs.writeFile(
        path.join(workspaceRoot, '.llmkanban', '_context', 'stages', `${stage}.md`),
        `# ${stage} context`
      );
    }

    configureWorkspaceRoot(workspaceRoot);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should migrate files to canonical filename format', async () => {
    // Create an item with legacy filename (createItem uses generateFilename now, so we manually create a legacy file)
    const id = 'legacy-task-1234';
    const content = `---
id: ${id}
title: Legacy Task
stage: queue
type: task
created: 2025-01-01T00:00:00Z
updated: 2025-01-01T00:00:00Z
---
<!-- LLMKANBAN:MANAGED - Do not edit above this line -->
## 🎯 Stage: Queue

# Queue context
---
<!-- LLMKANBAN:USER-CONTENT - Edit below this line -->
User content`;

    const legacyPath = path.join(workspaceRoot, '.llmkanban', 'queue', `${id}.md`);
    await fs.writeFile(legacyPath, content);

    // Verify legacy file exists
    let queueItems = await listItemsInStage('queue');
    expect(queueItems).toContain(legacyPath);

    // Run migration
    await migrateToCanonicalFilenames(workspaceRoot);

    // Verify file moved
    queueItems = await listItemsInStage('queue');
    const expectedFilename = generateFilename('queue', id);
    const expectedPath = path.join(workspaceRoot, '.llmkanban', 'queue', expectedFilename);
    
    expect(queueItems).toContain(expectedPath);
    expect(queueItems).not.toContain(legacyPath);
  });
});
