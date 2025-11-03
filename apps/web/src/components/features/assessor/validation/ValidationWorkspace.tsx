"use client";

import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import type { AssessmentDetailsResponse } from '@vantage/shared';
import {
  usePostAssessorAssessmentResponsesResponseIdValidate,
  usePostAssessorAssessmentsAssessmentIdFinalize,
  usePostAssessorAssessmentsAssessmentIdRework,
} from '@vantage/shared';
import * as React from 'react';
import { LeftSubmissionView } from './LeftSubmissionView';
import { RightAssessorPanel } from './RightAssessorPanel';

interface ValidationWorkspaceProps {
  assessment: AssessmentDetailsResponse;
}

type AnyRecord = Record<string, any>;

export function ValidationWorkspace({ assessment }: ValidationWorkspaceProps) {
  const qc = useQueryClient();
  const validateMut = usePostAssessorAssessmentResponsesResponseIdValidate();
  const reworkMut = usePostAssessorAssessmentsAssessmentIdRework();
  const finalizeMut = usePostAssessorAssessmentsAssessmentIdFinalize();

  const data: AnyRecord = (assessment as unknown as AnyRecord) ?? {};
  const core = (data.assessment as AnyRecord) ?? data;
  const responses: AnyRecord[] = (core.responses as AnyRecord[]) ?? [];
  const assessmentId: number = data.assessment_id ?? core.id ?? 0;
  const reworkCount: number = core.rework_count ?? 0;

  const [form, setForm] = React.useState<Record<number, { status?: 'Pass' | 'Fail' | 'Conditional'; publicComment?: string; internalNote?: string }>>({});

  const total = responses.length;
  const reviewed = responses.filter((r) => !!form[r.id]?.status).length;
  const allReviewed = total > 0 && reviewed === total;
  const anyFail = responses.some((r) => form[r.id]?.status === 'Fail');
  const dirty = Object.keys(form).length > 0;
  const progressPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  const onSaveDraft = async () => {
    const payloads = responses
      .map((r) => ({ id: r.id as number, v: form[r.id] }))
      .filter((x) => x.v && x.v.status) as { id: number; v: { status: 'Pass' | 'Fail' | 'Conditional'; publicComment?: string; internalNote?: string } }[];
    if (payloads.length === 0) return;
    await Promise.all(
      payloads.map((p) =>
        validateMut.mutateAsync({
          responseId: p.id,
          data: {
            validation_status: p.v.status!,
            public_comment: p.v.publicComment ?? null,
            internal_note: p.v.internalNote ?? null,
          },
        })
      )
    );
    await qc.invalidateQueries();
  };

  const onSendRework = async () => {
    await onSaveDraft();
    await reworkMut.mutateAsync({ assessmentId });
    await qc.invalidateQueries();
  };

  const onFinalize = async () => {
    await onSaveDraft();
    await finalizeMut.mutateAsync({ assessmentId });
    await qc.invalidateQueries();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-sm shadow-md border border-black/5">
          <LeftSubmissionView assessment={assessment} />
        </div>
        <div className="rounded-sm shadow-md border border-black/5">
          <RightAssessorPanel assessment={assessment} form={form} setField={(id, field, value) => {
            setForm((prev) => ({
              ...prev,
              [id]: {
                ...prev[id],
                [field]: value,
              },
            }));
          }} />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-black/5 bg-card/80 backdrop-blur">
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="absolute inset-x-0 -top-[3px] h-[3px] bg-black/5">
            <div
              className="h-full bg-[var(--cityscape-yellow)] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">Indicators Reviewed: {reviewed}/{total}</div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="default"
              type="button"
              onClick={onSaveDraft}
              disabled={!dirty || validateMut.isPending}
              className="w-full sm:w-auto"
            >
              Save as Draft
            </Button>
            <Button
              variant="secondary"
              size="default"
              type="button"
              onClick={onSendRework}
              disabled={!allReviewed || reworkCount > 0 || reworkMut.isPending}
              className="w-full sm:w-auto text-[var(--cityscape-accent-foreground)] hover:opacity-90"
              style={{ background: 'var(--cityscape-yellow)' }}
            >
              Compile and Send for Rework
            </Button>
            <Button
              size="default"
              type="button"
              onClick={onFinalize}
              disabled={!allReviewed || anyFail || finalizeMut.isPending}
              className="w-full sm:w-auto text-white hover:opacity-90"
              style={{ background: 'var(--success)' }}
            >
              Finalize Validation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


