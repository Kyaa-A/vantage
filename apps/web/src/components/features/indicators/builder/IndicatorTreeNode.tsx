'use client';

import React from 'react';
import { NodeApi } from 'react-arborist';
import { ChevronRight, ChevronDown, GripVertical, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndicatorTreeContextMenu } from './IndicatorTreeContextMenu';
import { cn } from '@/lib/utils';

/**
 * Indicator Tree Node Component
 *
 * Renders a single node in the indicator tree.
 * Displays code, name, validation status, and context menu.
 */

interface IndicatorTreeNodeProps {
  /** react-arborist node API */
  node: NodeApi;

  /** Inline style from react-arborist */
  style: React.CSSProperties;

  /** Drag handle ref from react-arborist */
  dragHandle?: React.Ref<HTMLDivElement>;

  /** Whether this node is selected */
  isSelected?: boolean;
}

export function IndicatorTreeNode({
  node,
  style,
  dragHandle,
  isSelected = false,
}: IndicatorTreeNodeProps) {
  const [showContextMenu, setShowContextMenu] = React.useState(false);
  const indicatorData = node.data.data;

  /**
   * Get validation status for the node
   * TODO: Integrate with actual validation system
   */
  const getValidationStatus = () => {
    // Placeholder logic - replace with actual validation
    if (!indicatorData.name || indicatorData.name.length < 3) {
      return { status: 'error', label: 'Invalid' };
    }
    if (!indicatorData.description) {
      return { status: 'warning', label: 'Incomplete' };
    }
    if (indicatorData.form_schema) {
      return { status: 'complete', label: 'Complete' };
    }
    return { status: 'draft', label: 'Draft' };
  };

  const validation = getValidationStatus();

  /**
   * Get badge variant based on validation status
   */
  const getBadgeVariant = () => {
    switch (validation.status) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'outline';
      case 'complete':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div
      style={style}
      className={cn(
        'flex items-center px-2 py-1 hover:bg-accent/50 transition-colors group',
        isSelected && 'bg-accent'
      )}
    >
      {/* Drag Handle */}
      <div
        ref={dragHandle}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Expand/Collapse Arrow */}
      <div className="flex-shrink-0 w-6 flex items-center justify-center">
        {node.children && node.children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              node.toggle();
            }}
            className="hover:bg-accent rounded p-0.5 transition-colors"
          >
            {node.isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Node Content */}
      <div
        className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
        onClick={() => node.select()}
        onDoubleClick={() => node.activate()}
      >
        {/* Code Badge */}
        {node.data.code && (
          <Badge variant="outline" className="flex-shrink-0 font-mono text-xs">
            {node.data.code}
          </Badge>
        )}

        {/* Name */}
        <span className="flex-1 truncate text-sm font-medium">
          {node.data.name}
        </span>

        {/* Validation Status */}
        <Badge
          variant={getBadgeVariant() as any}
          className="flex-shrink-0 text-xs"
        >
          {validation.label}
        </Badge>
      </div>

      {/* Context Menu */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <IndicatorTreeContextMenu
          nodeId={node.id}
          hasChildren={node.children ? node.children.length > 0 : false}
          isOpen={showContextMenu}
          onOpenChange={setShowContextMenu}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setShowContextMenu(true);
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </IndicatorTreeContextMenu>
      </div>
    </div>
  );
}
