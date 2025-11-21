import React from 'react';
import { Item } from '../types';
import { Button } from './ui/Button';

interface CardProps {
  item: Item;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy?: (id: string, mode: 'full' | 'context' | 'user') => void;
  onUpdate?: (item: Item) => void;
  onContextClick?: (contextType: 'agent' | 'context', contextId: string) => void;
}

export const Card: React.FC<CardProps> = ({ item, onOpen, onDelete, onCopy, onUpdate, onContextClick }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(item.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const getIcon = () => {
    if (item.type === 'phase') return '📦';
    return '📝';
  };

  return (
    <div 
      className="card group"
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpen(item.id)}
    >
      <div className="card-header">
        <span className="text-xs font-medium text-muted-foreground opacity-70">
          {item.id}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="icon" 
            size="sm" 
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onCopy?.(item.id, 'full');
            }}
            title="Copy with context"
          >
            📋
          </Button>
          
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
                onUpdate?.({ ...item, title: editTitle });
                setIsEditing(false);
              } else if (e.key === 'Escape') {
                setEditTitle(item.title);
                setIsEditing(false);
              }
            }}
            onBlur={() => {
              setEditTitle(item.title);
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
            className="tag bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 cursor-pointer hover:bg-indigo-500/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onContextClick?.('agent', item.agent!);
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
                  onContextClick?.('context', ctx);
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
        {item.phaseId && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover">
            {item.phaseId}
          </span>
        )}
      </div>
    </div>
  );
};
