import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Card from './Card';
import { ColumnConfig, Item } from '../types';

interface ColumnProps {
  config: ColumnConfig;
  items: Item[];
  onOpenItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

const Column: React.FC<ColumnProps> = ({ config, items, onOpenItem, onDeleteItem }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: config.id,
  });

  const itemIds = items.map(item => item.id);

  return (
    <div className="column">
      <div className="column-header" style={{ borderLeftColor: config.color }}>
        <span className="column-icon">{config.icon}</span>
        <h2 className="column-title">{config.title}</h2>
        <span className="column-count">{items.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`column-content ${isOver ? 'drop-zone-active' : ''}`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.length === 0 ? (
            <div className="empty-state">
              <p>No items in {config.title.toLowerCase()}</p>
            </div>
          ) : (
            items.map(item => (
              <Card
                key={item.id}
                item={item}
                onOpenItem={onOpenItem}
                onDeleteItem={onDeleteItem}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default Column;
