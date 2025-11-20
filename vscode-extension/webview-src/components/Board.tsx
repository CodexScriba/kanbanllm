import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import Column from './Column';
import Card from './Card';
import { BoardData, ColumnConfig, Item, Stage } from '../types';

interface BoardProps {
  data: BoardData;
  onMoveItem: (itemId: string, targetStage: Stage) => void;
  onOpenItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'queue', title: 'Queue', icon: '📋', color: '#3b82f6' },
  { id: 'planning', title: 'Planning', icon: '📝', color: '#eab308' },
  { id: 'coding', title: 'Coding', icon: '💻', color: '#10b981' },
  { id: 'auditing', title: 'Auditing', icon: '🔍', color: '#8b5cf6' },
  { id: 'completed', title: 'Completed', icon: '✅', color: '#6b7280' },
];

const Board: React.FC<BoardProps> = ({ data, onMoveItem, onOpenItem, onDeleteItem }) => {
  const [activeItem, setActiveItem] = React.useState<Item | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Find the item being dragged
    const item = Object.values(data)
      .flat()
      .find(item => item.id === active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveItem(null);
      return;
    }

    const itemId = active.id as string;
    const targetStage = over.id as Stage;

    // Find current stage of the item
    const currentStage = Object.entries(data).find(([stage, items]) =>
      items.some((item: Item) => item.id === itemId)
    )?.[0] as Stage | undefined;

    if (currentStage && targetStage && currentStage !== targetStage) {
      onMoveItem(itemId, targetStage);
    }

    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="board">
        {COLUMNS.map(column => (
          <Column
            key={column.id}
            config={column}
            items={data[column.id]}
            onOpenItem={onOpenItem}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <Card item={activeItem} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Board;
