"use client";

/**
 * BLGU Dashboard Page - Epic 2.0: Completion Tracking
 *
 * This dashboard shows COMPLETION status only (complete/incomplete).
 * COMPLIANCE status (PASS/FAIL/CONDITIONAL) is NEVER exposed to BLGU users.
 *
 * Features:
 * - Completion metrics (total, completed, incomplete, percentage)
 * - Governance areas with indicator completion status
 * - Assessor rework comments (if assessment needs rework)
 * - Indicator navigation for quick access to incomplete items
 */

import {
  CompletionMetricsCard,
  IndicatorNavigationList,
  AssessorCommentsPanel,
} from "@/components/features/dashboard";
import { useGetBlguDashboardAssessmentId } from "@vantage/shared";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, AlertCircle } from "lucide-react";

export default function BLGUDashboardPage() {
  const { user } = useAuthStore();

  // For now, we'll use a placeholder assessment ID
  // TODO: Get actual assessment ID from user context or route params
  const assessmentId = 1;

  // Fetch dashboard data using generated hook
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useGetBlguDashboardAssessmentId(assessmentId);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--cityscape-yellow)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Unable to load dashboard data. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[var(--cityscape-yellow)] text-white rounded-lg hover:bg-[var(--cityscape-yellow-dark)] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Assessment Dashboard
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Track your assessment completion progress
          </p>
        </div>

        {/* Completion Metrics Section */}
        <div className="mb-8">
          <CompletionMetricsCard
            totalIndicators={dashboardData.total_indicators}
            completedIndicators={dashboardData.completed_indicators}
            incompleteIndicators={dashboardData.incomplete_indicators}
            completionPercentage={dashboardData.completion_percentage}
          />
        </div>

        {/* Assessor Comments Section (only if there are rework comments) */}
        {dashboardData.rework_comments && (
          <div className="mb-8">
            <AssessorCommentsPanel comments={dashboardData.rework_comments} />
          </div>
        )}

        {/* Indicator Navigation Section */}
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
            Indicators by Governance Area
          </h2>
          <IndicatorNavigationList
            items={dashboardData.governance_areas.flatMap((area) =>
              area.indicators.map((indicator) => ({
                indicator_id: indicator.indicator_id,
                title: indicator.indicator_name,
                completion_status: indicator.is_complete
                  ? ("complete" as const)
                  : ("incomplete" as const),
                route_path: `/blgu/assessment/${assessmentId}/indicator/${indicator.indicator_id}`,
                governance_area_name: area.governance_area_name,
                governance_area_id: area.governance_area_id,
              }))
            )}
          />
        </div>
      </div>
    </div>
  );
}
