/**
 * 📋 useSchemaCopyPaste Hook
 *
 * Provides copy/paste functionality for indicator schemas with keyboard shortcuts.
 *
 * Features:
 * - Copy schema (Ctrl/Cmd+Shift+C)
 * - Paste schema (Ctrl/Cmd+Shift+V)
 * - Toast notifications for user feedback
 * - Type-safe schema copying (can't paste form schema into calculation tab)
 *
 * @module useSchemaCopyPaste
 */

import { useEffect, useCallback } from 'react';
import { useIndicatorBuilderStore } from '@/store/useIndicatorBuilderStore';
import { toast } from 'sonner';

/**
 * Options for schema copy/paste hook
 */
export interface UseSchemaCopyPasteOptions {
  /** Current indicator ID */
  indicatorId: string | null;

  /** Current active tab */
  activeTab: 'form' | 'calculation' | 'remark';

  /** Enable keyboard shortcuts (default: true) */
  enableKeyboardShortcuts?: boolean;

  /** Custom keyboard bindings */
  copyKey?: string;
  pasteKey?: string;
}

/**
 * Hook for schema copy/paste functionality with keyboard shortcuts
 *
 * @param options - Copy/paste options
 * @returns Copy/paste methods and state
 *
 * @example
 * ```typescript
 * const { copy, paste, canPaste, copiedFrom } = useSchemaCopyPaste({
 *   indicatorId: currentIndicatorId,
 *   activeTab: 'form',
 * });
 * ```
 */
export function useSchemaCopyPaste(options: UseSchemaCopyPasteOptions) {
  const {
    indicatorId,
    activeTab,
    enableKeyboardShortcuts = true,
    copyKey = 'C',
    pasteKey = 'V',
  } = options;

  // Get store actions
  const copySchema = useIndicatorBuilderStore(state => state.copySchema);
  const pasteSchema = useIndicatorBuilderStore(state => state.pasteSchema);
  const hasCopiedSchema = useIndicatorBuilderStore(state => state.hasCopiedSchema);
  const copiedSchema = useIndicatorBuilderStore(state => state.copiedSchema);
  const getNodeById = useIndicatorBuilderStore(state => state.getNodeById);

  /**
   * Copy current schema to clipboard
   */
  const copy = useCallback(() => {
    if (!indicatorId) {
      toast.error('No indicator selected');
      return;
    }

    const indicator = getNodeById(indicatorId);
    if (!indicator) {
      toast.error('Indicator not found');
      return;
    }

    // Check if schema exists
    let hasSchema = false;
    switch (activeTab) {
      case 'form':
        hasSchema = !!indicator.form_schema;
        break;
      case 'calculation':
        hasSchema = !!indicator.calculation_schema;
        break;
      case 'remark':
        hasSchema = !!indicator.remark_schema;
        break;
    }

    if (!hasSchema) {
      toast.error(`No ${activeTab} schema to copy`);
      return;
    }

    // Copy schema
    copySchema(indicatorId, activeTab);

    // Show success toast
    toast.success(`Copied ${activeTab} schema from ${indicator.code || 'indicator'}`, {
      description: 'Press Ctrl+Shift+V to paste',
      duration: 3000,
    });
  }, [indicatorId, activeTab, copySchema, getNodeById]);

  /**
   * Paste copied schema to current indicator
   */
  const paste = useCallback(() => {
    if (!indicatorId) {
      toast.error('No indicator selected');
      return;
    }

    if (!hasCopiedSchema(activeTab)) {
      if (copiedSchema) {
        toast.error(
          `Cannot paste ${copiedSchema.type} schema into ${activeTab} tab`,
          {
            description: `Switch to ${copiedSchema.type} tab to paste`,
          }
        );
      } else {
        toast.error('No schema copied', {
          description: 'Copy a schema first (Ctrl+Shift+C)',
        });
      }
      return;
    }

    const indicator = getNodeById(indicatorId);
    if (!indicator) {
      toast.error('Indicator not found');
      return;
    }

    // Paste schema
    const success = pasteSchema(indicatorId, activeTab);

    if (success) {
      const sourceCode = copiedSchema?.sourceIndicatorCode || 'another indicator';
      toast.success(`Pasted ${activeTab} schema from ${sourceCode}`, {
        description: `Applied to ${indicator.code || 'current indicator'}`,
        duration: 3000,
      });
    } else {
      toast.error(`Failed to paste ${activeTab} schema`);
    }
  }, [indicatorId, activeTab, hasCopiedSchema, pasteSchema, copiedSchema, getNodeById]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Skip if user is typing (but allow in contentEditable for rich text editor)
      if (isInput && target.tagName !== 'DIV') {
        return;
      }

      // Ctrl/Cmd + Shift + C: Copy
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === copyKey) {
        e.preventDefault();
        copy();
      }

      // Ctrl/Cmd + Shift + V: Paste
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === pasteKey) {
        e.preventDefault();
        paste();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardShortcuts, copyKey, pasteKey, copy, paste]);

  // Check if we can paste in current tab
  const canPaste = hasCopiedSchema(activeTab);

  // Get source indicator info
  const copiedFrom = copiedSchema
    ? `${copiedSchema.sourceIndicatorCode || copiedSchema.sourceIndicatorId} (${copiedSchema.type})`
    : null;

  return {
    /** Copy current schema */
    copy,

    /** Paste copied schema */
    paste,

    /** Whether there's a copied schema that matches current tab */
    canPaste,

    /** Source indicator of copied schema */
    copiedFrom,

    /** Copied schema info (or null) */
    copiedSchema,

    /** Whether any schema is copied */
    hasCopied: !!copiedSchema,
  };
}
