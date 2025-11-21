import React from 'react';
import { Item, Stage, ColumnConfig } from '../types';
import { Card } from './Card';

interface ColumnProps {
  config: ColumnConfig;
  items: Item[];
  onMoveItem: (itemId: string, targetStage: Stage) => void;
  onOpenItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onCopy: (itemId: string, mode: 'full' | 'context' | 'user') => void;
  onUpdate: (item: Item) => void;
}

export const Column: React.FC<ColumnProps> = ({
  config,
  items,
  onMoveItem,
  onOpenItem,
  onDeleteItem,
  onCopy,
  onUpdate
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('bg-surface-hover/50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-surface-hover/50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-surface-hover/50');
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) {
      onMoveItem(itemId, config.id);
    }
  };

  return (
    <div 
      className="column glass"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-text-secondary">
            {config.title}
          </h2>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-surface text-text-muted">
          {items.length}
        </span>
      </div>

      <div className="column-content custom-scrollbar">
        {items.map(item => (
          <Card
            key={item.id}
            item={item}
            onOpen={onOpenItem}
            onDelete={onDeleteItem}
            onCopy={onCopy}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
};
