/**
 * Card component
 * Represents a task or phase card in the Kanban board
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Item } from '../../core/types';

interface CardProps {
  item: Item;
  onClick: () => void;
  isDragging?: boolean;
}

export const Card: React.FC<CardProps> = ({ item, onClick, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.frontmatter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const isPhase = item.frontmatter.type === 'phase';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card ${isPhase ? 'card-phase' : 'card-task'}`}
      onClick={onClick}
    >
      <div className="card-header">
        <span className="card-type-badge">
          {isPhase ? '📦 Phase' : '✅ Task'}
        </span>
      </div>

      <h3 className="card-title">{item.frontmatter.title}</h3>

      {item.frontmatter.phase && !isPhase && (
        <div className="card-phase-link">
          Phase: {item.frontmatter.phase}
        </div>
      )}

      {item.frontmatter.tags && item.frontmatter.tags.length > 0 && (
        <div className="card-tags">
          {item.frontmatter.tags.map((tag) => (
            <span key={tag} className="card-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="card-footer">
        <span className="card-id">{item.frontmatter.id}</span>
      </div>
    </div>
  );
};
