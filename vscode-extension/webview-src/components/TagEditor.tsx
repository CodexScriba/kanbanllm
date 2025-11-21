import React, { useState, useRef, useEffect } from 'react';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  allTags?: string[]; // For autocomplete suggestions
  placeholder?: string;
  maxTags?: number;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  tags,
  onChange,
  allTags = [],
  placeholder = 'Add tag...',
  maxTags,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const suggestions = inputValue.trim()
    ? allTags.filter(
        tag =>
          !tags.includes(tag) &&
          tag.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) return;
    if (maxTags && tags.length >= maxTags) return;

    onChange([...tags, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="tag-editor-container">
      <div className="tag-editor">
        {tags.map(tag => (
          <span key={tag} className="tag-chip">
            {tag}
            <button
              type="button"
              className="tag-remove"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <div className="tag-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="tag-input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={maxTags ? tags.length >= maxTags : false}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="tag-suggestions">
              {suggestions.slice(0, 5).map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  className="tag-suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
