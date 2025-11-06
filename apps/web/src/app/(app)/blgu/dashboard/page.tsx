"use client";

import {
  DashboardSkeleton,
  FeedbackSection,
  GovernanceAreasGrid,
  StatusCard,
} from "@/components/features/dashboard";
import { useDashboard } from "@/hooks/useDashboard";
import { useUserBarangay } from "@/hooks/useUserBarangay";
import { useAuthStore } from "@/store/useAuthStore";
import { useGetUsersMe } from "@vantage/shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BLGUDashboardPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const { barangayName, isLoading: barangayLoading } = useUserBarangay();
  const { data, loading, error } = useDashboard();

  // Auto-generated hook to fetch current user data
  const userQuery = useGetUsersMe();

  // Handle user data fetch success
  useEffect(() => {
    if (userQuery.data && !user) {
      console.log("User data fetched in BLGU dashboard:", userQuery.data);
      setUser(userQuery.data);
    }
  }, [userQuery.data, user, setUser]);

  // Debug logging
  useEffect(() => {
    if (data) {
      console.log("Dashboard data loaded:", data);
      console.log("Status:", data.status);
      console.log("Feedback length:", data.feedback.length);
      console.log("Should show feedback:", data.status === "Needs Rework");
      console.log("User barangay:", barangayName);
    }
  }, [data, barangayName]);
  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading skeleton while dashboard data is loading
  if (loading || barangayLoading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden bg-[var(--card)] rounded-sm shadow-lg border border-[var(--border)] p-8">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/40 to-indigo-100/20 rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-100/30 to-pink-100/20 rounded-full translate-y-16 -translate-x-16"></div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">
                      Barangay{" "}
                      <span className="bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] bg-clip-text text-transparent">
                        {data.barangayName}
                      </span>
                      &apos;s
                    </h1>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 bg-[var(--card)]/60 backdrop-blur-sm py-1.5 px-3 rounded-sm border border-[var(--border)]">
                      <span className="font-medium text-[var(--text-secondary)]">
                        Performance Year:
                      </span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {data.performanceYear}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-[var(--card)]/60 backdrop-blur-sm px-3 py-1.5 rounded-sm border border-[var(--border)]">
                      <span className="font-medium text-[var(--text-secondary)]">
                        Assessment Year:
                      </span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {data.assessmentYear}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Quick Stats */}
                <div className="flex items-center gap-6">
                  <div className="bg-[var(--card)]/80 backdrop-blur-sm rounded-sm p-4 text-center shadow-sm border border-[var(--border)]">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {data.progress.current}
                    </div>
                    <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                      Compliant
                    </div>
                  </div>
                  <div className="bg-[var(--card)]/80 backdrop-blur-sm rounded-sm p-4 text-center shadow-sm border border-[var(--border)]">
                    <div className="text-3xl font-bold text-[var(--foreground)]">
                      {data.progress.total}
                    </div>
                    <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                      Total
                    </div>
                  </div>
                  <div className="bg-[var(--card)]/80 backdrop-blur-sm rounded-sm p-4 text-center shadow-sm border border-[var(--border)]">
                    <div className="text-3xl font-bold bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] bg-clip-text text-transparent">
                      {Math.round(data.progress.percentage)}%
                    </div>
                    <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                      Complete
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid with enhanced layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Column - Status and Feedback (3/4 width) */}
            <div className="xl:col-span-3 space-y-8">
              {/* Primary Status Card */}
              <StatusCard status={data.status} progress={data.progress} />

              {/* Action Required: Rework Section (only when assessment needs rework) */}
              {data.status === "Needs Rework" && data.feedback.length > 0 && (
                <FeedbackSection feedback={data.feedback} />
              )}
            </div>

            {/* Right Column - Enhanced Sidebar (1/4 width) */}
            <div className="space-y-6">
              {/* Quick Actions Card with enhanced design */}
              <div className="bg-[var(--card)] rounded-sm shadow-lg border border-[var(--border)] p-6 hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/blgu/assessments")}
                    className="group w-full text-left p-4 rounded-sm bg-[var(--hover)] border border-[var(--border)] hover:bg-[var(--cityscape-yellow)]/10 hover:border-[var(--cityscape-yellow)]/30 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="font-semibold text-[var(--foreground)] group-hover:text-[var(--cityscape-yellow)]">
                      Continue Assessment
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--cityscape-yellow)]/80">
                      Resume your current progress
                    </div>
                  </button>
                  <button
                    onClick={() => router.push("/blgu/profile")}
                    className="group w-full text-left p-4 rounded-sm bg-[var(--hover)] border border-[var(--border)] hover:bg-[var(--cityscape-yellow)]/10 hover:border-[var(--cityscape-yellow)]/30 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="font-semibold text-[var(--foreground)] group-hover:text-[var(--cityscape-yellow)]">
                      My Profile
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--cityscape-yellow)]/80">
                      Manage your account settings
                    </div>
                  </button>
                </div>
              </div>

              {/* Enhanced Assessment Summary */}
              <div className="bg-[var(--card)] rounded-sm shadow-lg border border-[var(--border)] p-6 hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Assessment Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-[var(--hover)] rounded-sm border border-[var(--border)]">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      Total Areas
                    </span>
                    <span className="text-xl font-bold text-[var(--foreground)]">
                      {data.governanceAreas.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-sm border border-green-500/20">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      Completed Areas
                    </span>
                    <span className="text-xl font-bold text-green-500">
                      {
                        data.governanceAreas.filter(
                          (area) => area.status === "completed"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-sm border border-blue-500/20">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      In Progress
                    </span>
                    <span className="text-xl font-bold text-blue-500">
                      {
                        data.governanceAreas.filter(
                          (area) => area.status === "in-progress"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-500/10 rounded-sm border border-amber-500/20">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      Need Rework
                    </span>
                    <span className="text-xl font-bold text-amber-500">
                      {
                        data.governanceAreas.filter(
                          (area) => area.status === "Needs Rework"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* New: Recent Activity Card */}
              <div className="bg-[var(--card)] rounded-sm shadow-lg border border-[var(--border)] p-6 hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-[var(--hover)] rounded-sm border border-[var(--border)]">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-sm text-[var(--foreground)]">
                      Assessment updated
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] ml-auto">
                      2h ago
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[var(--hover)] rounded-sm border border-[var(--border)]">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="text-sm text-[var(--foreground)]">
                      Progress synced
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] ml-auto">
                      1d ago
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[var(--hover)] rounded-sm border border-[var(--border)]">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <div className="text-sm text-[var(--foreground)]">
                      Feedback received
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] ml-auto">
                      3d ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Governance Areas Grid - Full Width with enhanced spacing */}
          <div className="mt-12">
            <GovernanceAreasGrid areas={data.governanceAreas} />
          </div>
        </div>
      </div>
    </div>
  );
}
