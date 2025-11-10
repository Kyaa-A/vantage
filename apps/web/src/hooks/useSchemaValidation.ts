/**
 * 🔍 useSchemaValidation Hook
 *
 * Integrates real-time schema validation with the UI.
 * Runs validation on every schema change (debounced 500ms).
 *
 * Features:
 * - Automatic validation on schema updates
 * - Debounced to avoid performance issues
 * - Updates Zustand store with validation errors
 * - Provides validation status and error counts
 *
 * @module useSchemaValidation
 */

import { useEffect, useRef, useCallback } from 'react';
import { useIndicatorBuilderStore } from '@/store/useIndicatorBuilderStore';

/**
 * Options for schema validation hook
 */
export interface UseSchemaValidationOptions {
  /** Indicator ID to validate */
  indicatorId: string | null;

  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number;

  /** Enable automatic validation (default: true) */
  enabled?: boolean;

  /** Callback when validation completes */
  onValidationComplete?: (isValid: boolean, errorCount: number) => void;
}

/**
 * Hook to integrate real-time schema validation with UI
 *
 * @param options - Validation options
 * @returns Validation status and methods
 *
 * @example
 * ```typescript
 * const { errors, errorCount, warningCount, isValid, validateNow } = useSchemaValidation({
 *   indicatorId: currentIndicatorId,
 *   debounceMs: 500,
 *   onValidationComplete: (isValid, errorCount) => {
 *     if (!isValid) {
 *       console.log(`Validation failed with ${errorCount} errors`);
 *     }
 *   },
 * });
 * ```
 */
export function useSchemaValidation(options: UseSchemaValidationOptions) {
  const {
    indicatorId,
    debounceMs = 500,
    enabled = true,
    onValidationComplete,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevIndicatorRef = useRef(indicatorId);

  // Get store actions and state
  const validateIndicatorSchemas = useIndicatorBuilderStore(
    state => state.validateIndicatorSchemas
  );
  const getValidationErrors = useIndicatorBuilderStore(
    state => state.getValidationErrors
  );
  const getNodeById = useIndicatorBuilderStore(state => state.getNodeById);
  const schemaStatus = useIndicatorBuilderStore(state => state.schemaStatus);

  // Get current indicator and validation errors
  const indicator = indicatorId ? getNodeById(indicatorId) : undefined;
  const errors = indicatorId ? getValidationErrors(indicatorId) : [];
  const status = indicatorId ? schemaStatus.get(indicatorId) : undefined;

  /**
   * Run validation immediately (bypasses debounce)
   */
  const validateNow = useCallback(() => {
    if (!indicatorId || !enabled) return;

    // Clear pending debounced validation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Run validation
    validateIndicatorSchemas(indicatorId);

    // Get updated validation results
    const updatedErrors = getValidationErrors(indicatorId);
    const errorCount = updatedErrors.filter(e => e.severity === 'error').length;
    const isValid = errorCount === 0;

    // Trigger callback
    if (onValidationComplete) {
      onValidationComplete(isValid, errorCount);
    }
  }, [indicatorId, enabled, validateIndicatorSchemas, getValidationErrors, onValidationComplete]);

  /**
   * Run debounced validation
   */
  const debouncedValidate = useCallback(() => {
    if (!indicatorId || !enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule validation after debounce delay
    timeoutRef.current = setTimeout(() => {
      validateNow();
      timeoutRef.current = null;
    }, debounceMs);
  }, [indicatorId, enabled, debounceMs, validateNow]);

  /**
   * Effect: Validate when indicator or schemas change
   */
  useEffect(() => {
    if (!enabled || !indicatorId || !indicator) return;

    // If indicator changed, validate immediately (no debounce)
    if (prevIndicatorRef.current !== indicatorId) {
      prevIndicatorRef.current = indicatorId;
      validateNow();
      return;
    }

    // Otherwise, debounce validation
    debouncedValidate();

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    enabled,
    indicatorId,
    indicator?.form_schema,
    indicator?.calculation_schema,
    indicator?.remark_schema,
    debouncedValidate,
    validateNow,
  ]);

  /**
   * Effect: Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculate error and warning counts
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const isValid = errorCount === 0;

  return {
    /** Validation errors */
    errors,

    /** Number of error-level issues */
    errorCount,

    /** Number of warning-level issues */
    warningCount,

    /** Whether indicator has no errors (warnings OK) */
    isValid,

    /** Schema completion status */
    formComplete: status?.formComplete ?? false,
    calculationComplete: status?.calculationComplete ?? false,
    remarkComplete: status?.remarkComplete ?? false,
    isComplete: status?.isComplete ?? false,

    /** Manually trigger validation (bypasses debounce) */
    validateNow,

    /** Run debounced validation */
    debouncedValidate,
  };
}

/**
 * Hook to validate schema on change (simpler version)
 *
 * Automatically validates when schemas change, no manual triggering needed.
 *
 * @param indicatorId - ID of indicator to validate
 * @param debounceMs - Debounce delay (default: 500ms)
 *
 * @example
 * ```typescript
 * // Simple usage: just validate on change
 * useSchemaValidation({ indicatorId: currentIndicatorId });
 * ```
 */
export function useAutoSchemaValidation(indicatorId: string | null, debounceMs = 500) {
  return useSchemaValidation({ indicatorId, debounceMs, enabled: true });
}
