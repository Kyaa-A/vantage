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
import { getGetAssessmentsMyAssessmentQueryKey } from "@vantage/shared/src/generated/endpoints/assessments";
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
      is_completed?: boolean;
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
      responseIndicatorId:
        (indicator as any).responseIndicatorId ??
        (indicator as any).response_indicator_id,
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
        ? (indicator.response as any).is_completed === true
          ? ("completed" as const)
          : ("in_progress" as const)
        : ("not_started" as const),
      // Try to infer a generalized compliance answer from various backend field names
      // For areas 1-6, check for fields ending in _compliance (like bpoc_documents_compliance)
      // For Area 1 with multiple fields, use "yes" if any field is "yes", otherwise check all are answered
      // Also check common compliance field names
      complianceAnswer: (() => {
        const data = indicator.response?.response_data as any;
        if (!data) return undefined;
        
        // First, check for fields ending in _compliance (for areas 1-6)
        const complianceFields: string[] = [];
        for (const key in data) {
          if (key.endsWith("_compliance") && typeof data[key] === "string") {
            const val = data[key].toLowerCase();
            if (val === "yes" || val === "no" || val === "na") {
              complianceFields.push(val);
            }
          }
        }
        
        // If we found compliance fields, determine the answer:
        // - If any field is "yes", return "yes" (need MOVs)
        // - If all fields are answered (yes/no/na), return the first one for compatibility
        // - Otherwise undefined (not all answered)
        if (complianceFields.length > 0) {
          // Check form schema to see how many compliance fields are required
          const formSchema = indicator.form_schema || {};
          const requiredFields = formSchema.required || [];
          const complianceRequiredFields = requiredFields.filter((f: string) => 
            f.endsWith("_compliance")
          );
          
          // If we have all required compliance fields answered, return based on content
          if (complianceFields.length >= complianceRequiredFields.length || complianceRequiredFields.length === 0) {
            // If any field is "yes", return "yes" (indicates MOVs needed)
            if (complianceFields.some(v => v === "yes")) {
              return "yes" as any;
            }
            // All fields answered, return first one (for areas 2-6 with single field)
            return complianceFields[0] as any;
          }
          // Not all required fields answered yet
          return undefined;
        }
        
        // Fall back to common compliance field names
        const val =
          data.compliance ??
          data.is_compliant ??
          data.answer ??
          data.has_budget_plan ??
          data.is_compliance;
        if (typeof val === "string") return val as any;
        if (typeof val === "boolean") return (val ? "yes" : "no") as any;
        return undefined;
      })(),
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
          // Count only LEAF indicators (indicators without children)
          // For areas with parent-child structure (1-6), only count children
          const countLeafIndicators = (nodes: IndicatorNode[] | undefined): number =>
            (nodes || []).reduce((acc, n) => {
              // If node has children, count children instead of the parent
              if (n.children && n.children.length > 0) {
                return acc + countLeafIndicators(n.children);
              }
              // Count leaf indicators only
              return acc + 1;
            }, 0);
          return (
            assessmentData as unknown as APIAssessment
          ).governance_areas.reduce(
            (total, area) => total + countLeafIndicators(area.indicators),
            0
          );
        })(),
        completedIndicators: (() => {
          // Count only LEAF indicators (indicators without children, or use children if they exist)
          // Use the same logic as validation: check complianceAnswer and MOVs
          const countCompleted = (nodes: IndicatorNode[] | undefined): number =>
            (nodes || []).reduce((acc, n) => {
              // If node has children, count children instead of the parent
              if (n.children && n.children.length > 0) {
                return acc + countCompleted(n.children);
              }
              
              // For leaf indicators, check if they're completed using validation logic:
              // 1. Must have complianceAnswer (check response_data for _compliance fields or common fields)
              // 2. If complianceAnswer is "yes", must have MOVs
              // 3. If complianceAnswer is "no" or "na", no MOVs needed
              
              const responseData = n.response?.response_data as any;
              if (!responseData) {
                return acc; // No response data - not completed
              }
              
              // Extract compliance answer from response_data (same logic as mapIndicatorTree)
              let complianceAnswer: string | undefined;
              
              // Check for fields ending in _compliance (for areas 1-6)
              const complianceFields: string[] = [];
              for (const key in responseData) {
                if (key.endsWith("_compliance") && typeof responseData[key] === "string") {
                  const val = responseData[key].toLowerCase();
                  if (val === "yes" || val === "no" || val === "na") {
                    complianceFields.push(val);
                  }
                }
              }
              
              if (complianceFields.length > 0) {
                // Check form schema to see how many compliance fields are required
                const formSchema = n.form_schema || {};
                const requiredFields = formSchema.required || [];
                const complianceRequiredFields = requiredFields.filter((f: string) => 
                  f.endsWith("_compliance")
                );
                
                // If we have all required compliance fields answered
                if (complianceFields.length >= complianceRequiredFields.length || complianceRequiredFields.length === 0) {
                  // If any field is "yes", return "yes" (need MOVs)
                  if (complianceFields.some(v => v === "yes")) {
                    complianceAnswer = "yes";
                  } else {
                    // All fields answered, use first one
                    complianceAnswer = complianceFields[0];
                  }
                }
              } else {
                // Fall back to common compliance field names
                const val =
                  responseData.compliance ??
                  responseData.is_compliant ??
                  responseData.answer ??
                  responseData.has_budget_plan ??
                  responseData.is_compliance;
                if (typeof val === "string") {
                  complianceAnswer = val.toLowerCase();
                } else if (typeof val === "boolean") {
                  complianceAnswer = val ? "yes" : "no";
                }
              }
              
              if (!complianceAnswer) {
                return acc; // No compliance answer - not completed
              }
              
              // Check if MOVs are required and present
              if (complianceAnswer === "yes") {
                // For indicators with per-section uploads, check all sections have MOVs
                const formSchema = n.form_schema || {};
                const props = formSchema.properties || {};
                const requiredSections: string[] = Object.values(props)
                  .map((v: any) => v?.mov_upload_section)
                  .filter((s: any) => typeof s === 'string') as string[];
                
                const movs = n.movs || [];
                
                if (requiredSections.length > 0) {
                  // Check all required sections have at least one MOV
                  const present = new Set<string>();
                  for (const mov of movs) {
                    const sp = (mov as any).storage_path || (mov as any).storagePath || '';
                    for (const rs of requiredSections) {
                      if (typeof sp === 'string' && sp.includes(rs)) {
                        present.add(rs);
                      }
                    }
                  }
                  const allSectionsHaveMOVs = requiredSections.every((s) => present.has(s));
                  return acc + (allSectionsHaveMOVs ? 1 : 0);
                } else {
                  // No section requirements, just need at least one MOV
                  const hasMOVs = movs.length > 0;
                  return acc + (hasMOVs ? 1 : 0);
                }
              }
              
              // "no" or "na" - no MOVs needed, so it's completed
              return acc + 1;
            }, 0);
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

  // Sync local assessment whenever the server data changes
  useEffect(() => {
    if (transformedData) {
      setLocalAssessment(transformedData as unknown as Assessment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentData]);

  return {
    data: localAssessment,
    isLoading,
    error,
    refetch,
    updateAssessmentData: (updater: (data: Assessment) => Assessment) => {
      setLocalAssessment((prev) => {
        if (!prev) return prev;
        // Apply caller's changes
        const next = updater({ ...prev });
        // Recompute derived metrics so header updates immediately
        // Count only LEAF indicators (same logic as initial count)
        const countAll = (nodes: any[] | undefined): number =>
          (nodes || []).reduce((acc, n) => {
            // If node has children, count children instead of the parent
            if (n.children && n.children.length > 0) {
              return acc + countAll(n.children);
            }
            // Count leaf indicators only
            return acc + 1;
          }, 0);
        const countCompleted = (nodes: any[] | undefined): number =>
          (nodes || []).reduce((acc, n) => {
            // If node has children, count children instead of the parent
            if (n.children && n.children.length > 0) {
              return acc + countCompleted(n.children);
            }
            
            // For leaf indicators, use validation logic:
            // 1. Must have complianceAnswer (extract from responseData)
            // 2. If "yes", must have MOVs (check per-section if applicable)
            
            const responseData = n.responseData || {};
            if (!responseData || Object.keys(responseData).length === 0) {
              return acc; // No response data - not completed
            }
            
            // Extract compliance answer from responseData
            let complianceAnswer: string | undefined;
            
            // Check for fields ending in _compliance (for areas 1-6)
            const complianceFields: string[] = [];
            for (const key in responseData) {
              if (key.endsWith("_compliance") && typeof responseData[key] === "string") {
                const val = String(responseData[key]).toLowerCase();
                if (val === "yes" || val === "no" || val === "na") {
                  complianceFields.push(val);
                }
              }
            }
            
            if (complianceFields.length > 0) {
              // Check form schema to see how many compliance fields are required
              const formSchema = n.formSchema || {};
              const requiredFields = formSchema.required || [];
              const complianceRequiredFields = requiredFields.filter((f: string) => 
                f.endsWith("_compliance")
              );
              
              // If we have all required compliance fields answered
              if (complianceFields.length >= complianceRequiredFields.length || complianceRequiredFields.length === 0) {
                // If any field is "yes", return "yes" (need MOVs)
                if (complianceFields.some(v => v === "yes")) {
                  complianceAnswer = "yes";
                } else {
                  // All fields answered, use first one
                  complianceAnswer = complianceFields[0];
                }
              }
            } else {
              // Fall back to common compliance field names
              const val = responseData.compliance || responseData.is_compliant || responseData.answer;
              if (typeof val === "string") {
                complianceAnswer = val.toLowerCase();
              } else if (typeof val === "boolean") {
                complianceAnswer = val ? "yes" : "no";
              }
            }
            
            // Also check n.complianceAnswer as fallback (for when it's already mapped)
            if (!complianceAnswer && n.complianceAnswer) {
              complianceAnswer = String(n.complianceAnswer).toLowerCase();
            }
            
            if (!complianceAnswer) {
              return acc; // No compliance answer - not completed
            }
            
            if (complianceAnswer === "yes") {
              // Check MOVs with per-section validation if applicable
              const props = (n.formSchema as any)?.properties || {};
              const requiredSections: string[] = Object.values(props)
                .map((v: any) => v?.mov_upload_section)
                .filter((s: any) => typeof s === 'string') as string[];
              
              if (requiredSections.length > 0) {
                const present = new Set<string>();
                for (const mov of (n.movFiles || [])) {
                  const sp = (mov as any).storagePath || (mov as any).url || (mov as any).storage_path || '';
                  for (const rs of requiredSections) {
                    if (typeof sp === 'string' && sp.includes(rs)) {
                      present.add(rs);
                    }
                  }
                }
                const allSectionsHaveMOVs = requiredSections.every((s) => present.has(s));
                return acc + (allSectionsHaveMOVs ? 1 : 0);
              } else {
                const hasMOVs = (n.movFiles || []).length > 0;
                return acc + (hasMOVs ? 1 : 0);
              }
            }
            
            // "no" or "na" - no MOVs needed, completed
            return acc + 1;
          }, 0);
        const total = (next.governanceAreas || []).reduce(
          (sum, area: any) => sum + countAll(area.indicators),
          0
        );
        const completed = (next.governanceAreas || []).reduce(
          (sum, area: any) => sum + countCompleted(area.indicators),
          0
        );
        (next as any).totalIndicators = total;
        (next as any).completedIndicators = completed;
        (next as any).updatedAt = new Date().toISOString();
        return next;
      });
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

    // Recursively check all indicators (including children) across all governance areas
    const checkIndicator = (indicator: any) => {
      // If indicator has children, check children instead of parent
      if (indicator.children && indicator.children.length > 0) {
        indicator.children.forEach((child: any) => checkIndicator(child));
        return;
      }
      
      // For leaf indicators, extract complianceAnswer from responseData (same logic as counting)
      const responseData = indicator.responseData || {};
      let complianceAnswer: string | undefined = indicator.complianceAnswer;
      
      // If not already set, extract from responseData
      if (!complianceAnswer) {
        // Check for fields ending in _compliance (for areas 1-6)
        const complianceFields: string[] = [];
        for (const key in responseData) {
          if (key.endsWith("_compliance") && typeof responseData[key] === "string") {
            const val = String(responseData[key]).toLowerCase();
            if (val === "yes" || val === "no" || val === "na") {
              complianceFields.push(val);
            }
          }
        }
        
        if (complianceFields.length > 0) {
          // Check form schema to see how many compliance fields are required
          const formSchema = indicator.formSchema || {};
          const requiredFields = formSchema.required || [];
          const complianceRequiredFields = requiredFields.filter((f: string) => 
            f.endsWith("_compliance")
          );
          
          // If we have all required compliance fields answered
          if (complianceFields.length >= complianceRequiredFields.length || complianceRequiredFields.length === 0) {
            // If any field is "yes", return "yes" (need MOVs)
            if (complianceFields.some(v => v === "yes")) {
              complianceAnswer = "yes";
            } else {
              // All fields answered, use first one
              complianceAnswer = complianceFields[0];
            }
          }
        } else {
          // Fall back to common compliance field names
          const val = responseData.compliance || responseData.is_compliant || responseData.answer;
          if (typeof val === "string") {
            complianceAnswer = val.toLowerCase();
          } else if (typeof val === "boolean") {
            complianceAnswer = val ? "yes" : "no";
          }
        }
      }
      
      if (!complianceAnswer) {
        missingIndicators.push(`${indicator.code} - ${indicator.name}`);
        return;
      }
      
      // If "yes", check MOVs are present (with per-section validation if applicable)
      if (complianceAnswer === "yes") {
        const props = (indicator.formSchema as any)?.properties || {};
        const requiredSections: string[] = Object.values(props)
          .map((v: any) => v?.mov_upload_section)
          .filter((s: any) => typeof s === 'string') as string[];
        
        if (requiredSections.length > 0) {
          // Check all required sections have at least one MOV
          const present = new Set<string>();
          for (const mov of (indicator.movFiles || [])) {
            const sp = (mov as any).storagePath || (mov as any).url || '';
            for (const rs of requiredSections) {
              if (typeof sp === 'string' && sp.includes(rs)) {
                present.add(rs);
              }
            }
          }
          const allSectionsHaveMOVs = requiredSections.every((s) => present.has(s));
          if (!allSectionsHaveMOVs) {
            missingMOVs.push(`${indicator.code} - ${indicator.name}`);
          }
        } else {
          // No section requirements, just check if at least one MOV exists
          if ((indicator.movFiles || []).length === 0) {
            missingMOVs.push(`${indicator.code} - ${indicator.name}`);
          }
        }
      }
      // "no" or "na" - no MOVs needed, so no validation needed
    };

    // Check all indicators across all governance areas
    if (assessment.governanceAreas) {
      assessment.governanceAreas.forEach((area) => {
        if (area.indicators) {
          area.indicators.forEach((indicator) => {
            checkIndicator(indicator);
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
    onSuccess: async () => {
      // Ensure both local keys and the generated query key are refreshed
      queryClient.invalidateQueries({ queryKey: getGetAssessmentsMyAssessmentQueryKey() });
      await queryClient.refetchQueries({ queryKey: assessmentKeys.current() });
      await queryClient.refetchQueries({ queryKey: assessmentKeys.validation() });
      await queryClient.refetchQueries({ queryKey: getGetAssessmentsMyAssessmentQueryKey() });
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
    onSuccess: async () => {
      // Ensure both local keys and the generated query key are refreshed
      queryClient.invalidateQueries({ queryKey: getGetAssessmentsMyAssessmentQueryKey() });
      await queryClient.refetchQueries({ queryKey: assessmentKeys.current() });
      await queryClient.refetchQueries({ queryKey: assessmentKeys.validation() });
      await queryClient.refetchQueries({ queryKey: getGetAssessmentsMyAssessmentQueryKey() });
    },
  });
}

/**
 * Hook to delete MOV files
 */
export function useDeleteMOV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movId,
      storagePath,
    }: {
      movId: number;
      storagePath?: string;
    }) => {
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
    onSuccess: async () => {
      // Await refetch to ensure UI updates immediately
      await queryClient.refetchQueries({ queryKey: assessmentKeys.current() });
      await queryClient.refetchQueries({ queryKey: assessmentKeys.validation() });
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
      queryClient.invalidateQueries({ queryKey: getGetAssessmentsMyAssessmentQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: getGetAssessmentsMyAssessmentQueryKey() });
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
