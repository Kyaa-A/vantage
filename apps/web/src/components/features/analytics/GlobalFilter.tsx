"use client";

import { AssessorData } from "./AssessorAnalyticsTypes";

interface GlobalFilterProps {
  data: AssessorData;
}

export function GlobalFilter({ data }: GlobalFilterProps) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-sm border border-purple-200 dark:border-purple-600 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
            Assessment Period
          </h3>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {data.assessmentPeriod}
          </p>
        </div>
        <div className="relative">
          <select className="appearance-none bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-600 rounded-sm px-4 py-3 pr-10 text-purple-900 dark:text-purple-100 font-medium shadow-sm hover:border-purple-400 dark:hover:border-purple-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all duration-200">
            <option>SGLGB 2024</option>
            <option>SGLGB 2023</option>
            <option>SGLGB 2022</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 