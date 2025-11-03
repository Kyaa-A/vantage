"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FilterControls, VisualizationGrid } from "@/components/features/reports";
import { useGetAnalyticsReports } from "@vantage/shared";

export default function ReportsPage() {
  // Filter state
  const [filters, setFilters] = useState({
    cycle_id: undefined as number | undefined,
    start_date: undefined as string | undefined,
    end_date: undefined as string | undefined,
    governance_area: undefined as string[] | undefined,
    barangay_id: undefined as number[] | undefined,
    status: undefined as string | undefined,
    page: 1,
    page_size: 50,
  });

  // Fetch reports data with filters
  const { data, isLoading, error } = useGetAnalyticsReports({
    cycle_id: filters.cycle_id,
    start_date: filters.start_date,
    end_date: filters.end_date,
    governance_area: filters.governance_area,
    barangay_id: filters.barangay_id,
    status: filters.status,
    page: filters.page,
    page_size: filters.page_size,
  });

  // Handle filter changes - triggers automatic data re-fetch via TanStack Query
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <PageHeader
            title="Reports & Visualizations"
            description="Analytics and reporting dashboard with interactive visualizations"
          />

          <Alert variant="destructive">
            <AlertDescription>
              Failed to load reports data: {error.message || "Unknown error"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Reports & Visualizations"
          description="Analytics and reporting dashboard with interactive visualizations"
        />

        {/* Filter Controls */}
        <FilterControls
          filters={filters}
          onFilterChange={handleFilterChange}
          userRole="MLGOO_DILG" // TODO: Get actual user role from auth context
        />

        {/* Visualization Grid */}
        <VisualizationGrid data={data} isLoading={isLoading} />
      </div>
    </div>
  );
}
