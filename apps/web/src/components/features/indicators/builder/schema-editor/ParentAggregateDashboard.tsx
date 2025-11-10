'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Folder,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { IndicatorNode } from '@/store/useIndicatorBuilderStore';
import type { ParentStatusInfo } from '@/lib/indicator-tree-utils';

/**
 * ParentAggregateDashboard Component
 *
 * Displayed when a parent indicator is selected in the schema editor.
 * Shows educational content about parent vs leaf concept and provides
 * an aggregate view of child indicator progress.
 *
 * Features:
 * - Educational explanation of parent indicators
 * - Progress summary (X/Y child indicators complete)
 * - List of child indicators with status
 * - "Configure Next Incomplete" button for quick navigation
 */

interface ParentAggregateDashboardProps {
  /** The parent indicator */
  indicator: IndicatorNode;

  /** Parent status information (aggregate from leaves) */
  parentStatus: ParentStatusInfo;

  /** All descendant leaf indicators */
  leafIndicators: IndicatorNode[];

  /** Navigate to a specific indicator */
  onNavigateToIndicator: (indicatorId: string) => void;

  /** Navigate to next incomplete leaf */
  onNavigateToNextIncomplete: () => void;
}

export function ParentAggregateDashboard({
  indicator,
  parentStatus,
  leafIndicators,
  onNavigateToIndicator,
  onNavigateToNextIncomplete,
}: ParentAggregateDashboardProps) {
  const { totalLeaves, completeLeaves, percentage, firstIncompleteLeaf } = parentStatus;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold">{indicator.name}</h2>
        </div>
        {indicator.code && (
          <p className="text-sm text-muted-foreground font-mono">{indicator.code}</p>
        )}
        {indicator.description && (
          <p className="text-sm text-muted-foreground">{indicator.description}</p>
        )}
      </div>

      {/* Educational Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <CardTitle className="text-lg">Parent Indicator</CardTitle>
              <CardDescription>
                This is an organizational container for grouping related indicators
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Parent indicators</strong> organize the assessment structure but don&apos;t collect
            data directly. Their scores are automatically calculated from their child indicators.
          </p>
          <p>
            <strong>Leaf indicators</strong> (the data collection points beneath this parent) are
            where you configure form schemas, calculations, and remark templates.
          </p>
          <p className="text-muted-foreground">
            Click on any child indicator below to configure its schemas, or use the &quot;Configure
            Next Incomplete&quot; button to jump to the first incomplete indicator.
          </p>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Summary</CardTitle>
          <CardDescription>
            {completeLeaves} of {totalLeaves} data collection indicators complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {firstIncompleteLeaf && (
            <Button
              onClick={onNavigateToNextIncomplete}
              className="w-full"
              size="lg"
            >
              Configure Next Incomplete
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {!firstIncompleteLeaf && totalLeaves > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                All {totalLeaves} child indicators complete!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Child Indicators List */}
      <Card>
        <CardHeader>
          <CardTitle>Child Indicators</CardTitle>
          <CardDescription>
            Data collection points under this parent indicator
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leafIndicators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No child indicators found</p>
              <p className="text-sm mt-1">
                Add child indicators in the tree structure editor
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leafIndicators.map((leaf) => {
                const isComplete = leaf.form_schema &&
                  leaf.calculation_schema &&
                  leaf.remark_schema;

                return (
                  <button
                    key={leaf.temp_id}
                    onClick={() => onNavigateToIndicator(leaf.temp_id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                      'hover:bg-accent hover:border-accent-foreground/20',
                      isComplete
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-gray-200 bg-background'
                    )}
                  >
                    {/* Status Icon */}
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}

                    {/* Type Icon */}
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        {leaf.code && (
                          <span className="text-xs font-mono text-muted-foreground shrink-0">
                            {leaf.code}
                          </span>
                        )}
                        <span className="text-sm font-medium truncate">{leaf.name}</span>
                      </div>
                      {leaf.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {leaf.description}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={cn(
                        'shrink-0 text-xs px-2 py-1 rounded-full',
                        isComplete
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {isComplete ? 'Complete' : 'Incomplete'}
                    </span>

                    {/* Arrow */}
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
