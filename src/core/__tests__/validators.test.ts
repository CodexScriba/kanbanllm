import {
  validateFrontmatter,
  validateStage,
  validateItemType,
  validateFilename,
  sanitizeInput,
  FrontmatterSchema,
} from '../validators';

describe('Validators', () => {
  describe('validateFrontmatter', () => {
    it('should validate correct frontmatter', () => {
      const validFrontmatter = {
        id: 'test-id-123',
        title: 'Test Task',
        stage: 'coding',
        type: 'task',
        tags: ['test', 'unit'],
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      };

      expect(() => validateFrontmatter(validFrontmatter)).not.toThrow();
    });

    it('should reject frontmatter with missing required fields', () => {
      const invalidFrontmatter = {
        title: 'Test Task',
        stage: 'coding',
      };

      expect(() => validateFrontmatter(invalidFrontmatter)).toThrow();
    });

    it('should reject invalid stage values', () => {
      const invalidFrontmatter = {
        id: 'test-id-123',
        title: 'Test Task',
        stage: 'invalid-stage',
        type: 'task',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      };

      expect(() => validateFrontmatter(invalidFrontmatter)).toThrow();
    });

    it('should accept optional phaseId', () => {
      const validFrontmatter = {
        id: 'test-id-123',
        title: 'Test Task',
        stage: 'coding',
        type: 'task',
        phaseId: 'phase1-test',
        tags: [],
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      };

      expect(() => validateFrontmatter(validFrontmatter)).not.toThrow();
    });
  });

  describe('validateStage', () => {
    it('should accept valid stages', () => {
      expect(validateStage('queue')).toBe(true);
      expect(validateStage('planning')).toBe(true);
      expect(validateStage('coding')).toBe(true);
      expect(validateStage('auditing')).toBe(true);
      expect(validateStage('completed')).toBe(true);
    });

    it('should reject invalid stages', () => {
      expect(validateStage('invalid')).toBe(false);
      expect(validateStage('Queue')).toBe(false); // Case sensitive
      expect(validateStage('')).toBe(false);
    });
  });

  describe('validateItemType', () => {
    it('should accept valid item types', () => {
      expect(validateItemType('phase')).toBe(true);
      expect(validateItemType('task')).toBe(true);
    });

    it('should reject invalid item types', () => {
      expect(validateItemType('invalid')).toBe(false);
      expect(validateItemType('Phase')).toBe(false); // Case sensitive
      expect(validateItemType('')).toBe(false);
    });
  });

  describe('validateFilename', () => {
    it('should accept valid filenames', () => {
      expect(validateFilename('task-1-test-abc123.md')).toBe(true);
      expect(validateFilename('phase1-auth-system-xyz789.md')).toBe(true);
    });

    it('should reject filenames without .md extension', () => {
      expect(validateFilename('task-1-test.txt')).toBe(false);
      expect(validateFilename('task-1-test')).toBe(false);
    });

    it('should reject filenames with special characters', () => {
      expect(validateFilename('task@1!test.md')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeInput('test<script>alert()</script>')).toBe('testscriptalert()script');
    });

    it('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });
  });

  describe('FrontmatterSchema', () => {
    it('should parse valid frontmatter', () => {
      const data = {
        id: 'test-id',
        title: 'Test',
        stage: 'coding',
        type: 'task',
        tags: ['test'],
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      };

      const result = FrontmatterSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should provide default empty array for tags', () => {
      const data = {
        id: 'test-id',
        title: 'Test',
        stage: 'coding',
        type: 'task',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      };

      const result = FrontmatterSchema.parse(data);
      expect(result.tags).toEqual([]);
    });
  });
});
