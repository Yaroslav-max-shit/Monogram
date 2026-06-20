import { useEffect, useCallback } from 'react';

interface KeyboardNavOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  enabled?: boolean;
}

export function useKeyboardNav({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  enabled = true,
}: KeyboardNavOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onEscape?.();
          break;
        case 'Enter':
          if (!isInput) {
            e.preventDefault();
            onEnter?.();
          }
          break;
        case 'ArrowUp':
          if (!isInput) {
            e.preventDefault();
            onArrowUp?.();
          }
          break;
        case 'ArrowDown':
          if (!isInput) {
            e.preventDefault();
            onArrowDown?.();
          }
          break;
      }
    },
    [enabled, onEscape, onEnter, onArrowUp, onArrowDown]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
