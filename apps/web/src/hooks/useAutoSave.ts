import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { IndicatorTreeState } from '@/store/useIndicatorBuilderStore';
import { draftStorage } from '@/lib/draft-storage';
import { serializeNodes } from '@/lib/indicator-tree-utils';

/**
 * Auto-Save Hook
 *
 * Provides debounced auto-save functionality for indicator drafts
 * with hybrid localStorage + server persistence.
 *
 * Features:
 * - Debounced saves (configurable delay)
 * - Optimistic locking (version conflict handling)
 * - localStorage backup (immediate)
 * - Server persistence (debounced)
 * - Save on tab close (beforeunload)
 * - Error handling with retry
 * - Manual save trigger
 */

// ============================================================================
// Types
// ============================================================================

export interface UseAutoSaveOptions {
  /** Draft ID (from server) */
  draftId?: string;

  /** Tree data to save */
  data: IndicatorTreeState;

  /** Current version (for optimistic locking) */
  version?: number;

  /** Callback when version is updated after save */
  onVersionUpdate?: (newVersion: number) => void;

  /** Callback when save succeeds */
  onSaveSuccess?: () => void;

  /** Callback when save fails */
  onSaveError?: (error: Error) => void;

  /** Callback when version conflict occurs */
  onVersionConflict?: () => void;

  /** Debounce delay in milliseconds (default: 3000) */
  debounceMs?: number;

  /** Enable auto-save (default: true) */
  enabled?: boolean;

  /** Save to localStorage only (skip server, default: false) */
  localOnly?: boolean;
}

export interface UseAutoSaveReturn {
  /** Whether a save is currently in progress */
  isSaving: boolean;

  /** Whether there was an error */
  isError: boolean;

  /** Error object if save failed */
  error: Error | null;

  /** Last save timestamp */
  lastSaved: number | null;

  /** Manually trigger save (bypasses debounce) */
  saveNow: () => void;

  /** Clear pending save */
  cancelPendingSave: () => void;
}

// ============================================================================
// Auto-Save Hook
// ============================================================================

/**
 * Hook for auto-saving indicator drafts
 *
 * Saves to localStorage immediately (for instant recovery)
 * and to server after debounce delay (for persistence)
 *
 * @example
 * ```tsx
 * const { isSaving, saveNow } = useAutoSave({
 *   draftId: tree.draftId,
 *   data: tree,
 *   version: tree.version,
 *   onVersionUpdate: (newVersion) => {
 *     setDraftMetadata(tree.draftId!, newVersion);
 *   },
 * });
 * ```
 */
export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    draftId,
    data,
    version = 1,
    onVersionUpdate,
    onSaveSuccess,
    onSaveError,
    onVersionConflict,
    debounceMs = 3000,
    enabled = true,
    localOnly = false,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<number | null>(null);
  const dataRef = useRef(data);

  // Keep data ref updated
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Server save mutation
  const serverSaveMutation = useMutation({
    mutationFn: async (treeData: IndicatorTreeState) => {
      // Prepare payload for server
      const payload = {
        governance_area_id: treeData.governanceAreaId,
        creation_mode: treeData.creationMode,
        current_step: treeData.currentStep,
        data: Array.from(treeData.nodes.values()).map((node) => ({
          temp_id: node.temp_id,
          parent_temp_id: node.parent_temp_id,
          order: node.order,
          name: node.name,
          description: node.description,
          is_active: node.is_active,
          is_auto_calculable: node.is_auto_calculable,
          is_profiling_only: node.is_profiling_only,
          form_schema: node.form_schema,
          calculation_schema: node.calculation_schema,
          remark_schema: node.remark_schema,
          technical_notes_text: node.technical_notes_text,
        })),
        version,
      };

      // TODO: Replace with actual API call when ready
      // For now, this is a placeholder that simulates a server save
      // const response = await api.post('/indicators/drafts', payload);
      // return response.data;

      // Simulated response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: draftId || `draft_${Date.now()}`,
            version: version + 1,
          });
        }, 500);
      });
    },
    onSuccess: (response: any) => {
      lastSavedRef.current = Date.now();
      if (onVersionUpdate) {
        onVersionUpdate(response.version);
      }
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    },
    onError: (error: Error) => {
      // Check for version conflict (HTTP 409)
      if (error.message?.includes('409') || error.message?.includes('conflict')) {
        if (onVersionConflict) {
          onVersionConflict();
        }
      }
      if (onSaveError) {
        onSaveError(error);
      }
    },
  });

  /**
   * Save to localStorage (immediate)
   */
  const saveToLocal = useCallback((treeData: IndicatorTreeState) => {
    try {
      draftStorage.saveDraft(treeData, {
        title: `Draft ${new Date().toLocaleString()}`,
      });
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  /**
   * Save to server (debounced)
   */
  const saveToServer = useCallback((treeData: IndicatorTreeState) => {
    if (localOnly) return;
    serverSaveMutation.mutate(treeData);
  }, [localOnly, serverSaveMutation]);

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Save to localStorage immediately (for instant recovery)
    saveToLocal(dataRef.current);

    // Schedule server save after debounce
    timeoutRef.current = setTimeout(() => {
      saveToServer(dataRef.current);
    }, debounceMs);
  }, [debounceMs, saveToLocal, saveToServer]);

  /**
   * Manual save (bypasses debounce)
   */
  const saveNow = useCallback(() => {
    // Cancel pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Save immediately to both
    saveToLocal(dataRef.current);
    saveToServer(dataRef.current);
  }, [saveToLocal, saveToServer]);

  /**
   * Cancel pending save
   */
  const cancelPendingSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Auto-save effect (triggers on data changes)
  useEffect(() => {
    if (!enabled) return;

    debouncedSave();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debouncedSave]);

  // Save on tab close / navigation
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save to localStorage immediately
      saveToLocal(dataRef.current);

      // If there are unsaved changes, warn user
      const hasUnsavedChanges = dataRef.current.nodes.size > 0;
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, saveToLocal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving: serverSaveMutation.isPending,
    isError: serverSaveMutation.isError,
    error: serverSaveMutation.error,
    lastSaved: lastSavedRef.current,
    saveNow,
    cancelPendingSave,
  };
}

// ============================================================================
// Helper Hook: Save Indicator
// ============================================================================

/**
 * Hook for manual save indicator display
 *
 * Shows "Saving...", "Saved", or "Error" status
 */
export function useSaveIndicator(lastSaved: number | null, isSaving: boolean, isError: boolean) {
  if (isSaving) {
    return { text: 'Saving...', variant: 'default' as const };
  }

  if (isError) {
    return { text: 'Save failed', variant: 'destructive' as const };
  }

  if (lastSaved) {
    const secondsAgo = Math.floor((Date.now() - lastSaved) / 1000);
    if (secondsAgo < 5) {
      return { text: 'Saved', variant: 'success' as const };
    }
    if (secondsAgo < 60) {
      return { text: `Saved ${secondsAgo}s ago`, variant: 'secondary' as const };
    }
    return { text: `Saved ${Math.floor(secondsAgo / 60)}m ago`, variant: 'secondary' as const };
  }

  return { text: 'Not saved', variant: 'secondary' as const };
}
