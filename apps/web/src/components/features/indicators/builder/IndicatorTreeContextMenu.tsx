'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useIndicatorBuilderStore } from '@/store/useIndicatorBuilderStore';
import {
  Plus,
  Copy,
  Edit2,
  Trash2,
  PlusCircle,
} from 'lucide-react';

/**
 * Indicator Tree Context Menu
 *
 * Provides actions for tree nodes:
 * - Add child indicator
 * - Add sibling indicator
 * - Edit indicator
 * - Duplicate indicator
 * - Delete indicator
 */

interface IndicatorTreeContextMenuProps {
  /** Node ID to perform actions on */
  nodeId: string;

  /** Whether the node has children (affects delete confirmation) */
  hasChildren: boolean;

  /** Whether the menu is open */
  isOpen: boolean;

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;

  /** Trigger element */
  children: React.ReactNode;
}

export function IndicatorTreeContextMenu({
  nodeId,
  hasChildren,
  isOpen,
  onOpenChange,
  children,
}: IndicatorTreeContextMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const {
    getNodeById,
    addNode,
    duplicateNode,
    deleteNode,
    setEditingNode,
    selectNode,
  } = useIndicatorBuilderStore();

  const node = getNodeById(nodeId);

  if (!node) return null;

  /**
   * Add a child indicator to this node
   */
  const handleAddChild = () => {
    const newId = addNode(
      {
        name: 'New Child Indicator',
        is_active: true,
        is_auto_calculable: false,
        is_profiling_only: false,
      },
      nodeId
    );
    selectNode(newId);
    setEditingNode(newId);
    onOpenChange(false);
  };

  /**
   * Add a sibling indicator (same parent)
   */
  const handleAddSibling = () => {
    const newId = addNode(
      {
        name: 'New Sibling Indicator',
        is_active: true,
        is_auto_calculable: false,
        is_profiling_only: false,
      },
      node.parent_temp_id || undefined
    );
    selectNode(newId);
    setEditingNode(newId);
    onOpenChange(false);
  };

  /**
   * Edit this indicator
   */
  const handleEdit = () => {
    selectNode(nodeId);
    setEditingNode(nodeId);
    onOpenChange(false);
  };

  /**
   * Duplicate this indicator (and optionally its children)
   */
  const handleDuplicate = () => {
    const newId = duplicateNode(nodeId, false); // Duplicate without children for now
    selectNode(newId);
    onOpenChange(false);
  };

  /**
   * Delete this indicator (after confirmation)
   */
  const handleDelete = () => {
    setShowDeleteDialog(true);
    onOpenChange(false);
  };

  /**
   * Confirm delete action
   */
  const confirmDelete = () => {
    deleteNode(nodeId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleAddChild}>
            <Plus className="mr-2 h-4 w-4" />
            Add Child Indicator
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleAddSibling}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Sibling Indicator
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Indicator?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasChildren ? (
                <>
                  This will delete <strong>&quot;{node.name}&quot;</strong> and{' '}
                  <strong>all its child indicators</strong>. This action cannot
                  be undone.
                </>
              ) : (
                <>
                  This will delete <strong>&quot;{node.name}&quot;</strong>.
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
