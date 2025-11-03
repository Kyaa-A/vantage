"use client";

import * as React from 'react';
import type { AssessmentDetailsResponse } from '@vantage/shared';
import { resolveMovUrl } from '@/lib/utils';
import { getSignedUrl } from '@/lib/uploadMov';

interface LeftSubmissionViewProps {
  assessment: AssessmentDetailsResponse;
  expandedId?: number | null;
  onToggle?: (responseId: number) => void;
}

type AnyRecord = Record<string, any>;

export function LeftSubmissionView({ assessment, expandedId, onToggle }: LeftSubmissionViewProps) {
  // Clicking a MOV opens it in a new tab; no modal state needed

  const data: AnyRecord = (assessment as unknown as AnyRecord) ?? {};
  const core = (data.assessment as AnyRecord) ?? data;
  const responses: AnyRecord[] = (core.responses as AnyRecord[]) ?? [];

  const openMovInNewTab = async (mov: AnyRecord) => {
    const key: string | null = mov?.storage_path || mov?.url || null;
    if (!key) return;
    try {
      const signed = await getSignedUrl(key, 300);
      if (signed) {
        window.open(signed, '_blank', 'noopener');
        return;
      }
    } catch {
      // fall through
    }
    const fallback = resolveMovUrl(key) || key;
    window.open(fallback, '_blank', 'noopener');
  };

  const formatPrimitive = (val: unknown): string => {
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return val.toLocaleString();
    return String(val);
  };

  const humanizeKey = (key: string): string => {
    try {
      const spaced = key.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      return spaced
        .toLowerCase()
        .split(' ')
        .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
    } catch {
      return key;
    }
  };

  const renderValue = (val: unknown, depth = 0): React.ReactNode => {
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-muted-foreground">None</span>;
      return (
        <ul className="list-disc pl-5 space-y-1">
          {val.map((item, i) => (
            <li key={i}>{typeof item === 'object' ? renderValue(item, depth + 1) : formatPrimitive(item)}</li>
          ))}
        </ul>
      );
    }
    if (val && typeof val === 'object') {
      const entries = Object.entries(val as Record<string, unknown>);
      if (entries.length === 0) return <span className="text-muted-foreground">Empty</span>;
      return (
        <dl className="grid grid-cols-1 gap-y-2">
          {entries.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[240px_1fr] items-start gap-4">
              <dt className="text-[12px] font-medium tracking-wide text-muted-foreground break-words">{humanizeKey(k)}</dt>
              <dd className="text-[13px] leading-5 break-words">{renderValue(v, depth + 1)}</dd>
            </div>
          ))}
        </dl>
      );
    }
    if (typeof val === 'boolean') {
      return (
        <span
          className={val ? 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white' : 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white'}
          style={{ background: val ? 'var(--success)' : 'var(--destructive, #ef4444)' }}
        >
          {formatPrimitive(val)}
        </span>
      );
    }
    return <span>{formatPrimitive(val)}</span>;
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
            const isOpen = expandedId == null ? true : expandedId === r.id;

            return (
              <div key={r.id ?? idx} className="rounded-sm bg-card shadow-md border border-black/5 overflow-hidden" data-left-item-id={r.id}>
                <button type="button" onClick={() => onToggle?.(r.id)} className="w-full text-left">
                <div className="px-3 py-3 text-lg font-semibold rounded-t-sm flex items-center justify-between gap-2"
                  style={{ background: 'var(--cityscape-yellow)', color: 'var(--cityscape-accent-foreground)' }}>
                  <span>{indicatorLabel}</span>
                  <span className="text-xs bg-white/70 text-black rounded px-2 py-0.5">{movs.length} MOV file{movs.length === 1 ? '' : 's'}</span>
                </div>
                </button>
                {isOpen ? (
                <div className="p-3 text-sm">
                  <div className="mb-2">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">BLGU Answer</div>
                    <div className="text-[13px] leading-5 bg-muted/30 rounded p-2">
                      {renderValue(blguAnswer)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Uploaded MOVs</div>
                    {movs.length === 0 ? (
                      <div className="text-muted-foreground">None</div>
                    ) : (
                      <ul className="pl-0 space-y-2">
                        {movs.map((m, mi) => {
                          const name = m.original_filename || m.filename || 'MOV';
                          const ext = typeof name === 'string' && name.includes('.') ? name.split('.').pop()?.toUpperCase() : '';
                          return (
                            <li key={m.id ?? mi} className="list-none">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-black/10 bg-white text-foreground shadow-sm hover:bg-black/5"
                                onClick={() => openMovInNewTab(m)}
                                title={name}
                              >
                                <span className="truncate max-w-[220px] text-sm">{name}</span>
                                {ext ? (
                                  <span className="text-[10px] uppercase rounded px-1.5 py-0.5 bg-muted/60 text-muted-foreground border border-black/10">
                                    {ext}
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* MOVs are opened in a new tab; no inline preview here. */}
    </div>
  );
}


