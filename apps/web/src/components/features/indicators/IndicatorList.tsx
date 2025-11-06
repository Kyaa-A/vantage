"use client";

import { useState } from "react";
import type { IndicatorResponse } from "@vantage/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface IndicatorListProps {
  indicators: IndicatorResponse[];
  onCreateNew?: () => void;
  isLoading?: boolean;
}

export default function IndicatorList({
  indicators,
  onCreateNew,
  isLoading = false
}: IndicatorListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Get unique governance areas for filter
  const governanceAreas = Array.from(
    new Map(
      indicators
        .filter(i => i.governance_area)
        .map(i => [i.governance_area!.id, i.governance_area!])
    ).values()
  );

  // Filter indicators
  const filteredIndicators = indicators.filter((indicator) => {
    const matchesSearch = indicator.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesArea = filterArea === "all" ||
                       indicator.governance_area_id.toString() === filterArea;
    const matchesStatus = filterStatus === "all" ||
                         (filterStatus === "active" ? indicator.is_active : !indicator.is_active);

    return matchesSearch && matchesArea && matchesStatus;
  });

  const handleIndicatorClick = (indicatorId: number) => {
    router.push(`/mlgoo/indicators/${indicatorId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[var(--card)] border border-[var(--border)] rounded-sm p-6 animate-pulse"
          >
            <div className="h-6 bg-[var(--muted)] rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              type="text"
              placeholder="Search indicators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Governance Area Filter */}
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {governanceAreas.map((area) => (
                <SelectItem key={area.id} value={area.id.toString()}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create New Button */}
        {onCreateNew && (
          <Button
            onClick={onCreateNew}
            className="w-full sm:w-auto"
            style={{
              background: 'linear-gradient(to bottom right, var(--kpi-blue-from), var(--kpi-blue-to))',
              color: 'var(--kpi-blue-text)',
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Indicator
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-[var(--muted-foreground)]">
        Showing {filteredIndicators.length} of {indicators.length} indicators
      </div>

      {/* Indicator Cards */}
      {filteredIndicators.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card)] border border-[var(--border)] rounded-sm">
          <p className="text-[var(--muted-foreground)]">
            {searchQuery || filterArea !== "all" || filterStatus !== "all"
              ? "No indicators match your filters"
              : "No indicators found"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIndicators.map((indicator) => (
            <div
              key={indicator.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-sm p-6 hover:border-[var(--primary)] hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleIndicatorClick(indicator.id)}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Indicator Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                        {indicator.name}
                      </h3>
                      {indicator.description && (
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                          {indicator.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Governance Area */}
                    {indicator.governance_area && (
                      <Badge
                        variant="outline"
                        className="px-3 py-1 rounded-sm font-medium"
                        style={{
                          backgroundColor: 'var(--kpi-blue-from)',
                          color: 'var(--kpi-blue-text)',
                          borderColor: 'var(--kpi-blue-border, var(--border))'
                        }}
                      >
                        {indicator.governance_area.name}
                      </Badge>
                    )}

                    {/* Version */}
                    <Badge
                      variant="outline"
                      className="px-3 py-1 rounded-sm font-medium"
                      style={{
                        backgroundColor: 'var(--analytics-info-bg)',
                        color: 'var(--analytics-info-text)',
                        borderColor: 'var(--analytics-info-border)'
                      }}
                    >
                      v{indicator.version}
                    </Badge>

                    {/* Status */}
                    <Badge
                      variant="outline"
                      className="px-3 py-1 rounded-sm font-medium"
                      style={{
                        backgroundColor: indicator.is_active
                          ? 'var(--analytics-success-bg)'
                          : 'var(--analytics-neutral-bg)',
                        color: indicator.is_active
                          ? 'var(--analytics-success-text)'
                          : 'var(--analytics-neutral-text)',
                        borderColor: indicator.is_active
                          ? 'var(--analytics-success-border)'
                          : 'var(--analytics-neutral-border)'
                      }}
                    >
                      {indicator.is_active ? 'Active' : 'Inactive'}
                    </Badge>

                    {/* Auto-calculable */}
                    {indicator.is_auto_calculable && (
                      <Badge
                        variant="outline"
                        className="px-3 py-1 rounded-sm font-medium"
                        style={{
                          backgroundColor: 'var(--kpi-purple-from)',
                          color: 'var(--kpi-purple-text)',
                          borderColor: 'var(--kpi-purple-border, var(--border))'
                        }}
                      >
                        Auto-calculable
                      </Badge>
                    )}

                    {/* Profiling Only */}
                    {indicator.is_profiling_only && (
                      <Badge
                        variant="outline"
                        className="px-3 py-1 rounded-sm font-medium"
                        style={{
                          backgroundColor: 'var(--analytics-warning-bg)',
                          color: 'var(--analytics-warning-text)',
                          borderColor: 'var(--analytics-warning-border)'
                        }}
                      >
                        Profiling Only
                      </Badge>
                    )}

                    {/* Parent indicator */}
                    {indicator.parent && (
                      <Badge
                        variant="outline"
                        className="px-3 py-1 rounded-sm font-medium text-xs"
                      >
                        Child of: {indicator.parent.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-[var(--muted-foreground)] space-y-1 lg:text-right">
                  <p>Created: {new Date(indicator.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(indicator.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
