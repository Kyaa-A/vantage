'use client';

import { useState } from 'react';
import { useFormBuilderStore } from '@/store/useFormBuilderStore';

/**
 * FormSchemaBuilder - Visual form builder for creating indicator form schemas
 *
 * This component provides a drag-and-drop interface for MLGOO users to build
 * dynamic form schemas with 7 different field types.
 *
 * Layout:
 * - Left: Field Palette (drag source for field types)
 * - Center: Canvas (drop zone and field ordering)
 * - Right: Field Properties Panel (configure selected field)
 *
 * Features:
 * - Drag-and-drop field creation and reordering
 * - Real-time field configuration
 * - Live preview mode
 * - JSON export
 * - Validation before save
 */
export function FormSchemaBuilder() {
  const { fields, selectedFieldId, isDirty } = useFormBuilderStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPropertiesPanelCollapsed, setIsPropertiesPanelCollapsed] = useState(false);

  return (
    <div className="flex h-full min-h-[600px] w-full">
      {/* Left Sidebar - Field Palette */}
      <aside
        className={`
          border-r border-gray-200 bg-gray-50 transition-all duration-300
          ${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'}
        `}
      >
        <div className="h-full p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Field Types</h3>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Collapse sidebar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* FieldPalette will be inserted here in task 2.3.3 */}
          <div className="space-y-2">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
              Field Palette
              <br />
              (Component in task 2.3.3)
            </div>
          </div>
        </div>
      </aside>

      {/* Expand button when sidebar is collapsed */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="flex h-full w-8 items-center justify-center border-r border-gray-200 bg-gray-50 hover:bg-gray-100"
          aria-label="Expand sidebar"
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Center - Canvas (Drop Zone) */}
      <main className="flex-1 overflow-auto bg-white">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Form Builder</h2>
              <p className="mt-1 text-sm text-gray-500">
                Drag fields from the palette to build your form
              </p>
            </div>

            {/* Dirty indicator */}
            {isDirty && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                <svg
                  className="-ml-0.5 mr-1.5 h-2 w-2 fill-yellow-400"
                  viewBox="0 0 8 8"
                >
                  <circle cx={4} cy={4} r={3} />
                </svg>
                Unsaved changes
              </span>
            )}
          </div>

          {/* Canvas content */}
          {fields.length === 0 ? (
            // Empty state
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No fields yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Drag field types from the left palette to get started
                </p>
              </div>
            </div>
          ) : (
            // Fields list
            <div className="space-y-3">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                Canvas Drop Zone
                <br />
                {fields.length} field(s) added
                <br />
                (Drag-and-drop in task 2.3.4)
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Field Properties Panel */}
      <aside
        className={`
          border-l border-gray-200 bg-gray-50 transition-all duration-300
          ${isPropertiesPanelCollapsed ? 'w-0 overflow-hidden' : 'w-80'}
        `}
      >
        <div className="h-full p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Field Properties</h3>
            <button
              onClick={() => setIsPropertiesPanelCollapsed(true)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Collapse properties panel"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Properties panel content */}
          {selectedFieldId ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">
                  Selected field: <span className="font-medium">{selectedFieldId}</span>
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  (Properties panel in Story 2.4)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <svg
                  className="mx-auto h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Select a field to edit</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Expand button when properties panel is collapsed */}
      {isPropertiesPanelCollapsed && (
        <button
          onClick={() => setIsPropertiesPanelCollapsed(false)}
          className="flex h-full w-8 items-center justify-center border-l border-gray-200 bg-gray-50 hover:bg-gray-100"
          aria-label="Expand properties panel"
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
