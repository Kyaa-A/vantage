"use client";

import { ValidationWorkspace } from '@/components/features/assessor/validation';
import { useGetAssessorAssessmentsAssessmentId } from '@vantage/shared';

interface AssessorValidationClientProps {
  assessmentId: number;
}

export function AssessorValidationClient({ assessmentId }: AssessorValidationClientProps) {
  const { data, isLoading, isError, error } = useGetAssessorAssessmentsAssessmentId(assessmentId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-muted-foreground">Loading assessment…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm">
        <div className="rounded-md border p-4">
          <div className="font-medium mb-1">Unable to load assessment</div>
          <div className="text-muted-foreground break-words">
            {String((error as any)?.message || 'Please verify access and try again.')}
          </div>
        </div>
      </div>
    );
  }

  const barangayName = (data as any)?.barangay?.name ?? 'Barangay';
  const governanceArea = (data as any)?.governance_area?.name ?? 'Governance Area';
  const cyYear = (data as any)?.calendar_year ?? new Date().getFullYear();

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="text-xl font-semibold">
            {barangayName} - {governanceArea} Assessment Validation (CY {cyYear})
          </h1>
          <div className="mt-1 text-sm text-muted-foreground">Status: Submitted for Review</div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <ValidationWorkspace assessment={data} />
      </div>
    </div>
  );
}


