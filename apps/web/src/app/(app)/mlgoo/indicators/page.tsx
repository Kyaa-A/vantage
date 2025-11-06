"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useIndicators } from "@/hooks/useIndicators";
import { IndicatorList } from "@/components/features/indicators";

export default function IndicatorsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Fetch all indicators
  const { data: indicators, isLoading, error } = useIndicators();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  // Redirect non-admin users to their appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = user.role === "MLGOO_DILG";
      if (!isAdmin) {
        // Redirect to appropriate dashboard based on role
        if (user.role === "ASSESSOR" || user.role === "VALIDATOR") {
          router.replace("/assessor/submissions");
        } else {
          router.replace("/blgu/dashboard");
        }
      }
    }
  }, [isAuthenticated, user, router]);

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading if user is not admin
  if (user && user.role !== "MLGOO_DILG") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">
            Access denied. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-sm p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Error Loading Indicators
            </h2>
            <p className="text-[var(--muted-foreground)]">
              Failed to load indicators. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateNew = () => {
    router.push("/mlgoo/indicators/new");
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Indicator Management
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Manage assessment indicators and their versioning across all governance areas.
          </p>
        </div>

        {/* Indicator List Component */}
        <IndicatorList
          indicators={indicators || []}
          onCreateNew={handleCreateNew}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
