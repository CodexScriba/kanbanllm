import React from 'react';
import { Item } from '../types';
import { Button } from './ui/Button';
import { CopyModeSelector } from './CopyModeSelector';

interface CardProps {
  item: Item;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy?: (id: string, mode: 'full' | 'context' | 'user') => void;
  onUpdate?: (itemId: string, updates: Partial<Item>) => void;
  onContextClick?: (context: { type: 'stage' | 'phase' | 'agent' | 'context'; id: string; content: string }) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  item, 
  onOpen, 
  onDelete, 
  onCopy, 
  onUpdate, 
  onContextClick,
  isSelected,
  onSelect
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(item.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    // Add dragging class
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
  };

  const getIcon = () => {
    if (item.type === 'phase') return '📦';
    return '📝';
  };

  return (
    <div 
      className={`card group ${isSelected ? 'selected ring-2 ring-primary' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      data-card-id={item.id}
      tabIndex={0}
    >
      <div className="card-header">
        <span className="text-xs font-medium text-muted-foreground opacity-70">
          {item.id}
        </span>
        {item.phaseId && (
          <span className="phase-badge" title={`Phase: ${item.phaseId}`}>
            📦 {item.phaseId}
          </span>
        )}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onCopy && (
            <CopyModeSelector
              itemId={item.id}
              onCopy={(itemId, mode) => {
                onCopy(itemId, mode);
              }}
            />
          )}
          
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1 bg-surface shadow-lg rounded p-1 absolute right-0 top-0 z-10 border border-destructive">
              <span className="text-[10px] text-destructive font-bold px-1">Sure?</span>
              <Button
                variant="destructive"
                size="sm"
                className="h-5 w-5 text-[10px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
              >
                ✓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 text-[10px]"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
              >
                ✕
              </Button>
            </div>
          ) : (
            <Button 
              variant="icon" 
              size="sm" 
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              title="Delete"
            >
              🗑️
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mb-2" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="w-full bg-input border border-primary rounded px-2 py-1 text-sm text-text-primary outline-none"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (editTitle !== item.title) {
                  onUpdate?.(item.id, { title: editTitle });
                }
                setIsEditing(false);
              } else if (e.key === 'Escape') {
                setEditTitle(item.title);
                setIsEditing(false);
              }
            }}
            onBlur={() => {
              if (editTitle !== item.title) {
                onUpdate?.(item.id, { title: editTitle });
              }
              setIsEditing(false);
            }}
          />
        </div>
      ) : (
        <h3 
          className="card-title group/title relative"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <span className="mr-2">{getIcon()}</span>
          {item.title}
          <span className="opacity-0 group-hover/title:opacity-100 absolute right-0 top-0 text-xs text-text-muted">
            ✎
          </span>
        </h3>
      )}

      <div className="card-meta flex-wrap">
        {item.agent && (
          <span 
            className="tag agent-tag"
            onClick={(e) => {
              e.stopPropagation();
              if (item.agent) {
                onContextClick?.({ type: 'agent', id: item.agent, content: '' });
              }
            }}
            title="Click to edit agent"
          >
            🤖 {item.agent}
          </span>
        )}
        {item.contexts && item.contexts.length > 0 && (
          <>
            {item.contexts.map((ctx, idx) => (
              <span 
                key={ctx}
                className="tag bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onContextClick?.({ type: 'context', id: ctx, content: '' });
                }}
                title={`Click to edit context: ${ctx}`}
              >
                📚 {ctx}
              </span>
            ))}
          </>
        )}
        {item.tags.map(tag => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="mt-3 flex justify-between items-center text-xs text-muted">
        <span>{new Date(item.updated).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
