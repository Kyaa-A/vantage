/**
 * ResubmitAssessmentButton Component (Epic 5.0 - Story 5.16)
 *
 * BLGU-only button for resubmitting an assessment after rework.
 * Features:
 * - Only for assessments in REWORK status
 * - Uses same validation logic as initial submission
 * - Confirmation dialog with final submission warning
 * - Disabled if assessment is incomplete
 * - Success/error toast notifications
 *
 * Props:
 * - assessmentId: ID of the assessment to resubmit
 * - isComplete: Whether the assessment is complete (100%)
 * - onSuccess: Callback function after successful resubmission
 */

"use client";

import { useState } from "react";
import { Loader2, AlertCircle, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { usePostAssessmentsAssessmentIdResubmit } from "@vantage/shared";
import type { SubmissionValidationResult } from "@vantage/shared";

interface ResubmitAssessmentButtonProps {
  assessmentId: number;
  isComplete: boolean;
  onSuccess?: () => void;
}

export function ResubmitAssessmentButton({
  assessmentId,
  isComplete,
  onSuccess,
}: ResubmitAssessmentButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  // Epic 5.0 mutation hook for resubmitting assessment
  const { mutate: resubmitAssessment, isPending } = usePostAssessmentsAssessmentIdResubmit({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Assessment Resubmitted",
          description: `Your assessment was successfully resubmitted on ${new Date(
            data.submitted_at
          ).toLocaleString()}. This is your final submission.`,
          variant: "default",
        });

        // Close dialog and call success callback
        setShowConfirmDialog(false);
        onSuccess?.();
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.detail || error?.message || "Failed to resubmit assessment";

        toast({
          title: "Resubmission Failed",
          description: errorMessage,
          variant: "destructive",
        });

        // Close dialog on error
        setShowConfirmDialog(false);
      },
    },
  });

  const handleResubmitClick = () => {
    // Only show dialog if assessment is complete
    if (isComplete) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmResubmit = () => {
    resubmitAssessment({
      assessmentId,
    });
  };

  const isButtonDisabled = !isComplete || isPending;

  const button = (
    <Button
      onClick={handleResubmitClick}
      disabled={isButtonDisabled}
      size="lg"
      className="w-full sm:w-auto bg-[var(--cityscape-yellow)] hover:bg-[var(--cityscape-yellow)]/90 text-gray-900 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Resubmitting...
        </>
      ) : (
        <>
          <RotateCcw className="mr-2 h-4 w-4" />
          Resubmit Assessment
        </>
      )}
    </Button>
  );

  // Wrap button in tooltip if disabled due to incomplete assessment
  if (!isComplete && !isPending) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Complete all rework requirements before resubmitting
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      {button}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Resubmit Assessment?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">Are you sure you want to resubmit this assessment?</p>

                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md border border-orange-200 dark:border-orange-900">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-600" />
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-orange-700 dark:text-orange-400 block">
                      Final Submission Warning
                    </span>
                    <span className="text-orange-600 dark:text-orange-300 block">
                      This is your <strong>final submission</strong>. You have already used your one rework cycle.
                      No further changes will be allowed after resubmission.
                    </span>
                  </div>
                </div>

                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Your assessment will be locked for editing</li>
                  <li>An assessor will review your resubmission</li>
                  <li>No additional rework requests are possible</li>
                </ul>

                <div className="flex items-start gap-2 p-3 bg-muted rounded-md mt-3">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Please ensure all rework requirements have been addressed and all information is accurate.
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmResubmit}
              disabled={isPending}
              className="bg-[var(--cityscape-yellow)] hover:bg-[var(--cityscape-yellow)]/90 text-gray-900 font-semibold shadow-md hover:shadow-lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resubmitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Resubmit
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
