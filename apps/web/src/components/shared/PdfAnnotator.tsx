"use client";

import * as React from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { highlightPlugin, MessageIcon, RenderHighlightContentProps, RenderHighlightTargetProps, RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

interface PdfRect {
  x: number; y: number; w: number; h: number;
}

export interface PdfAnnotationItem {
  id: string;
  type: 'pdfRect';
  page: number;
  rect: PdfRect;
  comment: string;
  createdAt: string;
}

interface PdfAnnotatorProps {
  url: string;
  annotateEnabled: boolean;
  annotations: PdfAnnotationItem[];
  onAdd: (annotation: PdfAnnotationItem) => void;
  onDelete?: (id: string) => void;
}

export default function PdfAnnotator({ url, annotateEnabled, annotations, onAdd }: PdfAnnotatorProps) {
  // The highlight plugin provides selection -> trigger UI -> save data
  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget: (props: RenderHighlightTargetProps) => {
      if (!annotateEnabled) return null;
      const baseStyle = props.getCssProperties ? props.getCssProperties(props.selectionRegion) : {
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top}%`,
        width: `${props.selectionRegion.width}%`,
        height: `${props.selectionRegion.height}%`,
      };
      return (
        <div
          style={{
            position: 'absolute',
            ...baseStyle,
            transform: 'translateY(-120%)',
            width: 'auto',
            height: 'auto',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            className="rounded bg-black/80 text-white text-xs px-2 py-1 cursor-pointer shadow"
            onClick={() => {
            const comment = window.prompt('Add a comment for this highlight (optional):', '') || '';
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            onAdd({
              id,
              type: 'pdfRect',
              page: props.selectedText?.pageIndex ?? props.pageIndex,
              rect: { x: props.selectionRegion.left, y: props.selectionRegion.top, w: props.selectionRegion.width, h: props.selectionRegion.height },
              comment,
              createdAt: new Date().toISOString(),
            });
              // Clear selection if API provides a cancel function
              const anyProps: any = props as any;
              if (typeof props.onCancel === 'function') props.onCancel();
              else if (typeof anyProps.cancel === 'function') anyProps.cancel();
            }}
          >
            Add comment
          </button>
        </div>
      );
    },
    renderHighlightContent: (_props: RenderHighlightContentProps) => null,
    renderHighlights: (props: RenderHighlightsProps) => {
      const pageAnns = annotations.filter((a) => a.page === props.pageIndex);
      return (
        <>
          {pageAnns.map((a, idx) => (
            <div key={a.id} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 20 }}>
              {(() => {
                const rectCss = props.getCssProperties
                  ? props.getCssProperties({ left: a.rect.x, top: a.rect.y, width: a.rect.w, height: a.rect.h })
                  : { left: `${a.rect.x}%`, top: `${a.rect.y}%`, width: `${a.rect.w}%`, height: `${a.rect.h}%` };
                const badgeCss = props.getCssProperties
                  ? props.getCssProperties({ left: a.rect.x, top: a.rect.y, width: 0, height: 0 })
                  : { left: `${a.rect.x}%`, top: `${a.rect.y}%` };
                return (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        ...rectCss,
                        backgroundColor: 'rgba(250, 204, 21, 0.35)',
                        border: '2px solid rgb(250, 204, 21)',
                        pointerEvents: 'none',
                        zIndex: 5,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        ...badgeCss,
                        transform: 'translate(-8px, -18px)',
                        fontSize: 10,
                        background: 'rgb(250, 204, 21)',
                        color: '#000',
                        borderRadius: 4,
                        padding: '2px 4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        pointerEvents: 'none',
                        zIndex: 6,
                      }}
                    >
                {idx + 1}
                    </div>
                    {a.comment ? (
                      <div
                        style={{
                          position: 'absolute',
                          ...rectCss,
                          transform: 'translate(0, calc(100% + 4px))',
                          maxWidth: '70%',
                          background: 'rgba(254, 243, 199, 0.95)',
                          color: '#111',
                          fontSize: 11,
                          borderRadius: 4,
                          padding: '2px 6px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          pointerEvents: 'none',
                          zIndex: 6,
                        }}
                      >
                        {a.comment}
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          ))}
        </>
      );
    },
  });

  return (
    <div className="h-[70vh] w-full border border-black/10 rounded bg-white overflow-hidden">
      <Worker workerUrl="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer
          fileUrl={url}
          defaultScale={SpecialZoomLevel.PageWidth}
          plugins={[highlightPluginInstance]}
        />
      </Worker>
      <div className="mt-2 text-xs text-muted-foreground px-1.5">
        Tip: Select text to add a highlight with a comment.
      </div>
    </div>
  );
}


