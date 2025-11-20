/**
 * Column component
 * Represents a stage column in the Kanban board
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card } from './Card';
import { Item, Stage } from '../../core/types';

interface ColumnProps {
  stage: Stage;
  title: string;
  items: Item[];
  onCardClick: (item: Item) => void;
  onCreate: (stage: Stage, type: 'task' | 'phase') => void;
}

export const Column: React.FC<ColumnProps> = ({
  stage,
  title,
  items,
  onCardClick,
  onCreate,
}) => {
  const { setNodeRef } = useDroppable({
    id: stage,
  });

  const itemIds = items.map((item) => item.frontmatter.id);

  return (
    <div className="column">
      <div className="column-header">
        <h2 className="column-title">{title}</h2>
        <span className="column-count">{items.length}</span>
      </div>

      <div className="column-actions">
        <button
          className="create-button"
          onClick={() => onCreate(stage, 'task')}
          title="Create Task"
        >
          + Task
        </button>
        <button
          className="create-button"
          onClick={() => onCreate(stage, 'phase')}
          title="Create Phase"
        >
          + Phase
        </button>
      </div>

      <div ref={setNodeRef} className="column-content">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.length === 0 ? (
            <div className="empty-state">No items</div>
          ) : (
            items.map((item) => (
              <Card
                key={item.frontmatter.id}
                item={item}
                onClick={() => onCardClick(item)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
