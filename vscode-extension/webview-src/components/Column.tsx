import React from 'react';
import { Item, Stage, ColumnConfig } from '../types';
import { Card } from './Card';
import { SkeletonCards } from './SkeletonCard';

interface ColumnProps {
  stage: Stage;
  title: string;
  items: Item[];
  loading?: boolean;
  onMoveItem: (itemId: string, targetStage: Stage) => void;
  onOpenItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onCopy: (itemId: string, mode: 'full' | 'context' | 'user') => void;
  onUpdate: (itemId: string, updates: Partial<Item>) => void;
  onContextClick: (context: { type: 'stage' | 'phase' | 'agent' | 'context'; id: string; content: string }) => void;
  selectedCardId?: string | null;
  onCardClick?: (cardId: string) => void;
}

export const Column: React.FC<ColumnProps> = ({
  stage,
  title,
  items,
  onMoveItem,
  onOpenItem,
  onDeleteItem,
  onCopy,
  onUpdate,
  onContextClick,
  loading = false,
  selectedCardId,
  onCardClick,
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
      onMoveItem(itemId, stage);
    }
  };

  return (
    <div 
      className={`column ${loading ? 'loading' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-stage={stage}
    >
      <div className="column-header">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          <span className="text-xs text-muted-foreground bg-surface-hover px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
      </div>

      <div className="column-content custom-scrollbar">
        {loading ? (
          <SkeletonCards count={3} />
        ) : (
          items.map(item => (
            <Card
              key={item.id}
              item={item}
              onOpen={onOpenItem}
              onDelete={onDeleteItem}
              onCopy={onCopy}
              onUpdate={onUpdate}
              onContextClick={onContextClick}
              isSelected={selectedCardId === item.id}
              onSelect={() => onCardClick?.(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
