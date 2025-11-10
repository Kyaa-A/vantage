'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { IndicatorNode, SchemaStatus } from '@/store/useIndicatorBuilderStore';

/**
 * NavigatorTreeNode Component
 *
 * Individual tree node displaying indicator with status icon.
 * Supports expand/collapse for parent nodes and visual hierarchy.
 *
 * Status Icons (shape + color for accessibility):
 * - ☑ Green checkmark: Complete (all schemas valid)
 * - ○ Gray circle: Incomplete (not started)
 * - ⚠ Amber warning: Error (validation errors)
 * - ◉ Blue filled circle: Current (actively editing)
 */

interface NavigatorTreeNodeProps {
  indicator: IndicatorNode & { children?: any[] };
  depth: number;
  isSelected: boolean;
  status?: SchemaStatus;
  onClick: () => void;
  children?: React.ReactNode;
}

export function NavigatorTreeNode({
  indicator,
  depth,
  isSelected,
  status,
  onClick,
  children,
}: NavigatorTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = indicator.children && indicator.children.length > 0;

  // Determine status icon and styling
  const getStatusConfig = () => {
    if (isSelected) {
      return {
        icon: '◉',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-l-blue-600',
        label: 'Currently editing',
      };
    }

    if (status?.errors && status.errors.length > 0) {
      return {
        icon: '⚠',
        color: 'text-amber-600',
        bgColor: 'hover:bg-amber-50',
        borderColor: '',
        label: `Has ${status.errors.length} error(s)`,
      };
    }

    if (status?.isComplete) {
      return {
        icon: '☑',
        color: 'text-green-600',
        bgColor: 'hover:bg-green-50',
        borderColor: '',
        label: 'Complete',
      };
    }

    return {
      icon: '○',
      color: 'text-muted-foreground',
      bgColor: 'hover:bg-accent',
      borderColor: '',
      label: 'Incomplete',
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <div>
      {/* Node Button */}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors',
          statusConfig.bgColor,
          isSelected && `${statusConfig.bgColor} border-l-2 ${statusConfig.borderColor} font-medium`
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        aria-label={`${indicator.code || ''} ${indicator.name}. Status: ${statusConfig.label}`}
        aria-current={isSelected ? 'page' : undefined}
      >
        {/* Expand/Collapse Icon (for parent nodes) */}
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="shrink-0 hover:bg-accent rounded p-0.5"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}

        {/* Status Icon */}
        <span
          className={cn('text-lg leading-none shrink-0', statusConfig.color)}
          aria-hidden="true"
        >
          {statusConfig.icon}
        </span>

        {/* Indicator Code & Name */}
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          {indicator.code && (
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              {indicator.code}
            </span>
          )}
          <span className={cn('text-sm truncate', isSelected && 'font-medium')}>
            {indicator.name}
          </span>
        </div>

        {/* Error Count Badge */}
        {status?.errors && status.errors.length > 0 && (
          <span className="shrink-0 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
            {status.errors.length}
          </span>
        )}

        {/* Selected Indicator */}
        {isSelected && (
          <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
        )}
      </button>

      {/* Children (recursive) */}
      {hasChildren && isExpanded && <div>{children}</div>}
    </div>
  );
}
