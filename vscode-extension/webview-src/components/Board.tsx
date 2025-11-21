import React from 'react';
import { BoardData, Stage, ColumnConfig, Item } from '../types';
import { Column } from './Column';

interface BoardProps {
  data: BoardData;
  loading?: boolean;
  onMoveItem: (itemId: string, targetStage: Stage) => void;
  onOpenItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onCopy: (itemId: string, mode: 'full' | 'context' | 'user') => void;
  onUpdate: (item: Item) => void;
  onContextClick?: (contextType: 'agent' | 'context', contextId: string) => void;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'chat', title: 'Chat', icon: '💬', color: '#6366f1' },
  { id: 'queue', title: 'Queue', icon: '📥', color: '#64748b' },
  { id: 'plan', title: 'Plan', icon: '📋', color: '#eab308' },
  { id: 'code', title: 'Code', icon: '💻', color: '#3b82f6' },
  { id: 'audit', title: 'Audit', icon: '🔍', color: '#a855f7' },
  { id: 'completed', title: 'Done', icon: '✅', color: '#22c55e' },
];

const Board: React.FC<BoardProps> = ({ data, loading = false, onMoveItem, onOpenItem, onDeleteItem, onCopy, onUpdate, onContextClick }) => {
  return (
    <div className="board-container">
      {COLUMNS.map(col => (
        <Column
          key={col.id}
          config={col}
          items={data[col.id] || []}
          loading={loading}
          onMoveItem={onMoveItem}
          onOpenItem={onOpenItem}
          onDeleteItem={onDeleteItem}
          onCopy={onCopy}
          onUpdate={onUpdate}
          onContextClick={onContextClick}
        />
      ))}
    </div>
  );
};

export default Board;
