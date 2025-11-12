"use client";

import { Assessment } from "@/types/assessment";
import { useEffect, useState } from "react";
import { AssessmentTreeNode } from "./AssessmentTreeNode";
import { TreeHeader } from "./TreeHeader";
import {
  calculateAreaProgress,
  getAllLeafIndicators,
  loadExpandedState,
  saveExpandedState,
  getInitialExpandedAreas,
} from "./tree-utils";

interface TreeNavigatorProps {
  assessment: Assessment;
  selectedIndicatorId: string | null;
  onIndicatorSelect: (indicatorId: string) => void;
}

export function TreeNavigator({
  assessment,
  selectedIndicatorId,
  onIndicatorSelect,
}: TreeNavigatorProps) {
  // Load expanded state from sessionStorage or auto-expand first incomplete
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(() => {
    const stored = loadExpandedState(assessment.id);
    return stored.size > 0 ? stored : getInitialExpandedAreas(assessment);
  });

  // Save expanded state when it changes
  useEffect(() => {
    saveExpandedState(assessment.id, expandedAreas);
  }, [expandedAreas, assessment.id]);

  const toggleArea = (areaId: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const handleIndicatorClick = (indicatorId: string) => {
    onIndicatorSelect(indicatorId);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      // TODO: Implement arrow key navigation
    }
  };

  return (
    <div
      role="tree"
      aria-label="Assessment navigation"
      className="h-full flex flex-col bg-[var(--card)] border-r border-[var(--border)]"
      onKeyDown={handleKeyDown}
    >
      {/* Sticky Header */}
      <TreeHeader
        completedIndicators={assessment.completedIndicators}
        totalIndicators={assessment.totalIndicators}
      />

      {/* Scrollable Tree Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border) transparent",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 8px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: var(--cityscape-yellow);
          }
        `}</style>

        {assessment.governanceAreas.map((area) => {
          const isExpanded = expandedAreas.has(area.id);
          const progress = calculateAreaProgress(area);
          const leafIndicators = getAllLeafIndicators(area.indicators);

          return (
            <div key={area.id}>
              {/* Area Node */}
              <AssessmentTreeNode
                type="area"
                item={area}
                isExpanded={isExpanded}
                onToggle={() => toggleArea(area.id)}
                progress={progress}
                level={0}
              />

              {/* Indicators (when expanded) */}
              {isExpanded && (
                <div>
                  {leafIndicators.map((indicator) => (
                    <AssessmentTreeNode
                      key={indicator.id}
                      type="indicator"
                      item={indicator}
                      isActive={selectedIndicatorId === indicator.id}
                      onClick={() => handleIndicatorClick(indicator.id)}
                      level={1}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
