// Custom hooks for indicator management
// Wraps generated React Query hooks with convenience methods

import {
  useGetIndicatorsIndicators,
  useGetIndicatorsIndicatorsIndicatorId,
  usePostIndicatorsIndicators,
  usePutIndicatorsIndicatorsIndicatorId,
  useDeleteIndicatorsIndicatorsIndicatorId,
  useGetIndicatorsIndicatorsIndicatorIdHistory,
  type GetIndicatorsIndicatorsParams,
  type IndicatorCreate,
  type IndicatorUpdate,
} from '@vantage/shared';

/**
 * Hook to fetch list of indicators with optional filters
 */
export function useIndicators(params?: GetIndicatorsIndicatorsParams) {
  return useGetIndicatorsIndicators(params);
}

/**
 * Hook to fetch a single indicator by ID
 */
export function useIndicator(indicatorId: number) {
  return useGetIndicatorsIndicatorsIndicatorId(indicatorId);
}

/**
 * Hook to create a new indicator
 */
export function useCreateIndicatorMutation() {
  return usePostIndicatorsIndicators();
}

/**
 * Hook to update an existing indicator
 */
export function useUpdateIndicatorMutation() {
  return usePutIndicatorsIndicatorsIndicatorId();
}

/**
 * Hook to deactivate (soft delete) an indicator
 */
export function useDeleteIndicatorMutation() {
  return useDeleteIndicatorsIndicatorsIndicatorId();
}

/**
 * Hook to fetch indicator version history
 */
export function useIndicatorHistory(indicatorId: number) {
  return useGetIndicatorsIndicatorsIndicatorIdHistory(indicatorId);
}
