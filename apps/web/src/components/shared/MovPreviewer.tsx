"use client";

import * as React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MovPreviewItem {
  title?: string;
  url?: string | null;
}

interface MovPreviewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  url?: string | null;
  items?: MovPreviewItem[];
  startIndex?: number;
}

export function MovPreviewer({ open, onOpenChange, title, url, items, startIndex }: MovPreviewerProps) {
  const hasGallery = Array.isArray(items) && (items?.length || 0) > 0;
  const [index, setIndex] = React.useState<number>(startIndex ?? 0);

  React.useEffect(() => {
    if (typeof startIndex === 'number') setIndex(startIndex);
  }, [startIndex, open]);

  const active = hasGallery ? (items as MovPreviewItem[])[index] : { title, url };
  const activeUrl = active?.url || null;
  const activeTitle = active?.title || title;

  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const token = useAuthStore((s) => s.token);

  React.useEffect(() => {
    setBlobUrl(null);
    let revoke: string | null = null;
    const fetchBlob = async () => {
      if (!activeUrl) return;
      try {
        const res = await fetch(activeUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return; // fallback to direct url
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        revoke = url;
        setBlobUrl(url);
      } catch {
        // ignore and fallback
      }
    };
    fetchBlob();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [activeUrl, token]);

  const previewUrl = blobUrl || activeUrl;

  const isPdf = typeof previewUrl === 'string' && previewUrl.toLowerCase().endsWith('.pdf');
  const isImage = typeof previewUrl === 'string' && /(png|jpe?g|gif|webp|svg)$/i.test(previewUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm font-medium truncate">{activeTitle || 'MOV Preview'}</div>
          {hasGallery ? (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                className="px-2 py-1 rounded border border-black/10 hover:bg-black/5"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index <= 0}
              >
                Prev
              </button>
              <div>
                {index + 1} / {items!.length}
              </div>
              <button
                type="button"
                className="px-2 py-1 rounded border border-black/10 hover:bg-black/5"
                onClick={() => setIndex((i) => Math.min(items!.length - 1, i + 1))}
                disabled={index >= items!.length - 1}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
        {!previewUrl ? (
          <div className="text-sm text-muted-foreground">No preview available.</div>
        ) : isPdf ? (
          <div className="h-[70vh] w-full">
            <embed src={previewUrl} type="application/pdf" className="h-full w-full" />
            <div className="mt-2 text-xs">
              Having trouble loading the preview? 
              <a className="underline ml-1" href={previewUrl} target="_blank" rel="noreferrer">Open in new tab</a>
            </div>
          </div>
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={activeTitle || 'MOV'} className="max-h-[70vh] w-auto" />
        ) : (
          <div className="text-sm">
            <a className="text-blue-600 underline" href={previewUrl} target="_blank" rel="noreferrer">
              Open file
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


