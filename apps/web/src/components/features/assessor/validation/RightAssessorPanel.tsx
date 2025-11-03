"use client";

import * as React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AssessmentDetailsResponse } from '@vantage/shared';
import { usePostAssessorAssessmentResponsesResponseIdMovsUpload } from '@vantage/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface RightAssessorPanelProps {
  assessment: AssessmentDetailsResponse;
  form: Record<number, { status?: LocalStatus; publicComment?: string; internalNote?: string }>;
  setField: (responseId: number, field: 'status' | 'publicComment' | 'internalNote', value: string) => void;
}

type AnyRecord = Record<string, any>;

type LocalStatus = 'Pass' | 'Fail' | 'Conditional' | undefined;

export function RightAssessorPanel({ assessment, form, setField }: RightAssessorPanelProps) {
  const data: AnyRecord = (assessment as unknown as AnyRecord) ?? {};
  const core = (data.assessment as AnyRecord) ?? data;
  const responses: AnyRecord[] = (core.responses as AnyRecord[]) ?? [];

  const uploadMovMutation = usePostAssessorAssessmentResponsesResponseIdMovsUpload();

  // Zod schema: require publicComment when status is Fail/Conditional
  const ResponseSchema = z
    .object({
      status: z.enum(['Pass', 'Fail', 'Conditional']).optional(),
      publicComment: z.string().optional(),
      internalNote: z.string().optional(),
    })
    .refine(
      (val) => {
        if (!val.status) return true;
        if (val.status === 'Fail' || val.status === 'Conditional') {
          return !!val.publicComment && val.publicComment.trim().length > 0;
        }
        return true;
      },
      {
        message: 'Required for Fail or Conditional',
        path: ['publicComment'],
      }
    );

  const ResponsesSchema = z.record(z.string(), ResponseSchema);

  type ResponsesForm = z.infer<typeof ResponsesSchema>;

  const defaultValues: ResponsesForm = React.useMemo(() => {
    const obj: AnyRecord = {};
    for (const r of responses) {
      const key = String(r.id);
      obj[key] = {
        status: form[r.id]?.status,
        publicComment: form[r.id]?.publicComment,
        internalNote: form[r.id]?.internalNote,
      };
    }
    return obj as ResponsesForm;
  }, [responses, form]);

  const { control, register, formState } = useForm<ResponsesForm>({
    resolver: zodResolver(ResponsesSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Sync RHF state upward so footer logic remains accurate
  const watched = useWatch({ control });
  React.useEffect(() => {
    Object.entries(watched || {}).forEach(([key, v]) => {
      const id = Number(key);
      if (!Number.isFinite(id)) return;
      const val = v as { status?: LocalStatus; publicComment?: string; internalNote?: string };
      if (val.status !== form[id]?.status) setField(id, 'status', String(val.status || ''));
      if (val.publicComment !== form[id]?.publicComment) setField(id, 'publicComment', val.publicComment || '');
      if (val.internalNote !== form[id]?.internalNote) setField(id, 'internalNote', val.internalNote || '');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched]);

  const handleUpload = async (responseId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMovMutation.mutateAsync({
        responseId,
        data: { file, filename: file.name },
      });
      // In a later step we'll refetch and show newly uploaded MOVs on the left
    } catch {
      // Ignore for now; footer flow will handle toasts later
    }
  };

  return (
    <div className="p-4">
      <div className="text-sm text-muted-foreground mb-3">Assessor Controls</div>
      <div className="space-y-4">
        {responses.length === 0 ? (
          <div className="text-sm text-muted-foreground">No indicators found.</div>
        ) : (
          responses.map((r, idx) => {
            const indicator = (r.indicator as AnyRecord) ?? {};
            const indicatorLabel = indicator?.name || `Indicator #${r.indicator_id ?? idx + 1}`;
            const techNotes = indicator?.technical_notes || indicator?.notes || null;
            const key = String(r.id);
            const errorsFor = (formState.errors as AnyRecord)?.[key]?.publicComment;

            return (
              <div key={r.id ?? idx} className="rounded-sm bg-card shadow-md border border-black/5 overflow-hidden">
                <div className="px-3 py-2 border-b text-sm font-medium rounded-t-sm"
                  style={{ background: 'var(--cityscape-yellow)', color: 'var(--cityscape-accent-foreground)' }}>
                  {indicatorLabel}
                </div>
                <div className="p-3 space-y-4">
                  {techNotes ? (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded-sm p-2">
                      <div className="font-medium mb-1">Technical Notes</div>
                      <div className="whitespace-pre-wrap">{String(techNotes)}</div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Validation Status</div>
                    <div className="flex items-center gap-2">
                      {(['Pass', 'Fail', 'Conditional'] as LocalStatus[]).map((s) => {
                        const active = form[r.id]?.status === s;
                        return (
                          <Button
                            key={s}
                            type="button"
                            variant={active ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setField(r.id, 'status', s as string)}
                          >
                            {s}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Assessor's Findings (Visible to BLGU)</div>
                    <Textarea
                      {...register(`${key}.publicComment` as const)}
                      placeholder="Provide clear, actionable feedback for BLGU to address for rework."
                      className={errorsFor ? 'border-red-500' : undefined}
                    />
                    {errorsFor ? (
                      <div className="text-xs text-red-600">{String(errorsFor.message || 'Required for Fail or Conditional')}</div>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Internal Notes (DILG-only)</div>
                    <Textarea
                      {...register(`${key}.internalNote` as const)}
                      placeholder="Internal notes for DILG only"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Upload "Pahabol" Documents (by Assessor)</div>
                    <Input type="file" onChange={(e) => handleUpload(r.id, e)} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


