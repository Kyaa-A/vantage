"use client";

import * as React from 'react';
import type { AssessmentDetailsResponse } from '@vantage/shared';
import { MovPreviewer } from '@/components/shared/MovPreviewer';

interface LeftSubmissionViewProps {
  assessment: AssessmentDetailsResponse;
}

type AnyRecord = Record<string, any>;

export function LeftSubmissionView({ assessment }: LeftSubmissionViewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = React.useState<string | undefined>();
  const [open, setOpen] = React.useState(false);

  const data: AnyRecord = (assessment as unknown as AnyRecord) ?? {};
  const core = (data.assessment as AnyRecord) ?? data;
  const responses: AnyRecord[] = (core.responses as AnyRecord[]) ?? [];

  const handleOpenMov = (mov: AnyRecord) => {
    const url: string | null = mov?.storage_path || mov?.url || null;
    setPreviewUrl(url);
    setPreviewTitle(mov?.original_filename || mov?.filename || 'MOV');
    setOpen(true);
  };

  return (
    <div className="p-4">
      <div className="text-sm text-muted-foreground mb-3">BLGU Submission</div>
      <div className="space-y-4">
        {responses.length === 0 ? (
          <div className="text-sm text-muted-foreground">No submitted responses.</div>
        ) : (
          responses.map((r, idx) => {
            const indicator = (r.indicator as AnyRecord) ?? {};
            const indicatorLabel = indicator?.name || `Indicator #${r.indicator_id ?? idx + 1}`;
            const blguAnswer = r.response_data ?? r.answer ?? null;
            const movs: AnyRecord[] = (r.movs as AnyRecord[]) ?? [];

            return (
              <div key={r.id ?? idx} className="rounded-sm bg-card shadow-md border border-black/5 overflow-hidden">
                <div className="px-3 py-2 border-b text-sm font-medium rounded-t-sm"
                  style={{ background: 'var(--cityscape-yellow)', color: 'var(--cityscape-accent-foreground)' }}>
                  {indicatorLabel}
                </div>
                <div className="p-3 text-sm">
                  <div className="mb-2">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">BLGU Answer</div>
                    <pre className="whitespace-pre-wrap break-words text-[13px] leading-5 bg-muted/30 rounded p-2">
{JSON.stringify(blguAnswer, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Uploaded MOVs</div>
                    {movs.length === 0 ? (
                      <div className="text-muted-foreground">None</div>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {movs.map((m, mi) => (
                          <li key={m.id ?? mi}>
                            <button
                              type="button"
                              className="text-primary underline hover:opacity-80"
                              onClick={() => handleOpenMov(m)}
                            >
                              {m.original_filename || m.filename || 'MOV'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MovPreviewer open={open} onOpenChange={setOpen} title={previewTitle} url={previewUrl} />
    </div>
  );
}


