"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface IndicatorNavigationFooterProps {
  currentCode?: string;
  currentPosition: number;
  totalIndicators: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLocked?: boolean;
}

/**
 * Sticky footer with next/previous navigation controls for indicators
 * Includes keyboard shortcuts (Alt+Left/Right) and responsive design
 */
export function IndicatorNavigationFooter({
  currentCode,
  currentPosition,
  totalIndicators,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  isLocked = false,
}: IndicatorNavigationFooterProps) {
  // Keyboard shortcuts: Alt+Left (previous), Alt+Right (next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+Left Arrow - Previous
      if (e.altKey && e.key === "ArrowLeft" && hasPrevious) {
        e.preventDefault();
        onPrevious();
      }
      // Alt+Right Arrow - Next
      if (e.altKey && e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrevious, hasNext, onPrevious, onNext]);

  // Don't render if no indicators
  if (totalIndicators === 0) return null;

  return (
    <div
      className={cn(
        "sticky bottom-0 left-0 right-0 z-10",
        "border-t border-[var(--border)]",
        "bg-[var(--card)]/80 backdrop-blur-md",
        "shadow-lg"
      )}
      style={{ height: "64px" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="default"
          onClick={onPrevious}
          disabled={!hasPrevious || isLocked}
          className={cn(
            "gap-2 transition-all duration-200",
            "hover:bg-[var(--hover)]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          aria-label="Previous indicator (Alt+Left)"
          title="Previous indicator (Alt+Left)"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Center Label: Code + Position */}
        <div className="flex items-center justify-center gap-2 flex-1 min-w-0">
          <div className="text-center">
            {currentCode && (
              <span className="font-mono font-semibold text-sm text-[var(--foreground)]">
                {currentCode}
              </span>
            )}
            <div className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
              {/* Desktop: Full label */}
              <span className="hidden sm:inline">
                {currentPosition} of {totalIndicators} indicators
              </span>
              {/* Mobile: Abbreviated */}
              <span className="sm:hidden">
                {currentPosition}/{totalIndicators}
              </span>
            </div>
          </div>
        </div>

        {/* Next Button */}
        <Button
          size="default"
          onClick={onNext}
          disabled={!hasNext || isLocked}
          className={cn(
            "gap-2 transition-all duration-200",
            "bg-[var(--cityscape-yellow)] text-[var(--foreground)]",
            "hover:bg-[var(--cityscape-yellow)]/90",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          aria-label="Next indicator (Alt+Right)"
          title="Next indicator (Alt+Right)"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
