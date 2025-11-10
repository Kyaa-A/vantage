import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * BBI (Barangay-Based Institutions) Status Type
 */
export interface BBIStatus {
  bbi_code: string;
  bbi_name: string;
  bbi_full_name: string;
  is_functional: boolean;
  contributing_indicators: {
    indicator_id: number;
    indicator_code: string;
    indicator_name: string;
    is_completed: boolean;
  }[];
}

export interface BBIFunctionalityData {
  total_bbis: number;
  functional_count: number;
  non_functional_count: number;
  functionality_percentage: number;
  previous_cycle_percentage?: number;
  bbi_statuses: BBIStatus[];
}

interface BBIFunctionalityWidgetProps {
  data: BBIFunctionalityData;
  title?: string;
  description?: string;
}

/**
 * BBIFunctionalityWidget
 *
 * Displays automatically calculated BBI (Barangay-Based Institutions) functionality status.
 * BBIs include: Lupon, BAC, BCPC, BHW, etc.
 *
 * Based on November 4, 2025 DILG consultation:
 * - BBI status is automatically calculated from indicator results
 * - No separate submission workflow
 * - Shows which indicators determine functionality
 */
export function BBIFunctionalityWidget({
  data,
  title = 'BBI Functionality Status',
  description = 'Barangay-Based Institutions (Lupon, BAC, BCPC, BHW, etc.)',
}: BBIFunctionalityWidgetProps) {
  const [expandedBBI, setExpandedBBI] = useState<string | null>(null);

  const {
    total_bbis,
    functional_count,
    non_functional_count,
    functionality_percentage,
    previous_cycle_percentage,
    bbi_statuses,
  } = data;

  const percentageChange = previous_cycle_percentage
    ? functionality_percentage - previous_cycle_percentage
    : null;

  const toggleBBI = (bbiCode: string) => {
    setExpandedBBI(expandedBBI === bbiCode ? null : bbiCode);
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  BBI functionality is automatically calculated based on assessment indicator
                  results. Click on each BBI to see which indicators determine its status.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Overall Functionality</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-gray-900">
                {functionality_percentage.toFixed(1)}%
              </span>
              {percentageChange !== null && (
                <span
                  className={`text-sm font-medium ${
                    percentageChange > 0
                      ? 'text-green-600'
                      : percentageChange < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {percentageChange > 0 ? '+' : ''}
                  {percentageChange.toFixed(1)}% vs previous cycle
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-green-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-2xl font-bold">{functional_count}</span>
              </div>
              <p className="text-xs text-gray-600">Functional</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-red-600 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-2xl font-bold">{non_functional_count}</span>
              </div>
              <p className="text-xs text-gray-600">Non-Functional</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={functionality_percentage} className="h-3" />
          <p className="text-xs text-gray-600 text-center">
            {functional_count} of {total_bbis} BBIs are currently functional
          </p>
        </div>

        {/* Individual BBI Status List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Individual BBI Status</h4>
          {bbi_statuses.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No BBI data available for this cycle
            </div>
          ) : (
            <div className="space-y-2">
              {bbi_statuses.map((bbi) => (
                <div
                  key={bbi.bbi_code}
                  className="rounded overflow-hidden shadow-sm border border-gray-200"
                >
                  {/* BBI Header */}
                  <button
                    onClick={() => toggleBBI(bbi.bbi_code)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {expandedBBI === bbi.bbi_code ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{bbi.bbi_name}</p>
                          <Badge
                            variant={bbi.is_functional ? 'default' : 'destructive'}
                            className={
                              bbi.is_functional
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-red-100 text-red-800 hover:bg-red-100'
                            }
                          >
                            {bbi.is_functional ? (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            ) : (
                              <XCircle className="mr-1 h-3 w-3" />
                            )}
                            {bbi.is_functional ? 'Functional' : 'Non-Functional'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{bbi.bbi_full_name}</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {bbi.contributing_indicators.length} indicator
                      {bbi.contributing_indicators.length !== 1 ? 's' : ''}
                    </div>
                  </button>

                  {/* Expanded Indicator Details */}
                  {expandedBBI === bbi.bbi_code && (
                    <div className="bg-gray-50 px-3 py-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Contributing Indicators:
                      </p>
                      <div className="space-y-1.5">
                        {bbi.contributing_indicators.map((indicator) => (
                          <div
                            key={indicator.indicator_id}
                            className="flex items-start gap-2 text-xs bg-white rounded p-2"
                          >
                            {indicator.is_completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">
                                {indicator.indicator_code}
                              </p>
                              <p className="text-gray-600 mt-0.5">{indicator.indicator_name}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                indicator.is_completed
                                  ? 'border-green-600 text-green-700'
                                  : 'border-red-600 text-red-700'
                              }
                            >
                              {indicator.is_completed ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
