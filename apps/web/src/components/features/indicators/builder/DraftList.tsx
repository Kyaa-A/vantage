'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Play,
  Trash2,
  Download,
  MoreVertical,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Draft List Component
 *
 * Displays a list of saved indicator drafts with metadata and actions.
 *
 * Features:
 * - Draft card layout with metadata
 * - Progress indicators
 * - Resume, delete, and export actions
 * - Lock status display
 * - Time-based sorting
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type DraftStatus = 'in_progress' | 'ready_for_review' | 'completed';

export interface DraftMetadata {
  id: string;
  title: string;
  governance_area_id: number;
  governance_area_name?: string;
  governance_area_code?: string;
  creation_mode: string;
  current_step: number;
  status: DraftStatus;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  version: number;

  // Lock information
  locked_by_user_id?: number;
  locked_by_user_name?: string;
  locked_at?: string;

  // Progress metrics
  total_indicators: number;
  complete_indicators: number;
  incomplete_indicators: number;
  error_count: number;
}

interface DraftListProps {
  /** List of drafts to display */
  drafts: DraftMetadata[];

  /** Current user ID (for lock status) */
  currentUserId?: number;

  /** Callback when resume button is clicked */
  onResume: (draftId: string) => void;

  /** Callback when delete button is clicked */
  onDelete: (draftId: string) => void;

  /** Callback when export button is clicked */
  onExport: (draftId: string) => void;

  /** Whether actions are loading */
  isLoading?: boolean;

  /** Custom class name */
  className?: string;
}

interface DraftCardProps {
  draft: DraftMetadata;
  currentUserId?: number;
  onResume: () => void;
  onDelete: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get status badge configuration
 */
function getStatusBadge(status: DraftStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ReactNode;
} {
  switch (status) {
    case 'in_progress':
      return {
        label: 'In Progress',
        variant: 'secondary',
        icon: <Clock className="h-3 w-3" />,
      };
    case 'ready_for_review':
      return {
        label: 'Ready for Review',
        variant: 'default',
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    case 'completed':
      return {
        label: 'Completed',
        variant: 'outline',
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    default:
      return {
        label: 'Unknown',
        variant: 'secondary',
        icon: <AlertCircle className="h-3 w-3" />,
      };
  }
}

/**
 * Calculate completion percentage
 */
function getCompletionPercentage(draft: DraftMetadata): number {
  if (draft.total_indicators === 0) return 0;
  return Math.round((draft.complete_indicators / draft.total_indicators) * 100);
}

/**
 * Check if draft is locked by another user
 */
function isLockedByOther(draft: DraftMetadata, currentUserId?: number): boolean {
  if (!draft.locked_by_user_id) return false;
  return draft.locked_by_user_id !== currentUserId;
}

// ============================================================================
// Draft Card Component
// ============================================================================

function DraftCard({
  draft,
  currentUserId,
  onResume,
  onDelete,
  onExport,
  isLoading = false,
}: DraftCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const statusBadge = getStatusBadge(draft.status);
  const completionPercent = getCompletionPercentage(draft);
  const isLocked = isLockedByOther(draft, currentUserId);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className={cn('hover:shadow-md transition-shadow', isLocked && 'opacity-75')}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            {/* Title and Metadata */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{draft.title}</span>
              </CardTitle>

              <CardDescription className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {draft.governance_area_code && (
                    <Badge variant="outline" className="text-xs">
                      {draft.governance_area_code}
                    </Badge>
                  )}
                  <span className="text-xs">
                    {draft.governance_area_name || 'Unknown Area'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs mt-2">
                  <span>Updated {formatRelativeTime(draft.updated_at)}</span>
                  <span>•</span>
                  <span>Version {draft.version}</span>
                </div>
              </CardDescription>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              <Badge variant={statusBadge.variant} className="gap-1">
                {statusBadge.icon}
                {statusBadge.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completionPercent}%</span>
            </div>

            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{draft.complete_indicators} complete</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-yellow-500" />
                <span>{draft.incomplete_indicators} incomplete</span>
              </div>
              {draft.error_count > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <span>{draft.error_count} errors</span>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Total: {draft.total_indicators} indicator{draft.total_indicators !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Lock Status */}
          {draft.locked_by_user_id && (
            <div
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg text-xs',
                isLocked ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
              )}
            >
              {isLocked ? (
                <>
                  <Lock className="h-3 w-3" />
                  <span>
                    Locked by {draft.locked_by_user_name || 'another user'}
                    {draft.locked_at && ` ${formatRelativeTime(draft.locked_at)}`}
                  </span>
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3" />
                  <span>Locked by you</span>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={onResume}
              disabled={isLoading || isLocked}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {isLocked ? 'Locked' : 'Resume'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={isLoading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{draft.title}&quot; and all its data.
              This action cannot be undone.
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

// ============================================================================
// Main Draft List Component
// ============================================================================

export function DraftList({
  drafts,
  currentUserId,
  onResume,
  onDelete,
  onExport,
  isLoading = false,
  className = '',
}: DraftListProps) {
  // Sort drafts by last accessed/updated time (most recent first)
  const sortedDrafts = React.useMemo(() => {
    return [...drafts].sort((a, b) => {
      const dateA = new Date(a.last_accessed_at || a.updated_at).getTime();
      const dateB = new Date(b.last_accessed_at || b.updated_at).getTime();
      return dateB - dateA;
    });
  }, [drafts]);

  if (drafts.length === 0) {
    return (
      <Card className={cn('text-center py-12', className)}>
        <CardContent>
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Drafts Yet</h3>
          <p className="text-sm text-muted-foreground">
            Start creating indicators and your drafts will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {sortedDrafts.map((draft) => (
        <DraftCard
          key={draft.id}
          draft={draft}
          currentUserId={currentUserId}
          onResume={() => onResume(draft.id)}
          onDelete={() => onDelete(draft.id)}
          onExport={() => onExport(draft.id)}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
