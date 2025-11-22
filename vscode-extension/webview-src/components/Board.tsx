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
  onUpdate: (itemId: string, updates: Partial<Item>) => void;
  onContextClick: (context: { type: 'stage' | 'phase' | 'agent' | 'context'; id: string; content: string }) => void;
  selectedCardId?: string | null;
  onCardClick?: (cardId: string) => void;
}

const COLUMNS: { id: Stage; title: string }[] = [
  { id: 'chat', title: 'Chat' },
  { id: 'queue', title: 'Queue' },
  { id: 'plan', title: 'Plan' },
  { id: 'code', title: 'Code' },
  { id: 'audit', title: 'Audit' },
  { id: 'completed', title: 'Completed' },
];

const Board: React.FC<BoardProps> = ({
  data,
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
  return (
    <div className="board">
      {COLUMNS.map(column => (
        <Column
          key={column.id}
          stage={column.id}
          title={column.title}
          items={data[column.id]}
          onMoveItem={onMoveItem}
          onOpenItem={onOpenItem}
          onDeleteItem={onDeleteItem}
          onCopy={onCopy}
          onUpdate={onUpdate}
          onContextClick={onContextClick}
          loading={loading}
          selectedCardId={selectedCardId}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
};

export default Board;
