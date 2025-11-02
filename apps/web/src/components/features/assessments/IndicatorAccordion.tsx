"use client";

import FileUploader from "@/components/shared/FileUploader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useCurrentAssessment,
  useDeleteMOV,
  useUpdateResponse,
  useUploadMOV,
} from "@/hooks/useAssessment";
import { uploadMovFile } from "@/lib/uploadMov";
import { Assessment, ComplianceAnswer, Indicator } from "@/types/assessment";
import { postAssessmentsResponses } from "@vantage/shared";
import { AlertCircle, CheckCircle, Circle } from "lucide-react";
import { useState } from "react";
import { DynamicIndicatorForm } from "./DynamicIndicatorForm";

interface IndicatorAccordionProps {
  indicator: Indicator;
  isLocked: boolean;
  updateAssessmentData?: (updater: (data: Assessment) => Assessment) => void;
}

export function IndicatorAccordion({
  indicator,
  isLocked,
  updateAssessmentData,
}: IndicatorAccordionProps) {
  const { data: assessment } = useCurrentAssessment();
  const [isOpen, setIsOpen] = useState(false);
  const { updateResponse } = useUpdateResponse();
  const { mutate: uploadMOV, isPending: isUploading } = useUploadMOV();
  const { mutate: deleteMOV, isPending: isDeleting } = useDeleteMOV();

  // Track compliance locally so UI reacts immediately on change
  const [localCompliance, setLocalCompliance] = useState<
    ComplianceAnswer | undefined
  >(
    (indicator.complianceAnswer ||
      (indicator.responseData?.compliance as ComplianceAnswer | undefined)) as
      | ComplianceAnswer
      | undefined
  );
  const shouldShowMov = localCompliance === "yes";
  const hasSectionUploads = (() => {
    const props = (indicator as any)?.formSchema?.properties || {};
    return Object.values(props).some((v: any) => typeof v?.mov_upload_section === 'string');
  })();

  async function ensureResponseId(): Promise<number> {
    const existing = (indicator as any).responseId as number | null | undefined;
    if (existing) return existing;

    // For synthetic child indicators (areas 2-6), use responseIndicatorId to create response for the parent
    const indicatorIdToUse = (indicator as any).responseIndicatorId 
      ? (indicator as any).responseIndicatorId 
      : parseInt(indicator.id);
    
    const created = await postAssessmentsResponses({
      indicator_id: typeof indicatorIdToUse === 'number' ? indicatorIdToUse : parseInt(String(indicatorIdToUse)),
      assessment_id: assessment ? parseInt(assessment.id) : 1,
      response_data: {},
    });

    if (updateAssessmentData) {
      updateAssessmentData((prevData) => {
        const updated = { ...prevData };
        const updateInTree = (nodes: any[]): boolean => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === indicator.id) {
              (nodes[i] as any).responseId = created.id;
              return true;
            }
            if (nodes[i].children && updateInTree(nodes[i].children))
              return true;
          }
          return false;
        };
        for (const area of updated.governanceAreas) {
          if (area.indicators && updateInTree(area.indicators as any[])) break;
        }
        return updated;
      });
    }
    return created.id;
  }

  const getStatusIcon = () => {
    switch (indicator.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "needs_rework":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "not_started":
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (indicator.status) {
      case "completed":
        return "Completed";
      case "needs_rework":
        return "Needs Rework";
      case "not_started":
      default:
        return "Not Started";
    }
  };

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? indicator.id : ""}
      onValueChange={(value) => setIsOpen(value === indicator.id)}
    >
      <AccordionItem
        value={indicator.id}
        className="border border-[var(--border)] rounded-lg bg-[var(--card)] shadow-sm hover:shadow-md transition-all duration-200"
      >
        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-[var(--hover)] rounded-lg transition-colors duration-200">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {getStatusText()}
                </span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-[var(--foreground)]">
                  {indicator.code} - {indicator.name}
                </div>
                <div className="text-sm text-[var(--text-secondary)] mt-1">
                  {indicator.description.length > 100
                    ? `${indicator.description.substring(0, 100)}...`
                    : indicator.description}
                </div>
              </div>
            </div>

            {/* MOV Files Count */}
            {indicator.movFiles.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
                <span>{indicator.movFiles.length} MOV file(s)</span>
              </div>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-6 pb-6 pt-4">
          {/* Render children if they exist */}
          {Array.isArray((indicator as any).children) &&
            (indicator as any).children.length > 0 && (
            <div className="space-y-4 mb-6">
              {(indicator as any).children.map((child: Indicator) => (
                <RecursiveIndicator
                  key={child.id}
                  indicator={child}
                  isLocked={isLocked}
                  updateAssessmentData={updateAssessmentData}
                  level={1}
                />
              ))}
            </div>
          )}
          
          {/* Render form content only if no children or if this is a leaf node */}
          {!(
            Array.isArray((indicator as any).children) &&
            (indicator as any).children.length > 0
          ) && (
            <div className="space-y-8">
              <DynamicIndicatorForm
                formSchema={indicator.formSchema}
                initialData={indicator.responseData}
                isDisabled={isLocked}
                indicatorId={indicator.id}
                responseId={indicator.responseId}
                assessmentId={assessment?.id}
                responseIndicatorId={(indicator as any).responseIndicatorId}
                movFiles={indicator.movFiles || []}
                updateAssessmentData={updateAssessmentData}
                ensureResponseId={ensureResponseId}
                onChange={(data: Record<string, any>) => {
                  if (!isLocked && indicator.id && updateAssessmentData) {
                    // Determine completion locally based on required answers
                    const required = indicator.formSchema?.required || [];
                    const allAnswered = required.every((f: string) =>
                      typeof data[f] === 'string' && ['yes','no','na'].includes(String(data[f]))
                    );
                    const hasYes = required.some((f: string) => data[f] === 'yes');
                    const movCount = (indicator.movFiles?.length as number) || 0;
                    
                    // Check if all required sections have MOVs (for per-section uploads like Area 1)
                    let allSectionsSatisfied = false;
                    if (hasSectionUploads && hasYes) {
                      const props = (indicator.formSchema as any)?.properties || {};
                      const requiredSections: string[] = Object.values(props)
                        .map((v: any) => v?.mov_upload_section)
                        .filter((s: any) => typeof s === 'string') as string[];
                      const present = new Set<string>();
                      for (const m of (indicator.movFiles || [])) {
                        const sp = (m as any).storagePath || (m as any).url || '';
                        for (const rs of requiredSections) {
                          if (typeof sp === 'string' && sp.includes(rs)) present.add(rs);
                        }
                      }
                      allSectionsSatisfied = requiredSections.length > 0
                        ? requiredSections.every((s) => present.has(s))
                        : movCount > 0;
                    }
                    
                    // Status logic: completed only if:
                    // - All answered AND
                    // - (Not "yes" OR (has MOVs AND if per-section uploads, all sections satisfied))
                    const newStatus = allAnswered && (!hasYes || (hasSectionUploads ? allSectionsSatisfied : movCount > 0))
                      ? 'completed'
                      : (allAnswered && hasYes && !(hasSectionUploads ? allSectionsSatisfied : movCount > 0))
                        ? 'in_progress'
                        : 'not_started';

                    // Areas 2-6 now use the same flat structure as Area 1, no nested wrapping needed
                    const dataToSave = data;

                    // Optimistically update the assessment data tree
                    updateAssessmentData((prevData) => {
                      const updatedData = { ...prevData } as any;
                      const recomputeContainerStatuses = (nodes: any[]): void => {
                        for (let i = 0; i < nodes.length; i++) {
                          const n = nodes[i];
                          if (Array.isArray(n.children) && n.children.length > 0) {
                            // First recompute children
                            recomputeContainerStatuses(n.children);
                            // Then compute this container's status based on children
                            const allCompleted = n.children.every(
                              (c: any) => c.status === 'completed'
                            );
                            n.status = allCompleted ? 'completed' : n.status;
                          }
                        }
                      };
                      const updateInTree = (nodes: any[]): boolean => {
                        for (let i = 0; i < nodes.length; i++) {
                          if (nodes[i].id === indicator.id) {
                            const current = nodes[i];
                            nodes[i] = {
                              ...current,
                              responseData: data, // Keep flat for frontend
                              status: newStatus,
                            };
                            // After updating the leaf, recompute container statuses above
                            return true;
                          }
                          if (
                            nodes[i].children &&
                            updateInTree(nodes[i].children)
                          ) {
                            // We updated a descendant; recompute this container
                            const container = nodes[i];
                            if (Array.isArray(container.children) && container.children.length > 0) {
                              const allCompleted = container.children.every(
                                (c: any) => c.status === 'completed'
                              );
                              container.status = allCompleted ? 'completed' : container.status;
                            }
                            return true;
                          }
                        }
                        return false;
                      };
                      for (const area of updatedData.governanceAreas) {
                        if (area.indicators && updateInTree(area.indicators))
                          break;
                      }
                      // Global pass to ensure all containers reflect latest children state
                      for (const area of updatedData.governanceAreas) {
                        if (area.indicators) recomputeContainerStatuses(area.indicators);
                      }
                      return updatedData;
                    });

                    // Ensure a real response exists, then save with nested structure
                    ensureResponseId().then((responseId) =>
                      updateResponse(responseId, { response_data: dataToSave })
                    );
                  }
                }}
              />

              {/* MOV File Uploader Section (shown only when compliant == yes and no per-section uploads are defined) */}
              {shouldShowMov && !hasSectionUploads && (
                <div className="space-y-4 bg-[var(--card)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[var(--cityscape-yellow)] rounded-full"></div>
                    <h4 className="text-sm font-semibold text-[var(--foreground)]">
                      Means of Verification (MOV)
                    </h4>
                  </div>
                  <FileUploader
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    maxSize={10} // 10MB limit
                    multiple={true}
                    disabled={isLocked}
                    isLoading={isUploading || isDeleting}
                    uploadUrl={`/api/v1/assessments/responses/${indicator.id}/movs`}
                    existingFiles={indicator.movFiles.map((file) => ({
                      id: file.id,
                      name: file.name,
                      size: file.size,
                      url: file.url,
                    }))}
                    onUploadComplete={async (files) => {
                      for (const file of files) {
                        try {
                          // 1) Upload file to Supabase Storage
                          const { storagePath } = await uploadMovFile(file, {
                            assessmentId: "1", // TODO: replace with real assessment id from context
                            responseId: indicator.id.toString(),
                          });

                          // 2) Create the MOV record in backend
                          const responseId = await ensureResponseId();
                          await uploadMOV({
                            responseId,
                            data: {
                              filename: file.name,
                              original_filename: file.name,
                              file_size: file.size,
                              content_type: file.type,
                              storage_path: storagePath,
                              response_id: responseId,
                            },
                          });

                          // Update local UI state so area progress reflects upload
                          if (updateAssessmentData) {
                            updateAssessmentData((prev) => {
                              const updated = { ...prev } as any;
                              const updateInTree = (nodes: any[]): boolean => {
                                for (let i = 0; i < nodes.length; i++) {
                                  if (nodes[i].id === indicator.id) {
                                    const current = nodes[i];
                                    // Determine if all required sections are satisfied
                                    const props = (current.formSchema as any)?.properties || {};
                                    const requiredSections: string[] = Object.values(props)
                                      .map((v: any) => v?.mov_upload_section)
                                      .filter((s: any) => typeof s === 'string') as string[];
                                    const present = new Set<string>();
                                    for (const f of (current.movFiles || [])) {
                                      const sp = f.storagePath || f.url || '';
                                      for (const rs of requiredSections) {
                                        if (typeof sp === 'string' && sp.includes(rs)) present.add(rs);
                                      }
                                    }
                                    const allSatisfied = requiredSections.length > 0
                                      ? requiredSections.every((s) => present.has(s))
                                      : true; // uploading any file counts; list will refresh from server
                                    nodes[i] = {
                                      ...current,
                                      status:
                                        (current.complianceAnswer || localCompliance) === "yes" && allSatisfied
                                          ? "completed"
                                          : "in_progress",
                                    };
                                    return true;
                                  }
                                  if (
                                    nodes[i].children &&
                                    updateInTree(nodes[i].children)
                                  )
                                    return true;
                                }
                                return false;
                              };
                              for (const area of updated.governanceAreas) {
                                if (
                                  area.indicators &&
                                  updateInTree(area.indicators)
                                )
                                  break;
                              }
                              return updated;
                            });
                          }
                        } catch (error) {
                          console.error("Failed to upload MOV:", error);
                        }
                      }
                    }}
                    onDeleteFile={async (fileId) => {
                      try {
                        await deleteMOV({
                          movId:
                            typeof fileId === "string"
                              ? parseInt(fileId)
                              : fileId,
                        });

                        // Remove from local state and update status if necessary
                        if (updateAssessmentData) {
                          updateAssessmentData((prev) => {
                            const updated = { ...prev } as any;
                            const updateInTree = (nodes: any[]): boolean => {
                              for (let i = 0; i < nodes.length; i++) {
                                if (nodes[i].id === indicator.id) {
                                  const current = nodes[i];
                                  const files = current.movFiles.filter(
                                    (f: any) => String(f.id) !== String(fileId)
                                  );
                                  const props = (current.formSchema as any)?.properties || {};
                                  const requiredSections: string[] = Object.values(props)
                                    .map((v: any) => v?.mov_upload_section)
                                    .filter((s: any) => typeof s === 'string') as string[];
                                  const present = new Set<string>();
                                  for (const f of files) {
                                    const sp = f.storagePath || f.url || '';
                                    for (const rs of requiredSections) {
                                      if (typeof sp === 'string' && sp.includes(rs)) present.add(rs);
                                    }
                                  }
                                  const allSatisfied = requiredSections.length > 0
                                    ? requiredSections.every((s) => present.has(s))
                                    : files.length > 0;
                                  nodes[i] = {
                                    ...current,
                                    movFiles: files,
                                    status:
                                      (current.complianceAnswer || localCompliance) === "yes" && allSatisfied
                                        ? "completed"
                                        : files.length === 0
                                          ? "not_started"
                                          : "in_progress",
                                  };
                                  return true;
                                }
                                if (
                                  nodes[i].children &&
                                  updateInTree(nodes[i].children)
                                )
                                  return true;
                              }
                              return false;
                            };
                            for (const area of updated.governanceAreas) {
                              if (
                                area.indicators &&
                                updateInTree(area.indicators)
                              )
                                break;
                            }
                            return updated;
                          });
                        }
                      } catch (error) {
                        console.error("Failed to delete MOV:", error);
                        // TODO: Show error toast
                      }
                    }}
                    onUploadError={(error) => {
                      console.error("MOV upload error:", error);
                      // TODO: Show error toast
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

interface RecursiveIndicatorProps extends IndicatorAccordionProps {
  level?: number;
}

export function RecursiveIndicator({
  indicator,
  isLocked,
  updateAssessmentData,
  level = 0,
}: RecursiveIndicatorProps) {
  return (
    <div style={{ paddingLeft: level * 16 }}>
      <IndicatorAccordion
        indicator={indicator}
        isLocked={isLocked}
        updateAssessmentData={updateAssessmentData}
      />
    </div>
  );
}
