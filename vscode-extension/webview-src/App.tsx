import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import { BoardData, ExtensionMessage, WebviewMessage, Item } from './types';

// @ts-ignore
const vscode = acquireVsCodeApi();

const App: React.FC = () => {
  const [boardData, setBoardData] = useState<BoardData>({
    queue: [],
    planning: [],
    coding: [],
    auditing: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('');
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');

  useEffect(() => {
    // Notify extension that webview is ready
    sendMessage({ type: 'ready' });

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
          break;

        case 'itemUpdated':
          updateItem(message.item);
          break;

        case 'itemDeleted':
          removeItem(message.itemId);
          break;

        case 'error':
          console.error('Error from extension:', message.message);
          // TODO: Show error toast
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
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

  return (
    <div className="app">
      <div className="board-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          data={{
            queue: getFilteredItems(boardData.queue),
            planning: getFilteredItems(boardData.planning),
            coding: getFilteredItems(boardData.coding),
            auditing: getFilteredItems(boardData.auditing),
            completed: getFilteredItems(boardData.completed),
          }}
          onMoveItem={(itemId, targetStage) => {
            sendMessage({ type: 'moveItem', itemId, targetStage });
          }}
          onOpenItem={(itemId) => {
            sendMessage({ type: 'openItem', itemId });
          }}
          onDeleteItem={(itemId) => {
            if (confirm('Are you sure you want to delete this item?')) {
              sendMessage({ type: 'deleteItem', itemId });
            }
          }}
        />
      )}
    </div>
  );
};

export default App;
