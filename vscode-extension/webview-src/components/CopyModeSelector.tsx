import React, { useState, useRef, useEffect } from 'react';

type CopyMode = 'full' | 'context' | 'user';

interface CopyModeSelectorProps {
  itemId: string;
  onCopy: (itemId: string, mode: CopyMode) => void;
}

export const CopyModeSelector: React.FC<CopyModeSelectorProps> = ({ itemId, onCopy }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const copyModes: Array<{ mode: CopyMode; icon: string; label: string; description: string }> = [
    {
      mode: 'full',
      icon: '📄',
      label: 'Full Context',
      description: 'Task + Architecture + Phase + Stage',
    },
    {
      mode: 'context',
      icon: '🔗',
      label: 'Context Only',
      description: 'Architecture + Phase + Stage',
    },
    {
      mode: 'user',
      icon: '✍️',
      label: 'User Content',
      description: 'Just user-written content',
    },
  ];

  const handleCopy = (mode: CopyMode) => {
    onCopy(itemId, mode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="copy-mode-selector" ref={dropdownRef}>
      <button
        type="button"
        className="card-action-btn copy-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Copy with context"
      >
        📋 Copy {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className="copy-mode-dropdown">
          {copyModes.map(({ mode, icon, label, description }) => (
            <button
              key={mode}
              type="button"
              className="copy-mode-option"
              onClick={() => handleCopy(mode)}
            >
              <span className="copy-mode-icon">{icon}</span>
              <div className="copy-mode-info">
                <div className="copy-mode-label">{label}</div>
                <div className="copy-mode-description">{description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
