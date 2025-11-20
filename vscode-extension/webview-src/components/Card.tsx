import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Item } from '../types';

interface CardProps {
  item: Item;
  isDragging?: boolean;
  onOpenItem?: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
}

const Card: React.FC<CardProps> = ({ item, isDragging, onOpenItem, onDeleteItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if dragging
    if (isDragging || isSortableDragging) return;

    // Don't trigger if clicking on action buttons
    if ((e.target as HTMLElement).closest('.card-actions')) return;

    onOpenItem?.(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteItem?.(item.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card ${item.type === 'phase' ? 'card-phase' : 'card-task'} ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <div className="card-header">
        <span className="card-type-icon">
          {item.type === 'phase' ? '📦' : '✅'}
        </span>
        <h3 className="card-title">{item.title}</h3>
      </div>

      {item.tags.length > 0 && (
        <div className="card-tags">
          {item.tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="card-metadata">
        <div className="metadata-row">
          <span className="metadata-label">ID:</span>
          <span className="metadata-value">{item.id}</span>
        </div>
        {item.phaseId && (
          <div className="metadata-row">
            <span className="metadata-label">Phase:</span>
            <span className="metadata-value">{item.phaseId}</span>
          </div>
        )}
        <div className="metadata-row">
          <span className="metadata-label">Updated:</span>
          <span className="metadata-value">{formatDate(item.updated)}</span>
        </div>
      </div>

      <div className="card-actions">
        <button
          className="card-action-btn delete-btn"
          onClick={handleDelete}
          title="Delete item"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default Card;
