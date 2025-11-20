import { describe, expect, it } from 'vitest';
import {
  parseItem,
  serializeItem,
  extractUserContent,
  buildManagedSection,
  normalizeStageValue,
  MANAGED_SECTION_START,
  USER_CONTENT_START,
} from '../parser';

describe('Parser', () => {
  describe('normalizeStageValue', () => {
    it('normalizes historical stage names to the new six-column workflow', () => {
      expect(normalizeStageValue('planning')).toBe('plan');
      expect(normalizeStageValue('coding')).toBe('code');
      expect(normalizeStageValue('auditing')).toBe('audit');
      expect(normalizeStageValue('queue')).toBe('queue');
    });
  });

  describe('constants', () => {
    it('uses the Kanban-specific managed section separators', () => {
      expect(MANAGED_SECTION_START).toContain('LLMKANBAN:MANAGED');
      expect(USER_CONTENT_START).toContain('LLMKANBAN:USER-CONTENT');
    });
  });

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

<!-- LLMKANBAN:MANAGED -->
# Stage Context
This is the coding stage.
<!-- LLMKANBAN:USER-CONTENT -->

# My Notes
User content here.`;

      const item = parseItem(markdown, '/test/path.md');

      expect(item.frontmatter.id).toBe('test-task-123');
      expect(item.frontmatter.title).toBe('Test Task');
      expect(item.frontmatter.stage).toBe('code');
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

<!-- LLMKANBAN:MANAGED -->
# Stage Context
This is the coding stage.

<!-- LLMKANBAN:USER-CONTENT - Edit below this line -->`;

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
        stage: 'code' as const,
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
      expect(markdown).toContain('stage: code');
      expect(markdown).toContain('LLMKANBAN:MANAGED');
      expect(markdown).toContain('LLMKANBAN:USER-CONTENT');
      expect(markdown).toContain('# My Notes');
    });

    it('should handle items without user content', () => {
      const frontmatter = {
        id: 'test-task-123',
        title: 'Test Task',
        stage: 'code' as const,
        type: 'task' as const,
        tags: [],
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      };
      const managedSection = '# Stage Context';
      const userContent = '';

      const markdown = serializeItem(frontmatter, managedSection, userContent);

      expect(markdown).toContain('LLMKANBAN:USER-CONTENT');
      expect(markdown.endsWith('\n')).toBe(true);
    });
  });

  describe('extractUserContent', () => {
    it('should extract content after USER-CONTENT marker', () => {
      const markdown = `---
frontmatter
---

<!-- LLMKANBAN:MANAGED -->
Managed content
<!-- LLMKANBAN:USER-CONTENT -->

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

      const managedSection = buildManagedSection('code', stageContext, 'Phase 1', phaseContext);

      expect(managedSection).toContain('# Coding Stage');
      expect(managedSection).toContain('# Phase 1');
    });

    it('should handle missing phase context', () => {
      const stageContext = '# Coding Stage\nImplement features.';

      const managedSection = buildManagedSection('code', stageContext);

      expect(managedSection).toContain('# Coding Stage');
      expect(managedSection).not.toContain('# Phase');
    });

    it('includes phase placeholders even when no context is provided', () => {
      const managed = buildManagedSection('plan', 'Stage context', 'Phase 1');
      expect(managed).toMatch(/## 🎯 Stage: Plan/);
      expect(managed).toMatch(/## 📦 Phase: Phase 1/);
      expect(managed).toMatch(/_No phase context defined yet._/);
    });
  });
});
