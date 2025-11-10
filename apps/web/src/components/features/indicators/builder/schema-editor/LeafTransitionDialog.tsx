'use client';

import React from 'react';
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
import { AlertTriangle, Archive, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * LeafTransitionDialog Component
 *
 * Warning dialog displayed when user attempts to add a child to a leaf indicator
 * that has existing schemas. This action would convert the leaf to a parent,
 * requiring schema archival.
 *
 * Background:
 * - Leaf indicators (no children) have form schemas for data collection
 * - Parent indicators (with children) should NOT have schemas
 * - When a leaf becomes a parent, its schemas must be archived
 * - Archived schemas are stored in `metadata.archived_schemas` for potential restoration
 *
 * User Actions:
 * - "Archive & Continue": Proceed with adding child, archive current schemas
 * - "Cancel": Abort the operation, keep indicator as leaf
 */

interface LeafTransitionDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Name of the indicator being converted */
  indicatorName: string;

  /** Code of the indicator (e.g., "1.1.1") */
  indicatorCode?: string;

  /** Whether the indicator has a form schema */
  hasFormSchema: boolean;

  /** Whether the indicator has a calculation schema */
  hasCalculationSchema: boolean;

  /** Whether the indicator has a remark schema */
  hasRemarkSchema: boolean;

  /** Callback when user confirms (Archive & Continue) */
  onConfirm: () => void;

  /** Callback when user cancels */
  onCancel: () => void;
}

export function LeafTransitionDialog({
  open,
  indicatorName,
  indicatorCode,
  hasFormSchema,
  hasCalculationSchema,
  hasRemarkSchema,
  onConfirm,
  onCancel,
}: LeafTransitionDialogProps) {
  const schemasToArchive = [
    hasFormSchema && 'Form schema',
    hasCalculationSchema && 'Calculation schema',
    hasRemarkSchema && 'Remark template',
  ].filter(Boolean);

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-start gap-3 mb-2">
            <div className="shrink-0 p-2 rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl">
                Convert to Parent Indicator?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                You&apos;re about to add a child indicator to:
              </AlertDialogDescription>
            </div>
          </div>

          {/* Indicator Info */}
          <div className="pl-11 space-y-3">
            <div className="flex items-center gap-2">
              {indicatorCode && (
                <Badge variant="outline" className="font-mono text-xs">
                  {indicatorCode}
                </Badge>
              )}
              <span className="font-semibold">{indicatorName}</span>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Archive className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    This will archive the existing schemas
                  </p>
                  <p className="text-sm text-amber-800">
                    Since this indicator will become a parent (organizational container), it can
                    no longer have data collection schemas. The following will be archived:
                  </p>
                  <ul className="space-y-1 text-sm text-amber-800">
                    {schemasToArchive.map((schema, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span>{schema}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>What happens next:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Current schemas will be saved in metadata (recoverable)</li>
                <li>This indicator becomes a parent container</li>
                <li>Child indicators will be the data collection points</li>
                <li>Scores will aggregate from children automatically</li>
              </ul>
              <p className="mt-3">
                <strong>Note:</strong> If you later remove all children, you can restore the
                archived schemas.
              </p>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive & Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
