import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { ContextEditor } from './components/ContextEditor';
import { TaskForm, TaskFormData } from './components/TaskForm';
import { ErrorPopup } from './components/ErrorPopup';
import { ErrorPopup } from './components/ErrorPopup';
import { ToastContainer, useToast } from './components/Toast';
import { CheatSheet } from './components/CheatSheet';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { BoardData, Stage, WebviewMessage, ExtensionMessage, Agent, Item, ContextMetadata } from './types';

// @ts-ignore
const vscode = acquireVsCodeApi();

const App: React.FC = () => {
  const [boardData, setBoardData] = useState<BoardData>({
    chat: [],
    queue: [],
    plan: [],
    code: [],
    audit: [],
    completed: [],
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [contexts, setContexts] = useState<ContextMetadata[]>([]);
  const [contexts, setContexts] = useState<ContextMetadata[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<{
    type: 'stage' | 'phase' | 'agent' | 'context';
    id: string;
    content: string;
  } | null>(null);
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('');
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const { toasts, showToast, dismissToast } = useToast();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Notify extension that webview is ready
    sendMessage({ type: 'ready' });
    // Request agents and contexts
    sendMessage({ type: 'listAgents' });
    sendMessage({ type: 'listContexts' });

    // Listen for messages from extension
    const messageHandler = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;

      switch (message.type) {
        case 'init':
          setBoardData(message.data);
          setLoading(false);
          break;

        case 'itemCreated':
          addItem(message.item);
          showToast({
            type: 'success',
            title: 'Item created successfully',
            message: message.item.title,
          });
          break;

        case 'itemUpdated':
          updateItem(message.item);
          showToast({
            type: 'info',
            title: 'Item updated',
            message: message.item.title,
          });
          break;

        case 'itemDeleted':
          removeItem(message.itemId);
          showToast({
            type: 'info',
            title: 'Item deleted',
          });
          break;

        case 'error':
          console.error('Error from extension:', message.message);
          setError({ message: message.message });
          break;

        case 'agentData':
          // Agent data received, could be used for editing
          break;

        case 'agentList':
          setAgents(message.agents);
          break;

        case 'contextList':
          setContexts(message.contexts);
          break;

        case 'contextData':
          setActiveContext({
            type: message.contextType,
            id: message.contextId,
            content: message.content
          });
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+N or Cmd+Shift+N to create new task
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setIsTaskFormOpen(true);
      }
      
      // ? to show cheat sheet
      if (e.key === '?' && !isTaskFormOpen && !activeContext) {
        e.preventDefault();
        setIsCheatSheetOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('message', messageHandler);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const sendMessage = (message: WebviewMessage) => {
    vscode.postMessage(message);
  };

  const addItem = (item: Item) => {
    setBoardData(prev => ({
      ...prev,
      [item.stage]: [...prev[item.stage], item],
    }));
  };

  const updateItem = (item: Item) => {
    setBoardData(prev => {
      const newData = { ...prev };
      // Remove from all stages
      Object.keys(newData).forEach(stage => {
        newData[stage as keyof BoardData] = newData[stage as keyof BoardData].filter(i => i.id !== item.id);
      });
      // Add to correct stage
      newData[item.stage].push(item);
      return newData;
    });
  };

  const removeItem = (itemId: string) => {
    setBoardData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(stage => {
        newData[stage as keyof BoardData] = newData[stage as keyof BoardData].filter(i => i.id !== itemId);
      });
      return newData;
    });
  };

  // Filter and sort items
  const getFilteredItems = (items: Item[]): Item[] => {
    let filtered = items;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        item.id.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (filterTag) {
      filtered = filtered.filter(item => item.tags.includes(filterTag));
    }

    // Phase filter
    if (filterPhase) {
      filtered = filtered.filter(item => item.phaseId === filterPhase);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        case 'updated':
        default:
          return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      }
    });

    return filtered;
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      Object.values(boardData)
        .flat()
        .flatMap(item => item.tags)
    )
  ).sort();

  // Get all unique phases
  const allPhases = Array.from(
    new Set(
      Object.values(boardData)
        .flat()
        .filter(item => item.type === 'phase')
        .map(item => item.id)
    )
  ).sort();

  const clearFilters = () => {
    setSearchQuery('');
    setFilterTag('');
    setFilterPhase('');
  };

  const hasFilters = searchQuery || filterTag || filterPhase;

  // Get all filtered items for keyboard navigation
  const filteredBoardData = {
    chat: getFilteredItems(boardData.chat),
    queue: getFilteredItems(boardData.queue),
    plan: getFilteredItems(boardData.plan),
    code: getFilteredItems(boardData.code),
    audit: getFilteredItems(boardData.audit),
    completed: getFilteredItems(boardData.completed),
  };

  const allCardIds = [
    ...filteredBoardData.chat,
    ...filteredBoardData.queue,
    ...filteredBoardData.plan,
    ...filteredBoardData.code,
    ...filteredBoardData.audit,
    ...filteredBoardData.completed,
  ].map(item => item.id);

  useKeyboardShortcuts({
    onCreateTask: () => setIsTaskFormOpen(true),
    onEditCard: (cardId) => sendMessage({ type: 'openItem', itemId: cardId }), // Ctrl+E opens file for now
    onDeleteCard: (cardId) => {
      if (confirm('Are you sure you want to delete this item?')) {
        sendMessage({ type: 'deleteItem', itemId: cardId });
      }
    },
    onOpenCard: (cardId) => sendMessage({ type: 'openItem', itemId: cardId }),
    onFocusSearch: () => searchInputRef.current?.focus(),
    onClearSelection: () => setSelectedCardId(null),
    selectedCardId,
    setSelectedCardId,
    allCardIds,
  });

  return (
    <div className="app">
      <div className="board-controls">
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsTaskFormOpen(true)}
        >
          + Add Task
        </Button>
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          ref={searchInputRef}
        />

        <select
          className="filter-select"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
        >
          <option value="">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
        >
          <option value="">All Phases</option>
          {allPhases.map(phaseId => {
            const phase = Object.values(boardData)
              .flat()
              .find(item => item.id === phaseId);
            return (
              <option key={phaseId} value={phaseId}>
                {phase?.title || phaseId}
              </option>
            );
          })}
        </select>

        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="updated">Updated (newest)</option>
          <option value="created">Created (newest)</option>
          <option value="title">Title (A-Z)</option>
        </select>

        {hasFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <Board
          data={filteredBoardData}
          loading={loading}
          selectedCardId={selectedCardId}
          onCardClick={setSelectedCardId}
          onMoveItem={(itemId, targetStage) => {
            sendMessage({ type: 'moveItem', itemId, targetStage });
            showToast({
              type: 'info',
              title: `Moving to ${targetStage}`,
              message: 'Context will be updated',
            });
          }}
          onOpenItem={(itemId) => {
            sendMessage({ type: 'openItem', itemId });
          }}
          onDeleteItem={(itemId) => {
            if (confirm('Are you sure you want to delete this item?')) {
              sendMessage({ type: 'deleteItem', itemId });
            }
          }}
          onCopy={(itemId, mode) => {
            sendMessage({ type: 'copyWithContext', itemId, mode });
            showToast({
              type: 'success',
              title: 'Copied to clipboard',
              message: `${mode === 'full' ? 'Full context' : mode === 'context' ? 'Context only' : 'User content'} mode`,
            });
          }}
          onUpdate={(itemId, updates) => {
            const item = Object.values(boardData).flat().find(i => i.id === itemId);
            if (item) {
              const updatedItem = { ...item, ...updates };
              sendMessage({ type: 'updateItem', item: updatedItem });
              showToast({
                type: 'info',
                title: 'Update',
                message: 'Item updated',
              });
            }
          }}
          onContextClick={(context) => {
            setActiveContext(context);
          }}
        />
      )}

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={async (data: TaskFormData) => {
          // Send create message to extension
          if (data.type === 'task') {
            sendMessage({
              type: 'createTask',
              title: data.title,
              stage: data.stage,
              phaseId: data.phaseId,
              tags: data.tags,
            });
          } else {
            sendMessage({
              type: 'createPhase',
              title: data.title,
              stage: data.stage,
              tags: data.tags,
            });
          }
        }}
        agents={agents}
        contexts={contexts}
        phases={Object.values(boardData)
          .flat()
          .filter(item => item.type === 'phase')
          .map(item => ({ id: item.id, title: item.title }))}
        allTags={allTags}
      />

      {activeContext && (
        <Modal
          isOpen={!!activeContext}
          onClose={() => setActiveContext(null)}
          title={`Editing ${activeContext.type}: ${activeContext.id}`}
        >
          <ContextEditor
            content={activeContext.content}
            onSave={(newContent) => {
              setIsSavingContext(true);
              sendMessage({
                type: 'saveContext',
                contextType: activeContext.type,
                contextId: activeContext.id,
                content: newContent
              });
              // Show success toast and close after brief delay
              setTimeout(() => {
                setIsSavingContext(false);
                showToast({
                  type: 'success',
                  title: 'Context saved',
                  message: `${activeContext.type}: ${activeContext.id}`,
                });
              }, 500);
            }}
            onClose={() => setActiveContext(null)}
            isSaving={isSavingContext}
          />
        </Modal>
      )}

      {error && (
        <ErrorPopup
          message={error.message}
          details={error.details}
          onClose={() => setError(null)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Modal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        title="Keyboard Shortcuts"
      >
        <CheatSheet />
      </Modal>
    </div>
  );
};

export default App;
