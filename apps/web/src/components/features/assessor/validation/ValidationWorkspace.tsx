"use client";

import type { AssessmentDetailsResponse } from '@vantage/shared';
import { LeftSubmissionView } from './LeftSubmissionView';
import { RightAssessorPanel } from './RightAssessorPanel';
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePostAssessorAssessmentResponsesResponseIdValidate,
  usePostAssessorAssessmentsAssessmentIdRework,
  usePostAssessorAssessmentsAssessmentIdFinalize,
} from '@vantage/shared';

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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-md border">
          <LeftSubmissionView assessment={assessment} />
        </div>
        <div className="rounded-md border">
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

      <div className="sticky bottom-0 z-10 border-t bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center gap-3 justify-between">
          <div className="text-xs text-muted-foreground">Indicators Reviewed: {reviewed}/{total}</div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              type="button"
              onClick={onSaveDraft}
              disabled={!dirty || validateMut.isPending}
            >
              Save as Draft
            </button>
            <button
              className="inline-flex items-center rounded-md bg-orange-500 text-white px-4 py-2 text-sm disabled:opacity-50"
              type="button"
              onClick={onSendRework}
              disabled={!allReviewed || reworkCount > 0 || reworkMut.isPending}
            >
              Compile and Send for Rework
            </button>
            <button
              className="inline-flex items-center rounded-md bg-green-600 text-white px-4 py-2 text-sm disabled:opacity-50"
              type="button"
              onClick={onFinalize}
              disabled={!allReviewed || anyFail || finalizeMut.isPending}
            >
              Finalize Validation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


