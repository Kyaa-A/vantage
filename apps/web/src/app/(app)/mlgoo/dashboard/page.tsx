'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetUsersMe } from '@vantage/shared';
import { 
  DashboardHeader,
  KPICards,
  MunicipalProgressChart,
  AssessorQueue,
  FailedIndicators,
  AdminDashboardSkeleton
} from '@/components/features/dashboard';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [assessmentYear, setAssessmentYear] = useState('2024');

  // Auto-generated hook to fetch current user data
  const userQuery = useGetUsersMe();
  
  // Admin dashboard data hook
  const dashboardQuery = useAdminDashboard(assessmentYear);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Handle user data fetch success
  useEffect(() => {
    if (userQuery.data && !user) {
      console.log('User data fetched in dashboard:', userQuery.data);
      setUser(userQuery.data);
    }
  }, [userQuery.data, user, setUser]);

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'var(--analytics-danger)' }}
          ></div>
          <p className="text-[var(--muted-foreground)]">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading skeleton while dashboard data is loading
  if (dashboardQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AdminDashboardSkeleton />
      </div>
    );
  }

  // Show error state
  if (dashboardQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div 
            className="mb-4"
            style={{ color: 'var(--analytics-danger)' }}
          >
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-[var(--muted-foreground)] mb-4">
            Unable to load dashboard data. Please try refreshing the page.
          </p>
          <button 
            onClick={() => dashboardQuery.refetch()}
            className="px-4 py-2 rounded-md transition-colors"
            style={{
              backgroundColor: 'var(--kpi-blue-from)',
              color: 'var(--kpi-blue-text)'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dashboardData = dashboardQuery.data;

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-[var(--muted-foreground)]">No dashboard data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          {/* Enhanced Header Section */}
          <DashboardHeader
            municipality={dashboardData.municipality}
            performanceYear={dashboardData.performanceYear}
            assessmentYear={dashboardData.assessmentYear}
            onAssessmentYearChange={setAssessmentYear}
          />

          {/* Enhanced KPI Cards */}
          <KPICards data={dashboardData.kpiData} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Municipal Progress (2/3 width) */}
            <div className="xl:col-span-2">
              <MunicipalProgressChart 
                data={dashboardData.municipalProgress}
                totalBarangays={dashboardData.totalBarangays}
              />
            </div>

            {/* Right Column - Quick Stats (1/3 width) */}
            <div className="space-y-6">
              {/* Real-time Status Card */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-sm shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-sm"></div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">System Status</h3>
                </div>
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between p-3 rounded-sm"
                    style={{ backgroundColor: 'var(--analytics-success-bg)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: 'var(--analytics-success)' }}
                      ></div>
                      <span className="text-sm font-medium text-[var(--foreground)]">Live Data</span>
                    </div>
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: 'var(--analytics-success-text-light)' }}
                    >
                      ACTIVE
                    </span>
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 rounded-sm"
                    style={{ backgroundColor: 'var(--kpi-blue-from)' }}
                  >
                    <span className="text-sm font-medium text-[var(--foreground)]">Last Updated</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 rounded-sm"
                    style={{ backgroundColor: 'var(--kpi-purple-from)' }}
                  >
                    <span className="text-sm font-medium text-[var(--foreground)]">Auto-refresh</span>
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: 'var(--kpi-purple-text)' }}
                    >
                      30s
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-sm shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-sm"></div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/mlgoo/submissions')}
                    className="group w-full text-left p-4 rounded-sm border hover:shadow-md transition-all duration-200 hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--kpi-blue-from)',
                      borderColor: 'var(--kpi-blue-border, var(--border))'
                    }}
                  >
                    <div className="font-semibold text-[var(--foreground)]">Review Submissions</div>
                    <div className="text-sm text-[var(--muted-foreground)]">Check pending assessments</div>
                  </button>
                  <button 
                    onClick={() => router.push('/mlgoo/reports')}
                    className="group w-full text-left p-4 rounded-sm border hover:shadow-md transition-all duration-200 hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--analytics-success-bg)',
                      borderColor: 'var(--analytics-success-border)'
                    }}
                  >
                    <div className="font-semibold text-[var(--foreground)]">Generate Reports</div>
                    <div className="text-sm text-[var(--muted-foreground)]">View analytics & insights</div>
                  </button>
                  <button 
                    onClick={() => router.push('/user-management')}
                    className="group w-full text-left p-4 rounded-sm border hover:shadow-md transition-all duration-200 hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--kpi-purple-from)',
                      borderColor: 'var(--kpi-purple-border, var(--border))'
                    }}
                  >
                    <div className="font-semibold text-[var(--foreground)]">Manage Users</div>
                    <div className="text-sm text-[var(--muted-foreground)]">User accounts & permissions</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Actionable Intelligence Sections */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Assessor Queue */}
            <AssessorQueue data={dashboardData.assessorQueue} />
            
            {/* Failed Indicators */}
            <FailedIndicators 
              data={dashboardData.failedIndicators}
              totalBarangays={dashboardData.totalBarangays}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 