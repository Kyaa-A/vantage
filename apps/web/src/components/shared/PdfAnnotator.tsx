"use client";

import { SpecialZoomLevel, Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { highlightPlugin, RenderHighlightContentProps, RenderHighlightsProps, RenderHighlightTargetProps } from '@react-pdf-viewer/highlight';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import * as React from 'react';

interface PdfRect {
  x: number; y: number; w: number; h: number;
}

export interface PdfAnnotationItem {
  id: string;
  type: 'pdfRect';
  page: number;
  rect: PdfRect; // primary rect (first rect for multi-line selection)
  rects?: PdfRect[]; // optional multi-line rects from selection
  comment: string;
  createdAt: string;
}

interface PdfAnnotatorProps {
  url: string;
  annotateEnabled: boolean;
  annotations: PdfAnnotationItem[];
  onAdd: (annotation: PdfAnnotationItem) => void;
  onDelete?: (id: string) => void;
  focusAnnotationId?: string;
}

export default function PdfAnnotator({ url, annotateEnabled, annotations, onAdd, focusAnnotationId }: PdfAnnotatorProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
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
            // Prefer the page index provided by the renderer for this selection; fall back safely
            const resolvedPageIndex =
              typeof (props as any).pageIndex === 'number'
                ? (props as any).pageIndex
                : (props as any).selectedText?.pageIndex ?? (props as any).selectionRegion?.pageIndex ?? (props as any).page?.index ?? 0;
            // Capture multi-line rects if provided by the plugin
            const rawRects: any[] = (props as any)?.selectedText?.position?.rects || [];
            const rects: PdfRect[] = Array.isArray(rawRects)
              ? rawRects.map((r: any) => ({ x: r.left, y: r.top, w: r.width, h: r.height }))
              : [];
            const primaryRect: PdfRect = rects.length > 0
              ? rects[0]
              : { x: props.selectionRegion.left, y: props.selectionRegion.top, w: props.selectionRegion.width, h: props.selectionRegion.height };
            onAdd({
              id,
              type: 'pdfRect',
              page: resolvedPageIndex,
              rect: primaryRect,
              rects: rects.length > 0 ? rects : undefined,
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
            <div key={a.id} data-ann-id={a.id} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 100 }}>
              {(() => {
                const sourceRects = Array.isArray(a.rects) && a.rects.length > 0 ? a.rects : [a.rect];
                const first = sourceRects[0];
                const rectCssFrom = (r: PdfRect) => (
                  props.getCssProperties
                    ? props.getCssProperties({ left: r.x, top: r.y, width: r.w, height: r.h })
                    : { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }
                );
                const badgeCss = props.getCssProperties
                  ? props.getCssProperties({ left: first.x, top: first.y, width: 0, height: 0 })
                  : { left: `${first.x}%`, top: `${first.y}%` };
                return (
                  <>
                    {sourceRects.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          ...rectCssFrom(r),
                          backgroundColor: 'rgba(250, 204, 21, 0.35)',
                          border: '2px solid rgb(250, 204, 21)',
                          pointerEvents: 'none',
                          zIndex: 110,
                        }}
                      />
                    ))}
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
                        zIndex: 110,
                      }}
                    >
                {idx + 1}
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
        </>
      );
    },
  });

  // Scroll to a specific annotation id when requested
  React.useEffect(() => {
    if (!focusAnnotationId) return;
    const root = containerRef.current;
    if (!root) return;
    // Determine the page of the target annotation
    const target = annotations.find((a) => a.id === focusAnnotationId);
    const pageIndex = typeof target?.page === 'number' ? target!.page : 0;
    // pdf.js uses data-page-number (1-based)
    const pageEl = root.querySelector(`div[data-page-number="${pageIndex + 1}"]`) as HTMLElement | null;
    if (pageEl && typeof pageEl.scrollIntoView === 'function') {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // After the page is centered, locate the exact highlight overlay and outline it
      window.setTimeout(() => {
        const el = root.querySelector(`[data-ann-id="${CSS.escape(focusAnnotationId)}"]`) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try {
            const rect = el.firstElementChild as HTMLElement | null;
            if (rect) {
              rect.style.outline = '2px solid #2563eb';
              rect.style.outlineOffset = '2px';
              window.setTimeout(() => {
                rect.style.outline = 'none';
              }, 1200);
            }
          } catch {}
        }
      }, 150);
    }
  }, [focusAnnotationId, annotations]);

  return (
    <div ref={containerRef} className="h-[70vh] w-full border border-black/10 rounded bg-white overflow-hidden">
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


