import React, { useState, useMemo } from 'react';
import { ContextMetadata } from '../types';

interface ContextSelectorProps {
  contexts: ContextMetadata[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  contexts,
  selectedIds,
  onChange,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    stage: true,
    phase: true,
    agent: true,
    context: true,
  });

  const filteredContexts = useMemo(() => {
    if (!searchQuery.trim()) return contexts;
    const query = searchQuery.toLowerCase();
    return contexts.filter(ctx => 
      ctx.name.toLowerCase().includes(query) || 
      ctx.id.toLowerCase().includes(query)
    );
  }, [contexts, searchQuery]);

  const groupedContexts = useMemo(() => {
    return filteredContexts.reduce((acc, context) => {
      const type = context.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(context);
      return acc;
    }, {} as Record<string, ContextMetadata[]>);
  }, [filteredContexts]);

  const toggleContext = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleGroup = (type: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stage': return 'Stages';
      case 'phase': return 'Phases';
      case 'agent': return 'Agents';
      case 'context': return 'Custom';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stage': return '📁';
      case 'phase': return '📦';
      case 'agent': return '🤖';
      case 'context': return '📄';
      default: return '📄';
    }
  };

  // Order of groups
  const groupOrder = ['stage', 'phase', 'agent', 'context'];

  return (
    <div className={`context-selector-container ${className}`}>
      <div className="context-search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="context-search-input"
          placeholder="Search contexts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {selectedIds.length > 0 && (
          <span className="selected-count-badge">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      <div className="context-list-scroll">
        {groupOrder.map(type => {
          const groupContexts = groupedContexts[type];
          if (!groupContexts || groupContexts.length === 0) return null;

          const isExpanded = expandedGroups[type] || searchQuery.length > 0;

          return (
            <div key={type} className="context-group-section">
              <button 
                type="button"
                className="context-group-header-btn"
                onClick={() => toggleGroup(type)}
              >
                <span className="group-icon">{getTypeIcon(type)}</span>
                <span className="group-label">{getTypeLabel(type)}</span>
                <span className="group-count">({groupContexts.length})</span>
                <span className={`group-chevron ${isExpanded ? 'expanded' : ''}`}>▼</span>
              </button>
              
              {isExpanded && (
                <div className="context-group-items animate-in">
                  {groupContexts.map(ctx => (
                    <label key={ctx.id} className="context-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(ctx.id)}
                        onChange={() => toggleContext(ctx.id)}
                      />
                      <span className="checkbox-custom"></span>
                      <div className="context-info">
                        <span className="context-name">{ctx.name}</span>
                        <span className="context-meta">
                          {ctx.id} • {Math.round(ctx.size / 1024 * 10) / 10} KB
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {filteredContexts.length === 0 && (
          <div className="no-results">
            No contexts found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
