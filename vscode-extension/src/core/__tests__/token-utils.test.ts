import { estimateTokenCount, estimateTokenCountAdvanced, formatBytes, checkContextSize } from '../token-utils';

describe('Token Utils', () => {
  describe('estimateTokenCount', () => {
    it('should estimate tokens for simple text', () => {
      const text = 'Hello world';
      const tokens = estimateTokenCount(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    it('should handle empty string', () => {
      expect(estimateTokenCount('')).toBe(0);
    });

    it('should normalize whitespace', () => {
      const text1 = 'Hello    world';
      const text2 = 'Hello world';
      expect(estimateTokenCount(text1)).toBe(estimateTokenCount(text2));
    });
  });

  describe('estimateTokenCountAdvanced', () => {
    it('should return detailed stats', () => {
      const text = 'Hello world! This is a test.';
      const stats = estimateTokenCountAdvanced(text);
      
      expect(stats.characters).toBeGreaterThan(0);
      expect(stats.words).toBe(6);
      expect(stats.estimatedTokens).toBeGreaterThan(0);
    });

    it('should account for code blocks', () => {
      const textWithCode = '```\nconst x = 1;\n```';
      const textWithoutCode = 'const x = 1;';
      
      const withCode = estimateTokenCountAdvanced(textWithCode);
      const withoutCode = estimateTokenCountAdvanced(textWithoutCode);
      
      expect(withCode.estimatedTokens).toBeGreaterThan(withoutCode.estimatedTokens);
    });

    it('should account for special characters', () => {
      const textWithSpecial = 'Hello, world! {test: [1, 2, 3]}';
      const textSimple = 'Hello world test 1 2 3';
      
      const withSpecial = estimateTokenCountAdvanced(textWithSpecial);
      const simple = estimateTokenCountAdvanced(textSimple);
      
      expect(withSpecial.estimatedTokens).toBeGreaterThanOrEqual(simple.estimatedTokens);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('checkContextSize', () => {
    it('should pass for small contexts', () => {
      const text = 'Small context';
      const result = checkContextSize(text);
      
      expect(result.isWithinLimit).toBe(true);
      expect(result.warning).toBeUndefined();
      expect(result.stats.characters).toBeGreaterThan(0);
    });

    it('should warn for medium contexts', () => {
      // Create a ~4500 token context (18000 chars)
      const text = 'a'.repeat(18000);
      const result = checkContextSize(text);
      
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('large');
    });

    it('should fail for very large contexts', () => {
      // Create a ~9000 token context (36000 chars)
      const text = 'a'.repeat(36000);
      const result = checkContextSize(text);
      
      expect(result.isWithinLimit).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('very large');
    });

    it('should include all stats', () => {
      const text = 'Test context';
      const result = checkContextSize(text);
      
      expect(result.stats.characters).toBeGreaterThan(0);
      expect(result.stats.words).toBeGreaterThan(0);
      expect(result.stats.estimatedTokens).toBeGreaterThan(0);
      expect(result.stats.size).toBeDefined();
    });
  });
});
