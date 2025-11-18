import { describe, expect, it } from 'vitest';
import {
  MANAGED_SECTION_START,
  USER_CONTENT_START,
  buildManagedSection,
  normalizeStageValue,
} from '../parser';

describe('parser helpers', () => {
  it('normalizes historical stage names to the new six-column workflow', () => {
    expect(normalizeStageValue('planning')).toBe('plan');
    expect(normalizeStageValue('coding')).toBe('code');
    expect(normalizeStageValue('auditing')).toBe('audit');
    expect(normalizeStageValue('queue')).toBe('queue');
  });

  it('uses the Kanban-specific managed section separators', () => {
    expect(MANAGED_SECTION_START).toContain('LLMKANBAN:MANAGED');
    expect(USER_CONTENT_START).toContain('LLMKANBAN:USER-CONTENT');
  });

  it('includes phase placeholders even when no context is provided', () => {
    const managed = buildManagedSection('plan', 'Stage context', 'Phase 1');
    expect(managed).toMatch(/## 🎯 Stage: Plan/);
    expect(managed).toMatch(/## 📦 Phase: Phase 1/);
    expect(managed).toMatch(/_No phase context defined yet._/);
  });
});
