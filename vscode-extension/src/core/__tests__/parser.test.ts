import {
  parseItem,
  serializeItem,
  extractUserContent,
  buildManagedSection,
} from '../parser';
import { Item } from '../types';

describe('Parser', () => {
  describe('parseMarkdownToItem', () => {
    it('should parse markdown with frontmatter and sections', () => {
      const markdown = `---
id: test-task-123
title: Test Task
stage: coding
type: task
tags: [test, unit]
created: "2025-01-01T00:00:00Z"
updated: "2025-01-02T00:00:00Z"
---

<!-- DOCFLOW:MANAGED -->
# Stage Context
This is the coding stage.
<!-- DOCFLOW:USER-CONTENT -->

# My Notes
User content here.`;

      const item = parseItem(markdown, '/test/path.md');

      expect(item.frontmatter.id).toBe('test-task-123');
      expect(item.frontmatter.title).toBe('Test Task');
      expect(item.frontmatter.stage).toBe('coding');
      expect(item.frontmatter.type).toBe('task');
      expect(item.frontmatter.tags).toEqual(['test', 'unit']);
      expect(item.body).toContain('My Notes');
    });

    it('should handle missing user content section', () => {
      const markdown = `---
id: test-task-123
title: Test Task
stage: coding
type: task
created: "2025-01-01T00:00:00Z"
updated: "2025-01-02T00:00:00Z"
---

<!-- DOCFLOW:MANAGED -->
# Stage Context
This is the coding stage.

<!-- DOCFLOW:USER-CONTENT - Edit below this line -->`;

      const item = parseItem(markdown, '/test/path.md');

      expect(item.frontmatter.id).toBe('test-task-123');
      expect(item.body).toBe('');
    });

    it('should handle optional phaseId', () => {
      const markdown = `---
id: test-task-123
title: Test Task
stage: coding
type: task
phase: phase1-test
created: "2025-01-01T00:00:00Z"
updated: "2025-01-02T00:00:00Z"
---`;

      const item = parseItem(markdown, '/test/path.md');

      expect(item.frontmatter.phase).toBe('phase1-test');
    });
  });

  describe('serializeItem', () => {
    it('should serialize item to markdown format', () => {
      const frontmatter = {
        id: 'test-task-123',
        title: 'Test Task',
        stage: 'coding' as const,
        type: 'task' as const,
        tags: ['test', 'unit'],
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      };
      const managedSection = '# Stage Context\nThis is coding.';
      const userContent = '# My Notes\nUser content here.';

      const markdown = serializeItem(frontmatter, managedSection, userContent);

      expect(markdown).toContain('id: test-task-123');
      expect(markdown).toContain('title: Test Task');
      expect(markdown).toContain('stage: coding');
      expect(markdown).toContain('DOCFLOW:MANAGED');
      expect(markdown).toContain('DOCFLOW:USER-CONTENT');
      expect(markdown).toContain('# My Notes');
    });

    it('should handle items without user content', () => {
      const frontmatter = {
        id: 'test-task-123',
        title: 'Test Task',
        stage: 'coding' as const,
        type: 'task' as const,
        tags: [],
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      };
      const managedSection = '# Stage Context';
      const userContent = '';

      const markdown = serializeItem(frontmatter, managedSection, userContent);

      expect(markdown).toContain('DOCFLOW:USER-CONTENT');
      expect(markdown.endsWith('\n')).toBe(true);
    });
  });

  describe('extractUserContent', () => {
    it('should extract content after USER-CONTENT marker', () => {
      const markdown = `---
frontmatter
---

<!-- DOCFLOW:MANAGED -->
Managed content
<!-- DOCFLOW:USER-CONTENT -->

# User Section
This is user content.`;

      const userContent = extractUserContent(markdown);

      expect(userContent).toContain('# User Section');
      expect(userContent).toContain('This is user content.');
    });

    it('should return empty string if no USER-CONTENT marker', () => {
      const markdown = `---
frontmatter
---

Content without marker`;

      const userContent = extractUserContent(markdown);

      expect(userContent).toBe('Content without marker');
    });
  });

  describe('buildManagedSection', () => {
    it('should combine stage and phase context', () => {
      const stageContext = '# Coding Stage\nImplement features.';
      const phaseContext = '# Phase 1\nAuthentication.';

      const managedSection = buildManagedSection('coding', stageContext, 'Phase 1', phaseContext);

      expect(managedSection).toContain('# Coding Stage');
      expect(managedSection).toContain('# Phase 1');
    });

    it('should handle missing phase context', () => {
      const stageContext = '# Coding Stage\nImplement features.';

      const managedSection = buildManagedSection('coding', stageContext);

      expect(managedSection).toContain('# Coding Stage');
      expect(managedSection).not.toContain('# Phase');
    });
  });
});
