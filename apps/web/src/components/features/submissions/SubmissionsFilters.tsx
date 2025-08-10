'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { SubmissionsFilter } from '@/types/submissions';
import { useState } from 'react';

interface SubmissionsFiltersProps {
  filters: SubmissionsFilter;
  onFiltersChange: (filters: SubmissionsFilter) => void;
}

const statusOptions = [
  { value: 'awaiting_review', label: 'Awaiting Review', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'needs_rework', label: 'Needs Rework', color: 'bg-orange-100 text-orange-800' },
  { value: 'validated', label: 'Validated', color: 'bg-green-100 text-green-800' },
];

export function SubmissionsFilters({ filters, onFiltersChange }: SubmissionsFiltersProps) {
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const clearFilters = () => {
    onFiltersChange({ search: '', status: [] });
  };

  const hasActiveFilters = filters.search || filters.status.length > 0;

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="relative lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
            <Input
              placeholder="Search by barangay name, assigned assessor, or status..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-12 pr-4 py-3 border-2 border-[var(--border)] bg-[var(--card)] hover:border-[var(--cityscape-yellow)] focus:border-[var(--cityscape-yellow)] transition-all duration-200 text-base"
            />
          </div>
          {filters.search && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <button
                onClick={() => handleSearchChange('')}
                className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowStatusFilter(!showStatusFilter)}
            className={`w-full border-2 border-[var(--border)] bg-[var(--card)] hover:border-[var(--cityscape-yellow)] hover:bg-[var(--hover)] transition-all duration-200 py-3 ${
              filters.status.length > 0 ? 'border-[var(--cityscape-yellow)] bg-[var(--cityscape-yellow)]/10' : ''
            }`}
          >
            <Filter className="h-5 w-5 mr-2" />
            <span className="font-medium">Filter by Status</span>
            {filters.status.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-[var(--cityscape-yellow)] text-[var(--cityscape-accent-foreground)]">
                {filters.status.length}
              </Badge>
            )}
          </Button>
          
          {showStatusFilter && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card)] border-2 border-[var(--border)] rounded-sm shadow-xl z-10 p-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-[var(--foreground)] text-sm border-b border-[var(--border)] pb-2">
                  Filter by Status
                </h4>
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer p-2 rounded-sm hover:bg-[var(--hover)] transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => handleStatusToggle(option.value)}
                      className="rounded border-2 border-[var(--border)] text-[var(--cityscape-yellow)] focus:ring-[var(--cityscape-yellow)]"
                    />
                    <span className="text-sm font-medium text-[var(--foreground)]">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Active Filters Display */}
      {hasActiveFilters && (
        <div className="bg-gradient-to-r from-[var(--muted)] to-[var(--card)] border border-[var(--border)] rounded-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-[var(--foreground)] text-sm">
              Active Filters ({filters.status.length + (filters.search ? 1 : 0)})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)] transition-all duration-200"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 px-3 py-1 font-medium"
              >
                <Search className="h-3 w-3 mr-1" />
                &quot;{filters.search}&quot;
              </Badge>
            )}
            {filters.status.map((status) => {
              const option = statusOptions.find(opt => opt.value === status);
              return (
                <Badge
                  key={status}
                  variant="secondary"
                  className={`${option?.color} border px-3 py-1 font-medium`}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {option?.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 