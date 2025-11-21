import { promises as fs } from 'fs';
import path from 'path';
import { listContexts, ContextMetadata } from '../fs-adapter';

describe('listContexts', () => {
  const testWorkspaceRoot = path.join(__dirname, 'test-workspace-contexts');
  const contextRoot = path.join(testWorkspaceRoot, '.llmkanban', '_context');

  beforeEach(async () => {
    // Create test workspace structure
    await fs.mkdir(path.join(contextRoot, 'stages'), { recursive: true });
    await fs.mkdir(path.join(contextRoot, 'phases'), { recursive: true });
    await fs.mkdir(path.join(contextRoot, 'agents'), { recursive: true });

    // Create test context files
    await fs.writeFile(
      path.join(contextRoot, 'stages', 'plan.md'),
      '# Planning Stage\n\nContext for planning stage.'
    );
    await fs.writeFile(
      path.join(contextRoot, 'phases', 'phase1-auth.md'),
      '# Authentication Phase\n\nPhase context.'
    );
    await fs.writeFile(
      path.join(contextRoot, 'agents', 'coder.md'),
      '# Coder Agent\n\nAgent instructions.'
    );
    await fs.writeFile(
      path.join(contextRoot, 'api-spec.md'),
      '# API Specification\n\nCustom context.'
    );
  });

  afterEach(async () => {
    // Clean up test workspace
    await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
  });

  it('should list all contexts with metadata', async () => {
    const contexts = await listContexts(testWorkspaceRoot);

    expect(contexts).toHaveLength(4);
    
    // Check that all types are present
    const types = contexts.map(c => c.type);
    expect(types).toContain('stage');
    expect(types).toContain('phase');
    expect(types).toContain('agent');
    expect(types).toContain('context');
  });

  it('should extract names from H1 headings', async () => {
    const contexts = await listContexts(testWorkspaceRoot);

    const planContext = contexts.find(c => c.id === 'plan');
    expect(planContext?.name).toBe('Planning Stage');

    const authContext = contexts.find(c => c.id === 'phase1-auth');
    expect(authContext?.name).toBe('Authentication Phase');

    const coderContext = contexts.find(c => c.id === 'coder');
    expect(coderContext?.name).toBe('Coder Agent');
  });

  it('should include file size', async () => {
    const contexts = await listContexts(testWorkspaceRoot);

    contexts.forEach(context => {
      expect(context.size).toBeGreaterThan(0);
    });
  });

  it('should include correct paths', async () => {
    const contexts = await listContexts(testWorkspaceRoot);

    const planContext = contexts.find(c => c.id === 'plan');
    expect(planContext?.path).toContain('stages');
    expect(planContext?.path).toContain('plan.md');

    const customContext = contexts.find(c => c.id === 'api-spec');
    expect(customContext?.path).toContain('_context');
    expect(customContext?.path).toContain('api-spec.md');
  });

  it('should handle empty context directories', async () => {
    // Remove all context files
    await fs.rm(contextRoot, { recursive: true, force: true });
    await fs.mkdir(contextRoot, { recursive: true });

    const contexts = await listContexts(testWorkspaceRoot);
    expect(contexts).toHaveLength(0);
  });

  it('should handle missing context directory', async () => {
    // Remove entire context directory
    await fs.rm(path.join(testWorkspaceRoot, '.llmkanban'), { recursive: true, force: true });

    const contexts = await listContexts(testWorkspaceRoot);
    expect(contexts).toHaveLength(0);
  });

  it('should skip non-markdown files', async () => {
    // Add a non-markdown file
    await fs.writeFile(
      path.join(contextRoot, 'stages', 'readme.txt'),
      'This is not a markdown file'
    );

    const contexts = await listContexts(testWorkspaceRoot);
    
    // Should still only have 4 contexts (the .md files)
    expect(contexts).toHaveLength(4);
  });

  it('should use ID as name if no H1 heading found', async () => {
    // Create a context file without H1 heading
    await fs.writeFile(
      path.join(contextRoot, 'no-heading.md'),
      'Just some content without a heading.'
    );

    const contexts = await listContexts(testWorkspaceRoot);
    const noHeadingContext = contexts.find(c => c.id === 'no-heading');
    
    expect(noHeadingContext?.name).toBe('no-heading');
  });
});
