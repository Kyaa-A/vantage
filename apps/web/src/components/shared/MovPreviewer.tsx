"use client";

import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MovPreviewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  url?: string | null;
}

export function MovPreviewer({ open, onOpenChange, title, url }: MovPreviewerProps) {
  const isPdf = typeof url === 'string' && url.toLowerCase().endsWith('.pdf');
  const isImage = typeof url === 'string' && /(png|jpe?g|gif|webp|svg)$/i.test(url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <div className="mb-2 text-sm font-medium">{title || 'MOV Preview'}</div>
        {!url ? (
          <div className="text-sm text-muted-foreground">No preview available.</div>
        ) : isPdf ? (
          <object data={url} type="application/pdf" className="h-[70vh] w-full" />
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={title || 'MOV'} className="max-h-[70vh] w-auto" />
        ) : (
          <div className="text-sm">
            <a className="text-blue-600 underline" href={url} target="_blank" rel="noreferrer">
              Open file
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


