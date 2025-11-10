'use client';

import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { useIndicatorBuilderStore } from '@/store/useIndicatorBuilderStore';
import { NavigatorTreeNode } from './NavigatorTreeNode';

/**
 * IndicatorNavigator Component
 *
 * Left panel tree navigator for schema configuration.
 * Displays hierarchical indicator list with status icons and progress tracking.
 *
 * Features:
 * - Tree view with status icons (☑ complete, ○ incomplete, ⚠ error, ◉ current)
 * - Search/filter capabilities
 * - Progress tracking footer
 * - Click-to-switch navigation
 */

interface IndicatorNavigatorProps {
  currentIndicatorId: string | null;
  onNavigate: (indicatorId: string) => void;
}

type FilterMode = 'all' | 'incomplete' | 'errors' | 'complete';

export function IndicatorNavigator({
  currentIndicatorId,
  onNavigate,
}: IndicatorNavigatorProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<FilterMode>('all');

  const getAllNodes = useIndicatorBuilderStore(state => state.getAllNodes);
  const schemaStatus = useIndicatorBuilderStore(state => state.schemaStatus);
  const getSchemaProgress = useIndicatorBuilderStore(state => state.getSchemaProgress);
  const isLeafIndicator = useIndicatorBuilderStore(state => state.isLeafIndicator);
  const getParentStatusInfo = useIndicatorBuilderStore(state => state.getParentStatusInfo);
  const navigateToNextIncomplete = useIndicatorBuilderStore(state => state.navigateToNextIncomplete);

  const allNodes = getAllNodes();
  const progress = getSchemaProgress(); // Now counts leaves only (Phase 6)

  // Build tree structure
  const treeData = useMemo(() => {
    const buildTree = (parentId: string | null): any[] => {
      return allNodes
        .filter(node => node.parent_temp_id === parentId)
        .sort((a, b) => a.order - b.order)
        .map(node => ({
          ...node,
          children: buildTree(node.temp_id),
        }));
    };
    return buildTree(null);
  }, [allNodes]);

  // Filter nodes based on search and filter mode
  const filteredNodes = useMemo(() => {
    const filterNode = (node: any): any | null => {
      const status = schemaStatus.get(node.temp_id);
      const matchesSearch =
        searchQuery === '' ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.code?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (filterMode === 'incomplete') {
        matchesFilter = !status?.isComplete;
      } else if (filterMode === 'errors') {
        matchesFilter = (status?.errors.length || 0) > 0;
      } else if (filterMode === 'complete') {
        matchesFilter = status?.isComplete || false;
      }

      // Filter children recursively
      const filteredChildren = node.children
        ?.map(filterNode)
        .filter((child: any) => child !== null) || [];

      // Include node if it matches or has matching children
      if (matchesSearch && matchesFilter) {
        return { ...node, children: filteredChildren };
      } else if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }

      return null;
    };

    return treeData.map(filterNode).filter(node => node !== null);
  }, [treeData, searchQuery, filterMode, schemaStatus]);

  // Render tree recursively with leaf detection and parent status (Phase 6)
  const renderTree = (nodes: any[], depth: number = 0) => {
    return nodes.map(node => {
      const isLeaf = isLeafIndicator(node.temp_id);
      const parentStatus = !isLeaf ? getParentStatusInfo(node.temp_id) : undefined;

      return (
        <NavigatorTreeNode
          key={node.temp_id}
          indicator={node}
          depth={depth}
          isSelected={currentIndicatorId === node.temp_id}
          isLeaf={isLeaf}
          status={schemaStatus.get(node.temp_id)}
          parentStatus={parentStatus}
          onClick={(e: React.MouseEvent) => {
            // Smart navigation: Shift+Click to force parent selection
            if (!isLeaf && e.shiftKey) {
              // Force parent selection (will show aggregate dashboard)
              onNavigate(node.temp_id);
            } else {
              // Normal click: smart navigation handled by store
              onNavigate(node.temp_id);
            }
          }}
        >
          {node.children && node.children.length > 0 && renderTree(node.children, depth + 1)}
        </NavigatorTreeNode>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header: Search & Filter */}
      <div className="p-4 space-y-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search indicators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterMode('all')}>
                {filterMode === 'all' && '✓ '}Show All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('incomplete')}>
                {filterMode === 'incomplete' && '✓ '}Incomplete Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('errors')}>
                {filterMode === 'errors' && '✓ '}Errors Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('complete')}>
                {filterMode === 'complete' && '✓ '}Complete Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress badge (counts leaf indicators only - Phase 6) */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {progress.complete} / {progress.total} data collection indicators
          </Badge>
          {filterMode !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Filtered: {filterMode}
            </Badge>
          )}
        </div>
      </div>

      {/* Tree View */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredNodes.length > 0 ? (
            renderTree(filteredNodes)
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchQuery || filterMode !== 'all' ? (
                <>
                  <p>No indicators match your filters</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterMode('all');
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </>
              ) : (
                <p>No indicators to configure</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer: Progress & Actions (counts leaf indicators only - Phase 6) */}
      <div className="p-4 border-t space-y-3 shrink-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Schema Configuration Progress</span>
            <span className="font-medium">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {progress.complete} of {progress.total} data collection indicators configured
          </p>
        </div>

        {progress.complete < progress.total && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={navigateToNextIncomplete}
          >
            Next Incomplete
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
