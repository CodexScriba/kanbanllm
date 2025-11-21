/**
 * Token counting utilities for context size estimation
 */

/**
 * Estimates token count using a simple heuristic
 * Roughly 1 token ≈ 4 characters for English text
 * This is an approximation; actual token count varies by model
 */
export function estimateTokenCount(text: string): number {
  // Remove excessive whitespace
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(normalized.length / 4);
}

/**
 * Estimates token count with more accuracy
 * Accounts for code, markdown, and special characters
 */
export function estimateTokenCountAdvanced(text: string): {
  characters: number;
  words: number;
  estimatedTokens: number;
} {
  const characters = text.length;
  
  // Count words (split by whitespace)
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  
  // More sophisticated estimation
  // Code and special chars tend to use more tokens
  const codeBlockCount = (text.match(/```/g) || []).length / 2;
  const specialCharCount = (text.match(/[{}[\]().,;:!?]/g) || []).length;
  
  // Base estimation: 1 token ≈ 4 chars
  let estimatedTokens = Math.ceil(characters / 4);
  
  // Adjust for code blocks (code uses more tokens)
  estimatedTokens += codeBlockCount * 10;
  
  // Adjust for special characters
  estimatedTokens += Math.ceil(specialCharCount / 2);
  
  return {
    characters,
    words,
    estimatedTokens,
  };
}

/**
 * Formats byte size to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Checks if content size is within recommended limits
 */
export function checkContextSize(text: string): {
  isWithinLimit: boolean;
  warning?: string;
  stats: {
    characters: number;
    words: number;
    estimatedTokens: number;
    size: string;
  };
} {
  const { characters, words, estimatedTokens } = estimateTokenCountAdvanced(text);
  const bytes = new TextEncoder().encode(text).length;
  
  // Recommended limits
  const MAX_TOKENS = 8000; // Conservative limit for most models
  const WARN_TOKENS = 4000; // Warning threshold
  
  let warning: string | undefined;
  let isWithinLimit = true;
  
  if (estimatedTokens > MAX_TOKENS) {
    warning = `Context is very large (${estimatedTokens} tokens). Consider splitting into smaller contexts.`;
    isWithinLimit = false;
  } else if (estimatedTokens > WARN_TOKENS) {
    warning = `Context is large (${estimatedTokens} tokens). May impact LLM performance.`;
  }
  
  return {
    isWithinLimit,
    warning,
    stats: {
      characters,
      words,
      estimatedTokens,
      size: formatBytes(bytes),
    },
  };
}
