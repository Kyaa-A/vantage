"use client";

import { Assessment, Indicator } from "@/types/assessment";
import { FileText } from "lucide-react";
import { RecursiveIndicator } from "./IndicatorAccordion";
import { ReworkCommentsPanel } from "./rework/ReworkCommentsPanel";
import { useEffect, useRef } from "react";

interface AssessmentContentPanelProps {
  assessment: Assessment;
  selectedIndicator: Indicator | null;
  isLocked: boolean;
  updateAssessmentData?: (updater: (data: Assessment) => Assessment) => void;
}

export function AssessmentContentPanel({
  assessment,
  selectedIndicator,
  isLocked,
  updateAssessmentData,
}: AssessmentContentPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Show empty state if no indicator selected
  if (!selectedIndicator) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--background)]">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-[var(--hover)] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-[var(--text-secondary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Select an Indicator
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Choose an indicator from the navigation panel to view and complete the assessment form.
          </p>
        </div>
      </div>
    );
  }

  // Check if indicator needs rework
  const indicatorLocked =
    isLocked ||
    (assessment.status === "Needs Rework" && !selectedIndicator.requiresRework);

  return (
    <div ref={contentRef} className="h-full overflow-y-auto bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Rework Comments (if applicable) */}
        {selectedIndicator.status === "needs_rework" &&
          selectedIndicator.assessorComment && (
            <ReworkCommentsPanel
              comments={[
                {
                  id: "1",
                  author: "Assessor",
                  comment: selectedIndicator.assessorComment,
                  timestamp: new Date().toISOString(),
                },
              ]}
            />
          )}

        {/* Form Content */}
        <div>
          <RecursiveIndicator
            indicator={selectedIndicator}
            isLocked={indicatorLocked}
            updateAssessmentData={updateAssessmentData}
            level={0}
          />
        </div>
      </div>
    </div>
  );
}
