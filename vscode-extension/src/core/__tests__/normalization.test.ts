import { normalizeStageValue } from '../parser';
import { validateStage } from '../validators';

describe('Stage Normalization', () => {
  test('should normalize canonical stages to themselves', () => {
    expect(normalizeStageValue('chat')).toBe('chat');
    expect(normalizeStageValue('queue')).toBe('queue');
    expect(normalizeStageValue('plan')).toBe('plan');
    expect(normalizeStageValue('code')).toBe('code');
    expect(normalizeStageValue('audit')).toBe('audit');
    expect(normalizeStageValue('completed')).toBe('completed');
  });

  test('should normalize legacy aliases to canonical stages', () => {
    expect(normalizeStageValue('planning')).toBe('plan');
    expect(normalizeStageValue('coding')).toBe('code');
    expect(normalizeStageValue('auditing')).toBe('audit');
    expect(normalizeStageValue('backlog')).toBe('queue');
    expect(normalizeStageValue('in-progress')).toBe('plan');
    expect(normalizeStageValue('review')).toBe('audit');
  });

  test('should throw error for invalid stages', () => {
    // @ts-ignore
    expect(() => normalizeStageValue('invalid')).toThrow();
  });
});

describe('Stage Validation', () => {
  test('should validate canonical stages', () => {
    expect(validateStage('chat')).toBe(true);
    expect(validateStage('queue')).toBe(true);
    expect(validateStage('plan')).toBe(true);
    expect(validateStage('code')).toBe(true);
    expect(validateStage('audit')).toBe(true);
    expect(validateStage('completed')).toBe(true);
  });

  test('should not validate legacy aliases (they must be normalized first)', () => {
    expect(validateStage('planning')).toBe(false);
    expect(validateStage('coding')).toBe(false);
    expect(validateStage('auditing')).toBe(false);
  });

  test('should not validate invalid stages', () => {
    expect(validateStage('invalid')).toBe(false);
    expect(validateStage('')).toBe(false);
  });
});
