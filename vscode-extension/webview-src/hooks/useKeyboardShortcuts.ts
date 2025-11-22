import { useEffect, useState } from 'react';
import { Stage } from '../types';

interface KeyboardShortcutsConfig {
  onCreateTask: () => void;
  onEditCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenCard: (cardId: string) => void;
  onFocusSearch: () => void;
  onClearSelection: () => void;
  selectedCardId: string | null;
  setSelectedCardId: (cardId: string | null) => void;
  allCardIds: string[];
}

export const useKeyboardShortcuts = ({
  onCreateTask,
  onEditCard,
  onDeleteCard,
  onOpenCard,
  onFocusSearch,
  onClearSelection,
  selectedCardId,
  setSelectedCardId,
  allCardIds,
}: KeyboardShortcutsConfig) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to clear focus
        if (e.key === 'Escape') {
          target.blur();
          onClearSelection();
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Shift + N - Create new task (already implemented in App.tsx)
      if (modifier && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        onCreateTask();
        return;
      }

      // Ctrl/Cmd + E - Edit selected card
      if (modifier && e.key === 'e') {
        e.preventDefault();
        if (selectedCardId) {
          onEditCard(selectedCardId);
        }
        return;
      }

      // Ctrl/Cmd + F - Focus search
      if (modifier && e.key === 'f') {
        e.preventDefault();
        onFocusSearch();
        return;
      }

      // Delete - Delete selected card
      if (e.key === 'Delete' && selectedCardId) {
        e.preventDefault();
        onDeleteCard(selectedCardId);
        return;
      }

      // Enter - Open selected card in editor
      if (e.key === 'Enter' && selectedCardId) {
        e.preventDefault();
        onOpenCard(selectedCardId);
        return;
      }

      // Escape - Clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        onClearSelection();
        return;
      }

      // Arrow keys - Navigate between cards
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        navigateCards(e.key);
        return;
      }
    };

    const navigateCards = (key: string) => {
      if (allCardIds.length === 0) return;

      if (!selectedCardId) {
        // No selection, select first card
        setSelectedCardId(allCardIds[0]);
        return;
      }

      const currentIndex = allCardIds.indexOf(selectedCardId);
      if (currentIndex === -1) {
        setSelectedCardId(allCardIds[0]);
        return;
      }

      let newIndex = currentIndex;

      switch (key) {
        case 'ArrowDown':
        case 'ArrowRight':
          newIndex = Math.min(currentIndex + 1, allCardIds.length - 1);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          newIndex = Math.max(currentIndex - 1, 0);
          break;
      }

      if (newIndex !== currentIndex) {
        setSelectedCardId(allCardIds[newIndex]);
        // Scroll card into view
        setTimeout(() => {
          const cardElement = document.querySelector(`[data-card-id="${allCardIds[newIndex]}"]`);
          cardElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedCardId,
    allCardIds,
    onCreateTask,
    onEditCard,
    onDeleteCard,
    onOpenCard,
    onFocusSearch,
    onClearSelection,
    setSelectedCardId,
  ]);

  return { selectedCardId };
};
