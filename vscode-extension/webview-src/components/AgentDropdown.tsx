import React, { useState, useMemo } from 'react';
import { Agent } from '../types';

interface AgentDropdownProps {
  agents: Agent[];
  selectedId?: string;
  onChange: (agentId: string | undefined) => void;
  className?: string;
}

export const AgentDropdown: React.FC<AgentDropdownProps> = ({
  agents,
  selectedId,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === selectedId), 
  [agents, selectedId]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(query) || 
      agent.config?.model?.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  const handleSelect = (agentId: string | undefined) => {
    onChange(agentId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`agent-dropdown-container ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`agent-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedAgent ? (
          <div className="selected-agent-display">
            <span className="agent-icon">🤖</span>
            <div className="agent-info-compact">
              <span className="agent-name">{selectedAgent.name}</span>
              <span className="agent-model">
                {selectedAgent.config?.model || 'default'} • T:{selectedAgent.config?.temperature ?? 0.7}
              </span>
            </div>
          </div>
        ) : (
          <div className="selected-agent-placeholder">
            <span className="agent-icon-placeholder">⊘</span>
            <span>Select an agent...</span>
          </div>
        )}
        <span className="dropdown-chevron">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="agent-dropdown-menu animate-in">
          {/* Search */}
          <div className="agent-search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="agent-search-input"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* List */}
          <div className="agent-list-scroll">
            {/* None Option */}
            <button
              type="button"
              className={`agent-item ${!selectedId ? 'selected' : ''}`}
              onClick={() => handleSelect(undefined)}
            >
              <span className="agent-icon">⊘</span>
              <div className="agent-info">
                <span className="agent-name">None</span>
                <span className="agent-desc">No agent assigned</span>
              </div>
              {!selectedId && <span className="check-icon">✓</span>}
            </button>

            {/* Agents */}
            {filteredAgents.map(agent => (
              <button
                key={agent.id}
                type="button"
                className={`agent-item ${selectedId === agent.id ? 'selected' : ''}`}
                onClick={() => handleSelect(agent.id)}
              >
                <span className="agent-icon">🤖</span>
                <div className="agent-info">
                  <span className="agent-name">{agent.name}</span>
                  <span className="agent-meta">
                    {agent.config?.model || 'Default Model'} • Temp: {agent.config?.temperature ?? 0.7}
                  </span>
                  {agent.description && (
                    <span className="agent-desc">{agent.description}</span>
                  )}
                </div>
                {selectedId === agent.id && <span className="check-icon">✓</span>}
              </button>
            ))}

            {filteredAgents.length === 0 && (
              <div className="no-results">
                No agents found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Backdrop to close */}
      {isOpen && (
        <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
