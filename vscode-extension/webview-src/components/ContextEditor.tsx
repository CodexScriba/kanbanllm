import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from './ui/Button';

interface ContextEditorProps {
  content: string;
  language?: string;
  onSave: (content: string) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export const ContextEditor: React.FC<ContextEditorProps> = ({
  content,
  language = 'markdown',
  onSave,
  onClose,
  isSaving = false
}) => {
  const [value, setValue] = useState(content);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setValue(content);
    setIsDirty(false);
  }, [content]);

  const handleSave = () => {
    onSave(value);
    setIsDirty(false);
  };

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex-1 border-b border-white/10">
        <Editor
          height="100%"
          defaultLanguage={language}
          value={value}
          theme="vs-dark"
          onChange={(val: string | undefined) => {
            setValue(val || '');
            setIsDirty(true);
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
      
      <div className="flex items-center justify-end gap-3 p-4 bg-surface/50">
        <span className="text-xs text-text-muted mr-auto">
          {isDirty ? '● Unsaved changes' : 'All changes saved'}
        </span>
        
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        
        <Button 
          onClick={handleSave} 
          disabled={!isDirty || isSaving}
          isLoading={isSaving}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};
