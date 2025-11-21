import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ContextSelector } from './ContextSelector';
import { AgentDropdown } from './AgentDropdown';
import { TagEditor } from './TagEditor';
import { Stage, Agent, ContextMetadata } from '../types';

export interface TaskFormData {
  title: string;
  type: 'task' | 'phase';
  stage: Stage;
  phaseId?: string;
  agent?: string;
  contexts: string[];
  tags: string[];
  template?: string;
  initialContent?: string;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  defaultStage?: Stage;
  agents: Agent[];
  contexts: ContextMetadata[];
  phases: Array<{ id: string; title: string }>;
  allTags?: string[]; // For tag autocomplete
}

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultStage = 'queue',
  agents,
  contexts,
  phases,
  allTags = [],
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    type: 'task',
    stage: defaultStage,
    phaseId: undefined,
    agent: undefined,
    contexts: [],
    tags: [],
    template: undefined,
    initialContent: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        type: 'task',
        stage: defaultStage,
        phaseId: undefined,
        agent: undefined,
        contexts: [],
        tags: [],
        template: undefined,
        initialContent: '',
      });
      setErrors({});
    }
  }, [isOpen, defaultStage]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to create item:', error);
      setErrors({ submit: 'Failed to create item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleContext = (contextId: string) => {
    setFormData(prev => ({
      ...prev,
      contexts: prev.contexts.includes(contextId)
        ? prev.contexts.filter(id => id !== contextId)
        : [...prev.contexts, contextId],
    }));
  };

  // Group contexts by type
  const groupedContexts = contexts.reduce((acc, context) => {
    if (!acc[context.type]) {
      acc[context.type] = [];
    }
    acc[context.type].push(context);
    return acc;
  }, {} as Record<string, ContextMetadata[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Item">
      <form onSubmit={handleSubmit} className="task-form">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            type="text"
            className={`form-input ${errors.title ? 'error' : ''}`}
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter task title..."
            autoFocus
          />
          {errors.title && <span className="form-error">{errors.title}</span>}
        </div>

        {/* Type */}
        <div className="form-group">
          <label className="form-label">
            Type <span className="text-destructive">*</span>
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="type"
                value="task"
                checked={formData.type === 'task'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'task' | 'phase' }))}
              />
              <span>Task</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="type"
                value="phase"
                checked={formData.type === 'phase'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'task' | 'phase' }))}
              />
              <span>Phase</span>
            </label>
          </div>
        </div>

        {/* Stage */}
        <div className="form-group">
          <label htmlFor="stage" className="form-label">
            Stage <span className="text-destructive">*</span>
          </label>
          <select
            id="stage"
            className="form-select"
            value={formData.stage}
            onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value as Stage }))}
          >
            <option value="chat">Chat</option>
            <option value="queue">Queue</option>
            <option value="plan">Plan</option>
            <option value="code">Code</option>
            <option value="audit">Audit</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Phase (only for tasks) */}
        {formData.type === 'task' && (
          <div className="form-group">
            <label htmlFor="phase" className="form-label">
              Phase
            </label>
            <select
              id="phase"
              className="form-select"
              value={formData.phaseId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phaseId: e.target.value || undefined }))}
            >
              <option value="">No Phase</option>
              {phases.map(phase => (
                <option key={phase.id} value={phase.id}>
                  {phase.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Agent */}
        <div className="form-group">
          <label className="form-label">
            Agent
          </label>
          <AgentDropdown
            agents={agents}
            selectedId={formData.agent}
            onChange={(agentId) => setFormData(prev => ({ ...prev, agent: agentId }))}
          />
        </div>

        {/* Contexts */}
        <div className="form-group">
          <label className="form-label">
            Contexts
          </label>
          <ContextSelector
            contexts={contexts}
            selectedIds={formData.contexts}
            onChange={(newIds) => setFormData(prev => ({ ...prev, contexts: newIds }))}
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label">
            Tags
          </label>
          <TagEditor
            tags={formData.tags}
            onChange={(newTags) => setFormData(prev => ({ ...prev, tags: newTags }))}
            allTags={allTags}
            placeholder="Add tag..."
          />
        </div>

        {/* Initial Content */}
        <div className="form-group">
          <label htmlFor="content" className="form-label">
            Initial Content (optional)
          </label>
          <textarea
            id="content"
            className="form-textarea"
            value={formData.initialContent}
            onChange={(e) => setFormData(prev => ({ ...prev, initialContent: e.target.value }))}
            placeholder="Enter initial content..."
            rows={4}
          />
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="form-error-banner">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-sm" />
                Creating...
              </>
            ) : (
              `Create ${formData.type === 'task' ? 'Task' : 'Phase'}`
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
