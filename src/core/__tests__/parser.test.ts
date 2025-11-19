import {
  parseMarkdownToItem,
  serializeItemToMarkdown,
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
created: 2025-01-01T00:00:00Z
updated: 2025-01-02T00:00:00Z
---

<!-- DOCFLOW:MANAGED -->
# Stage Context
This is the coding stage.
<!-- DOCFLOW:USER-CONTENT -->

# My Notes
User content here.`;

      const item = parseMarkdownToItem(markdown);

      expect(item.id).toBe('test-task-123');
      expect(item.title).toBe('Test Task');
      expect(item.stage).toBe('coding');
      expect(item.type).toBe('task');
      expect(item.tags).toEqual(['test', 'unit']);
      expect(item.userContent).toContain('My Notes');
    });

    it('should handle missing user content section', () => {
      const markdown = `---
id: test-task-123
title: Test Task
stage: coding
type: task
created: 2025-01-01T00:00:00Z
updated: 2025-01-02T00:00:00Z
---

<!-- DOCFLOW:MANAGED -->
# Stage Context
This is the coding stage.`;

      const item = parseMarkdownToItem(markdown);

      expect(item.id).toBe('test-task-123');
      expect(item.userContent).toBe('');
    });

    it('should handle optional phaseId', () => {
      const markdown = `---
id: test-task-123
title: Test Task
stage: coding
type: task
phaseId: phase1-test
created: 2025-01-01T00:00:00Z
updated: 2025-01-02T00:00:00Z
---`;

      const item = parseMarkdownToItem(markdown);

      expect(item.phaseId).toBe('phase1-test');
    });
  });

  describe('serializeItemToMarkdown', () => {
    it('should serialize item to markdown format', () => {
      const item: Item = {
        id: 'test-task-123',
        title: 'Test Task',
        stage: 'coding',
        type: 'task',
        tags: ['test', 'unit'],
        created: new Date('2025-01-01T00:00:00Z'),
        updated: new Date('2025-01-02T00:00:00Z'),
        managedSection: '# Stage Context\nThis is coding.',
        userContent: '# My Notes\nUser content here.',
      };

      const markdown = serializeItemToMarkdown(item);

      expect(markdown).toContain('id: test-task-123');
      expect(markdown).toContain('title: Test Task');
      expect(markdown).toContain('stage: coding');
      expect(markdown).toContain('DOCFLOW:MANAGED');
      expect(markdown).toContain('DOCFLOW:USER-CONTENT');
      expect(markdown).toContain('# My Notes');
    });

    it('should handle items without user content', () => {
      const item: Item = {
        id: 'test-task-123',
        title: 'Test Task',
        stage: 'coding',
        type: 'task',
        tags: [],
        created: new Date('2025-01-01T00:00:00Z'),
        updated: new Date('2025-01-02T00:00:00Z'),
        managedSection: '# Stage Context',
        userContent: '',
      };

      const markdown = serializeItemToMarkdown(item);

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

      expect(userContent).toBe('');
    });
  });

  describe('buildManagedSection', () => {
    it('should combine stage and phase context', () => {
      const stageContext = '# Coding Stage\nImplement features.';
      const phaseContext = '# Phase 1\nAuthentication.';

      const managedSection = buildManagedSection(stageContext, phaseContext);

      expect(managedSection).toContain('# Coding Stage');
      expect(managedSection).toContain('# Phase 1');
    });

    it('should handle missing phase context', () => {
      const stageContext = '# Coding Stage\nImplement features.';

      const managedSection = buildManagedSection(stageContext);

      expect(managedSection).toContain('# Coding Stage');
      expect(managedSection).not.toContain('# Phase');
    });
  });
});
