import { Assessment } from "@/types/assessment";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AssessmentResponseUpdate,
  AssessmentStatus,
  MOVCreate,
  deleteAssessmentsMovs$MovId,
  postAssessmentsResponses$ResponseIdMovs,
  postAssessmentsSubmit,
  putAssessmentsResponses$ResponseId,
  useGetAssessmentsMyAssessment,
} from "@vantage/shared";
import { useEffect, useMemo, useState } from "react";
// Custom debounce implementation
function debounce<TArgs extends unknown[], TReturn>(
  func: (...args: TArgs) => TReturn,
  wait: number,
  options = { maxWait: undefined as number | undefined }
): ((...args: TArgs) => TReturn) & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined;
  let maxTimeoutId: NodeJS.Timeout | undefined;
  let lastCallTime: number | undefined;

  let lastArgs: TArgs | undefined;
  let result: TReturn;

  const debounced = ((...args: TArgs) => {
    const time = Date.now();
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!lastCallTime && options.maxWait) {
      maxTimeoutId = setTimeout(() => {
        if (lastArgs) {
          lastArgs = undefined;
          lastCallTime = time;
          result = func(...args);
        }
      }, options.maxWait);
    }

    timeoutId = setTimeout(() => {
      if (lastArgs) {
        lastArgs = undefined;
        lastCallTime = time;
        result = func(...args);
      }
    }, wait);

    return result;
  }) as ((...args: TArgs) => TReturn) & { cancel: () => void };

  debounced.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
    }
    lastArgs = undefined;
  };

  return debounced;
}

// Query keys for assessment data
const assessmentKeys = {
  all: ["assessment"] as const,
  current: () => [...assessmentKeys.all, "current"] as const,
  validation: () => [...assessmentKeys.all, "validation"] as const,
};

/**
 * Hook to fetch the current assessment data
 */
