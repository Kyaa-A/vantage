'use client';

import { useEffect, useCallback } from 'react';
import { useIndicatorBuilderStore } from '@/store/useIndicatorBuilderStore';

/**
 * useSchemaNavigation Hook
 *
 * Provides keyboard shortcuts and navigation helpers for the schema editor.
 * Integrates with the IndicatorBuilderStore to enable efficient navigation
 * between indicators during schema configuration.
 *
 * Features:
 * - Arrow Up/Down: Navigate to previous/next indicator
 * - Enter: Focus on schema editor (closes mobile drawer)
 * - Escape: Unfocus schema editor / return to tree view
 * - Ctrl/Cmd + S: Save current indicator (triggers auto-save)
 * - Ctrl/Cmd + N: Navigate to next incomplete indicator
 *
 * @param options - Configuration options
 * @returns Navigation helpers and current state
 *
 * @example
 * ```typescript
 * function SchemaEditor() {
 *   const { goToNext, goToPrevious, goToNextIncomplete } = useSchemaNavigation({
 *     enabled: true,
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={goToPrevious}>Previous</button>
 *       <button onClick={goToNext}>Next</button>
 *     </div>
 *   );
 * }
 * ```
 */

export interface UseSchemaNavigationOptions {
  /** Enable keyboard shortcuts (default: true) */
  enabled?: boolean;

  /** Callback when indicator changes */
  onNavigate?: (indicatorId: string) => void;

  /** Callback when save is triggered */
  onSave?: () => void;
}

export interface UseSchemaNavigationReturn {
  /** Current indicator ID */
  currentIndicatorId: string | null;

  /** Navigate to next indicator in tree order */
  goToNext: () => void;

  /** Navigate to previous indicator in tree order */
  goToPrevious: () => void;

  /** Navigate to next incomplete indicator */
  goToNextIncomplete: () => void;

  /** Navigate to specific indicator by ID */
  navigateTo: (indicatorId: string) => void;

  /** Check if there's a next indicator */
  hasNext: boolean;

  /** Check if there's a previous indicator */
  hasPrevious: boolean;

  /** Check if there's a next incomplete indicator */
  hasNextIncomplete: boolean;
}

export function useSchemaNavigation(
  options: UseSchemaNavigationOptions = {}
): UseSchemaNavigationReturn {
  const { enabled = true, onNavigate, onSave } = options;

  const currentSchemaIndicatorId = useIndicatorBuilderStore(
    state => state.currentSchemaIndicatorId
  );
  const navigateToIndicator = useIndicatorBuilderStore(
    state => state.navigateToIndicator
  );
  const getAdjacentIndicator = useIndicatorBuilderStore(
    state => state.getAdjacentIndicator
  );
  const getAllNodes = useIndicatorBuilderStore(state => state.getAllNodes);
  const schemaStatus = useIndicatorBuilderStore(state => state.schemaStatus);
  const markSchemaDirty = useIndicatorBuilderStore(state => state.markSchemaDirty);

  const allNodes = getAllNodes();

  // Get next/previous indicators
  const nextIndicatorId = currentSchemaIndicatorId
    ? getAdjacentIndicator(currentSchemaIndicatorId, 'next')
    : null;
  const previousIndicatorId = currentSchemaIndicatorId
    ? getAdjacentIndicator(currentSchemaIndicatorId, 'previous')
    : null;

  // Find next incomplete indicator
  const nextIncompleteId = allNodes.find(node => {
    const status = schemaStatus.get(node.temp_id);
    return !status?.isComplete;
  })?.temp_id || null;

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (nextIndicatorId) {
      navigateToIndicator(nextIndicatorId);
      onNavigate?.(nextIndicatorId);
    }
  }, [nextIndicatorId, navigateToIndicator, onNavigate]);

  const goToPrevious = useCallback(() => {
    if (previousIndicatorId) {
      navigateToIndicator(previousIndicatorId);
      onNavigate?.(previousIndicatorId);
    }
  }, [previousIndicatorId, navigateToIndicator, onNavigate]);

  const goToNextIncomplete = useCallback(() => {
    if (nextIncompleteId) {
      navigateToIndicator(nextIncompleteId);
      onNavigate?.(nextIncompleteId);
    }
  }, [nextIncompleteId, navigateToIndicator, onNavigate]);

  const navigateTo = useCallback(
    (indicatorId: string) => {
      navigateToIndicator(indicatorId);
      onNavigate?.(indicatorId);
    },
    [navigateToIndicator, onNavigate]
  );

  // Handle save action
  const handleSave = useCallback(() => {
    if (currentSchemaIndicatorId) {
      markSchemaDirty(currentSchemaIndicatorId);
      onSave?.();
    }
  }, [currentSchemaIndicatorId, markSchemaDirty, onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input/textarea/contenteditable
      const target = event.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Don't interfere with form inputs (except for Escape and Ctrl/Cmd shortcuts)
      const isModifierKey = event.ctrlKey || event.metaKey;
      if (isEditing && !isModifierKey && event.key !== 'Escape') {
        return;
      }

      // Arrow Up: Previous indicator (when not editing)
      if (event.key === 'ArrowUp' && !isEditing) {
        event.preventDefault();
        goToPrevious();
        return;
      }

      // Arrow Down: Next indicator (when not editing)
      if (event.key === 'ArrowDown' && !isEditing) {
        event.preventDefault();
        goToNext();
        return;
      }

      // Escape: Blur current element (unfocus from editor)
      if (event.key === 'Escape') {
        event.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        return;
      }

      // Ctrl/Cmd + S: Save
      if (isModifierKey && event.key === 's') {
        event.preventDefault();
        handleSave();
        return;
      }

      // Ctrl/Cmd + N: Next incomplete
      if (isModifierKey && event.key === 'n') {
        event.preventDefault();
        goToNextIncomplete();
        return;
      }

      // Alt + Arrow Left: Previous indicator (alternative for accessibility)
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
        return;
      }

      // Alt + Arrow Right: Next indicator (alternative for accessibility)
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, goToNext, goToPrevious, goToNextIncomplete, handleSave]);

  return {
    currentIndicatorId: currentSchemaIndicatorId,
    goToNext,
    goToPrevious,
    goToNextIncomplete,
    navigateTo,
    hasNext: !!nextIndicatorId,
    hasPrevious: !!previousIndicatorId,
    hasNextIncomplete: !!nextIncompleteId,
  };
}
