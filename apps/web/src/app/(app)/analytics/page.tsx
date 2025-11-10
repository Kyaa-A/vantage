'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetUsersMe } from '@vantage/shared';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import {
  ComplianceRateCard,
  CompletionStatusCard,
  AreaBreakdownCard,
  TopFailedIndicatorsCard,
  BarangayRankingsCard,
  BBIFunctionalityWidget,
} from '@/components/features/dashboard-analytics';
import { TrendChart } from '@/components/features/dashboard-analytics';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<'phase1' | 'phase2' | 'all'>('all');

  // Auto-generated hook to fetch current user data
  const userQuery = useGetUsersMe();

  // Analytics dashboard data hook with error handling
  const { data, isLoading, error, refetch } = useDashboardAnalytics(selectedCycle);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Handle user data fetch success and RBAC check
  useEffect(() => {
    if (userQuery.data && !user) {
      setUser(userQuery.data);
    }

    // Check if user has MLGOO_DILG role
    if (userQuery.data && userQuery.data.role !== 'MLGOO_DILG') {
      // Redirect to unauthorized or home page
      router.replace('/');
    }
  }, [userQuery.data, user, setUser, router]);

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--cityscape-yellow)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check RBAC - only MLGOO_DILG can access
  if (user && user.role !== 'MLGOO_DILG') {
    return (
      <div className="min-h-screen bg-[var(--background)] p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page. Only MLGOO-DILG users can view the
              analytics dashboard.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show loading skeleton while dashboard data is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-8">
        <div className="max-w-7xl mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>
              Unable to load dashboard data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-6 py-3 rounded-sm font-semibold hover:shadow-lg transition-all duration-200"
              style={{
                background: 'linear-gradient(to bottom right, var(--cityscape-yellow), var(--cityscape-yellow-dark))',
                color: 'var(--foreground)',
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden bg-[var(--card)] rounded shadow-lg border border-gray-200 p-8">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/40 to-indigo-100/20 rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-100/30 to-pink-100/20 rounded-full translate-y-16 -translate-x-16"></div>

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-[var(--foreground)]">
                    Analytics{" "}
                    <span className="bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] bg-clip-text text-transparent">
                      Dashboard
                    </span>
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Comprehensive overview of assessment KPIs and trends
                  </p>
                </div>

                {/* Last Updated Timestamp */}
                {data && (
                  <div className="bg-[var(--card)]/80 backdrop-blur-sm rounded p-4 text-center shadow-sm border border-gray-200">
                    <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-1">
                      Last Updated
                    </div>
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {new Date().toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Global Filters */}
          <div className="bg-[var(--card)] rounded shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="h-5 w-5" style={{ color: 'var(--cityscape-yellow)' }} />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Global Filters</h2>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Cycle Selector */}
              <div className="w-full sm:w-64">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Assessment Cycle
                </label>
                <Select
                  value={selectedCycle?.toString() || 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedCycle(null);
                    } else {
                      setSelectedCycle(parseInt(value));
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] rounded">
                    <SelectValue placeholder="Select cycle" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card)] border border-[var(--border)] shadow-xl rounded z-50">
                    <SelectItem value="all" className="text-[var(--foreground)] hover:bg-[var(--cityscape-yellow)]/10 cursor-pointer px-3 py-2">All Cycles</SelectItem>
                    <SelectItem value="1" className="text-[var(--foreground)] hover:bg-[var(--cityscape-yellow)]/10 cursor-pointer px-3 py-2">Cycle 1 - 2024 Q1</SelectItem>
                    <SelectItem value="2" className="text-[var(--foreground)] hover:bg-[var(--cityscape-yellow)]/10 cursor-pointer px-3 py-2">Cycle 2 - 2024 Q2</SelectItem>
                    <SelectItem value="3" className="text-[var(--foreground)] hover:bg-[var(--cityscape-yellow)]/10 cursor-pointer px-3 py-2">Cycle 3 - 2024 Q3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phase Selector */}
              <div className="w-full sm:w-64">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Assessment Phase
                </label>
                <Select
                  value={selectedPhase}
                  onValueChange={(value: 'phase1' | 'phase2' | 'all') => {
                    setSelectedPhase(value);
                  }}
                >
                  <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)] rounded">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card)] border border-[var(--border)] shadow-xl rounded z-50">
                    <SelectItem value="all" className="text-[var(--foreground)] hover:bg-[var(--cityscape-yellow)]/10 cursor-pointer px-3 py-2">All Phases</SelectItem>
                    <SelectItem value="phase1" className="text-[var(--foreground)] hover:bg-[var(--cityscape-yellow)]/10 cursor-pointer px-3 py-2">Phase 1: Table Assessment (Assessor)</SelectItem>
                    <SelectItem value="phase2" className="text-[var(--foreground)] hover:bg-[var(--cityscape-yellow)]/10 cursor-pointer px-3 py-2">Phase 2: Table Validation (Validator)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Phase Badge Indicator */}
            {selectedPhase !== 'all' && (
              <div className="flex items-center gap-2 mt-4">
                <div
                  className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium border ${
                    selectedPhase === 'phase1'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-purple-100 text-purple-800 border-purple-200'
                  }`}
                >
                  {selectedPhase === 'phase1' ? (
                    <>
                      Phase 1: Table Assessment
                      <span className="ml-2 text-blue-600 font-normal">(Assessor Role)</span>
                    </>
                  ) : (
                    <>
                      Phase 2: Table Validation
                      <span className="ml-2 text-purple-600 font-normal">(Validator Role)</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main KPI Cards */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ComplianceRateCard data={data.overall_compliance_rate} />
              <CompletionStatusCard data={data.completion_status} />
              <TopFailedIndicatorsCard data={data.top_failed_indicators || []} />
            </div>
          )}

          {/* Detailed Analytics Sections */}
          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AreaBreakdownCard data={data.area_breakdown || []} />
              <BarangayRankingsCard data={data.barangay_rankings || []} />
            </div>
          )}

          {/* Trend Chart */}
          {data && <TrendChart data={data.trends || []} />}

          {/* BBI Functionality Widget */}
          {data && data.bbi_functionality && (
            <BBIFunctionalityWidget data={data.bbi_functionality} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton component for the dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="bg-[var(--card)] rounded shadow-lg border border-gray-200 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-16 w-32" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-[var(--card)] rounded shadow-lg border border-gray-200 p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[var(--card)] p-6 rounded shadow-lg border border-gray-200">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Detailed Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[var(--card)] p-6 rounded shadow-lg border border-gray-200">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