export function useCurrentAssessment() {
  const {
    data: assessmentData,
    isLoading,
    error,
    refetch,
  } = useGetAssessmentsMyAssessment();

  // Transform API response to match frontend expectations
  interface APIAssessment {
    assessment: {
      id: number;
      status: string;
      created_at: string;
      updated_at: string;
      submitted_at?: string;
    };
    governance_areas: Array<{
      id: number;
      name: string;
      area_type: string;
      indicators: Array<IndicatorNode>;
    }>;
  }

  interface IndicatorNode {
    id: number;
    name: string;
    description: string;
    response?: {
      id?: number;
      requires_rework?: boolean;
      response_data?: Record<string, unknown>;
    };
    movs?: Array<{
      id: string;
      name: string;
      size: number;
      url?: string;
      storage_path?: string;
    }>;
    feedback_comments?: Array<{
      comment: string;
    }>;
    children?: Array<IndicatorNode>;
  }

  const mapIndicatorTree = (areaId: number, indicator: IndicatorNode) => {
    const mapped = {
      id: indicator.id.toString(),
      // Preserve backend link to real DB indicator for synthetic children
      responseIndicatorId: (indicator as any).responseIndicatorId ?? (indicator as any).response_indicator_id,
      code: (() => {
        // Use the code from backend if it exists
        if ((indicator as any).code) {
          return (indicator as any).code;
        }
        // If the indicator name already has a code pattern, extract it
        const full = indicator.name.match(/^(\d+(?:\.\d+)+)/)?.[1];
        if (full) {
          return full;
        }
        // For indicators without codes, generate a simple one
        return `${areaId}.${indicator.id}`;
      })(),
      name: indicator.name,
      description: indicator.description,
      technicalNotes: "See form schema for requirements",
      governanceAreaId: areaId.toString(),
      status: indicator.response
        ? ("completed" as const)
        : ("not_started" as const),
      complianceAnswer:
        indicator.response?.response_data &&
        (indicator.response.response_data as any).has_budget_plan
          ? ("yes" as const)
          : ("no" as const),
      movFiles: (indicator.movs || []).map((m: any) => ({
        id: String(m.id),
        name: m.name ?? m.original_filename ?? m.filename,
        size: m.size ?? m.file_size,
        url: m.url ?? "",
        storagePath: m.storage_path,
      })),
      assessorComment: indicator.feedback_comments?.[0]?.comment,
      responseId: indicator.response?.id ?? null,
      requiresRework: indicator.response?.requires_rework === true,
      // Use form schema from backend, fallback to simple compliance if not available
      formSchema: indicator.form_schema || {
        properties: {
          compliance: {
            type: "string" as const,
            title: "Compliance",
            description: "Is this indicator compliant?",
            required: true,
            enum: ["yes", "no", "na"],
          },
        },
      },
      responseData: indicator.response?.response_data || {},
      children: (indicator.children || []).map((child) =>
        mapIndicatorTree(areaId, child)
      ),
    };
    return mapped;
  };

  const transformedData = assessmentData
    ? {
        id: (
          assessmentData as unknown as APIAssessment
        ).assessment.id.toString(),
        barangayId: "1", // TODO: Get from user context
        barangayName: "New Cebu", // TODO: Get from user context
        status: (assessmentData as unknown as APIAssessment).assessment.status
          .toLowerCase()
          .replace("_", "-") as AssessmentStatus,
        createdAt: (assessmentData as unknown as APIAssessment).assessment
          .created_at,
        updatedAt: (assessmentData as unknown as APIAssessment).assessment
          .updated_at,
        submittedAt: (assessmentData as unknown as APIAssessment).assessment
          .submitted_at,
        governanceAreas: (
          assessmentData as unknown as APIAssessment
        ).governance_areas.map((area) => ({
          id: area.id.toString(),
          name: area.name,
          code: area.name.substring(0, 2).toUpperCase(),
          description: `${area.name} governance area`,
          isCore: area.area_type === "Core",
          indicators: area.indicators
            .filter((i) => true) // top-level already from API
            .map((indicator) => mapIndicatorTree(area.id, indicator)),
        })),
        totalIndicators: (() => {
          const countTree = (nodes: IndicatorNode[] | undefined): number =>
            (nodes || []).reduce(
              (acc, n) => acc + 1 + countTree(n.children),
              0
            );
          return (
            assessmentData as unknown as APIAssessment
          ).governance_areas.reduce(
            (total, area) => total + countTree(area.indicators),
            0
          );
        })(),
        completedIndicators: (() => {
          const countCompleted = (nodes: IndicatorNode[] | undefined): number =>
            (nodes || []).reduce(
              (acc, n) =>
                acc + (n.response ? 1 : 0) + countCompleted(n.children),
              0
            );
          return (
            assessmentData as unknown as APIAssessment
          ).governance_areas.reduce(
            (total, area) => total + countCompleted(area.indicators),
            0
          );
        })(),
        needsReworkIndicators: (
          assessmentData as unknown as APIAssessment
        ).governance_areas.reduce((total, area) => {
          const countRework = (nodes: IndicatorNode[] | undefined): number =>
            (nodes || []).reduce(
              (acc, n) =>
                acc +
                ((n.feedback_comments || []).length > 0 ? 1 : 0) +
                countRework(n.children),
              0
            );
          return total + countRework(area.indicators);
        }, 0),
      }
    : null;

  // Keep a local editable copy so components can update progress immediately
  const [localAssessment, setLocalAssessment] = useState<Assessment | null>(
    transformedData as unknown as Assessment | null
  );

  // Sync when server data changes
  useEffect(() => {
    if (transformedData) {
      setLocalAssessment(transformedData as unknown as Assessment);
    }
  }, [JSON.stringify(transformedData)]);

  return {
    data: localAssessment,
    isLoading,
    error,
    refetch,
    updateAssessmentData: (updater: (data: Assessment) => Assessment) => {
      setLocalAssessment((prev) => (prev ? updater({ ...prev }) : prev));
    },
  };
}

/**
 * Hook to validate assessment completion
 */
