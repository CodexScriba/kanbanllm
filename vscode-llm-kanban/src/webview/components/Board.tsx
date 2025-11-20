/**
 * Kanban Board component
 * Main board container with drag-and-drop
 */

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Column } from './Column';
import { Card } from './Card';
import { Item, Stage, STAGES, STAGE_DISPLAY_NAMES } from '../../core/types';

interface BoardProps {
  vscode: any;
}

export const Board: React.FC<BoardProps> = ({ vscode }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Listen for messages from the extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'update':
          setItems(message.items || []);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial data
    vscode.postMessage({ type: 'requestUpdate' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode]);

  // Group items by stage
  const itemsByStage: Record<Stage, Item[]> = {
    backlog: [],
    'in-progress': [],
    review: [],
    audit: [],
    completed: [],
  };

  items.forEach((item) => {
    itemsByStage[item.frontmatter.stage].push(item);
  });

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i.frontmatter.id === event.active.id);
    setActiveItem(item || null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveItem(null);
      return;
    }

    const itemId = active.id as string;
    const newStage = over.id as Stage;

    // Send message to extension to move the item
    vscode.postMessage({
      type: 'moveItem',
      itemId,
      newStage,
    });

    setActiveItem(null);
  };

  // Handle card click
  const handleCardClick = (item: Item) => {
    vscode.postMessage({
      type: 'openItem',
      filePath: item.filePath,
    });
  };

  // Handle create click
  const handleCreate = (stage: Stage, type: 'task' | 'phase') => {
    vscode.postMessage({
      type: 'createItem',
      data: { type, stage },
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="board">
        <div className="board-header">
          <h1>LLM Kanban Board</h1>
          <button
            className="refresh-button"
            onClick={() => vscode.postMessage({ type: 'requestUpdate' })}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="columns">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              title={STAGE_DISPLAY_NAMES[stage]}
              items={itemsByStage[stage]}
              onCardClick={handleCardClick}
              onCreate={handleCreate}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeItem ? (
          <Card item={activeItem} isDragging onClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
