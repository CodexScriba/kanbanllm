import React from 'react';

interface Shortcut {
  key: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { key: '?', description: 'Show this cheat sheet' },
  { key: 'Ctrl + Shift + N', description: 'Create new task' },
  { key: 'Ctrl + E', description: 'Edit selected card (open file)' },
  { key: 'Delete', description: 'Delete selected card' },
  { key: '↑ / ↓ / ← / →', description: 'Navigate between cards' },
  { key: 'Enter', description: 'Open selected card' },
  { key: 'Esc', description: 'Close modal / Clear selection' },
];

export const CheatSheet: React.FC = () => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded bg-surface-hover border border-white/5">
            <span className="text-sm text-text-secondary">{shortcut.description}</span>
            <kbd className="px-2 py-1 text-xs font-mono font-medium text-primary bg-surface border border-border rounded shadow-sm">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
};