export function useAssessmentValidation(assessment: Assessment | null) {
  return useMemo(() => {
    if (!assessment) {
      return {
        isComplete: false,
        missingIndicators: [],
        missingMOVs: [],
        canSubmit: false,
      };
    }

    const missingIndicators: string[] = [];
    const missingMOVs: string[] = [];

    // Check all indicators across all governance areas
    if (assessment.governanceAreas) {
      assessment.governanceAreas.forEach((area) => {
        if (area.indicators) {
          area.indicators.forEach((indicator) => {
            if (!indicator.complianceAnswer) {
              missingIndicators.push(`${indicator.code} - ${indicator.name}`);
            } else if (
              indicator.complianceAnswer === "yes" &&
              indicator.movFiles?.length === 0
            ) {
              missingMOVs.push(`${indicator.code} - ${indicator.name}`);
            }
          });
        }
      });
    }

    const isComplete =
      missingIndicators.length === 0 && missingMOVs.length === 0;
    const canSubmit =
      isComplete &&
      (assessment.status === "Draft" || assessment.status === "Needs Rework");

    return {
      isComplete,
      missingIndicators,
      missingMOVs,
      canSubmit,
    };
  }, [assessment]);
}

/**
 * Hook to update indicator compliance answer
 */
export function useUpdateIndicatorAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      responseId,
      data,
    }: {
      responseId: number;
      data: AssessmentResponseUpdate;
    }) => {
      return putAssessmentsResponses$ResponseId(responseId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.current() });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.validation() });
    },
  });
}

/**
 * Hook to upload MOV files
 */
export function useUploadMOV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      responseId,
      data,
    }: {
      responseId: number;
      data: MOVCreate;
    }) => {
      return postAssessmentsResponses$ResponseIdMovs(responseId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.current() });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.validation() });
    },
  });
}

/**
 * Hook to delete MOV files
 */
export function useDeleteMOV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ movId, storagePath }: { movId: number; storagePath?: string }) => {
      // Try deleting from Supabase first if we have a storage path
      if (storagePath) {
        try {
          const { deleteMovFile } = await import("@/lib/uploadMov");
          await deleteMovFile(storagePath);
        } catch (err) {
          // Continue with DB deletion even if storage deletion fails
          // eslint-disable-next-line no-console
          console.warn("Failed to delete file from storage:", err);
        }
      }
      // Remove DB record
      return deleteAssessmentsMovs$MovId(movId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.current() });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.validation() });
    },
  });
}

/**
 * Hook to submit assessment for review
 */
export function useSubmitAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return postAssessmentsSubmit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.current() });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.validation() });
    },
  });
}

/**
 * Hook to get indicator by ID
 */
export function useIndicator(indicatorId: string) {
  const { data: assessment } = useCurrentAssessment();

  return useMemo(() => {
    if (!assessment) return null;

    const findInTree = (nodes: any[]): any | null => {
      for (const n of nodes) {
        if (n.id === indicatorId) return n;
        const found = n.children && findInTree(n.children);
        if (found) return found;
      }
      return null;
    };

    if (
      assessment.governanceAreas &&
      Array.isArray(assessment.governanceAreas)
    ) {
      for (const area of assessment.governanceAreas) {
        if (area.indicators && Array.isArray(area.indicators)) {
          const indicator = findInTree(area.indicators as any);
          if (indicator) return indicator;
        }
      }
    }

    return null;
  }, [assessment, indicatorId]);
}

/**
 * Hook to get governance area by ID
 */
export function useGovernanceArea(areaId: string) {
  const { data: assessment } = useCurrentAssessment();

  return useMemo(() => {
    if (
      !assessment ||
      !assessment.governanceAreas ||
      !Array.isArray(assessment.governanceAreas)
    )
      return null;

    return (
      assessment.governanceAreas.find((area) => area.id === areaId) || null
    );
  }, [assessment, areaId]);
}

/**
 * Hook to update indicator response data with debouncing
 */
export function useUpdateResponse() {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: async ({
      responseId,
      data,
    }: {
      responseId: number;
      data: AssessmentResponseUpdate;
    }) => {
      return putAssessmentsResponses$ResponseId(responseId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.current() });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.validation() });
    },
  });

  // Create a debounced version of the mutation
  const debouncedUpdate = useMemo(
    () =>
      debounce(
        (responseId: number, data: AssessmentResponseUpdate) => {
          updateMutation.mutate({ responseId, data });
        },
        1000, // 1 second delay
        { maxWait: 5000 } // Maximum 5 seconds wait
      ),
    [updateMutation]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  return {
    updateResponse: debouncedUpdate,
    isLoading: updateMutation.isPending,
    error: updateMutation.error,
  };
}
