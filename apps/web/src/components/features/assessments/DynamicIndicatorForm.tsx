"use client";

import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useDeleteMOV, useUploadMOV } from "@/hooks/useAssessment";
import { getSignedUrl, uploadMovFile } from "@/lib/uploadMov";
import { FormField, FormSchema } from "@/types/form-schema";

interface DynamicIndicatorFormProps {
  formSchema: FormSchema;
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
  onChange?: (data: Record<string, unknown>) => void;
  isDisabled?: boolean;
  indicatorId?: string;
  responseId?: number | null;
  movFiles?: Array<{
    id: string;
    name: string;
    size: number;
    url: string;
  }>;
  updateAssessmentData?: (updater: (data: any) => any) => void;
}

export function DynamicIndicatorForm({
  formSchema,
  initialData,
  onSubmit,
  onChange,
  isDisabled = false,
  indicatorId,
  responseId,
  movFiles = [],
  updateAssessmentData,
}: DynamicIndicatorFormProps) {
  const { mutate: uploadMOV, isPending: isUploading } = useUploadMOV();
  const { mutate: deleteMOV, isPending: isDeleting } = useDeleteMOV();
  // Per-section upload progress so only the active section shows progress
  const [sectionUpload, setSectionUpload] = React.useState<Record<string, { progress: number; active: boolean }>>({});
  const uploadTimersRef = React.useRef<Map<string, number>>(new Map());

  const startSectionProgress = React.useCallback((sectionKey: string) => {
    setSectionUpload((prev) => ({ ...prev, [sectionKey]: { progress: 5, active: true } }));
    const existing = uploadTimersRef.current.get(sectionKey);
    if (existing) window.clearInterval(existing);
    const id = window.setInterval(() => {
      setSectionUpload((prev) => {
        const current = prev[sectionKey] ?? { progress: 0, active: true };
        const next = Math.min(90, (current.progress || 0) + 2);
        return { ...prev, [sectionKey]: { progress: next, active: true } };
      });
    }, 150);
    uploadTimersRef.current.set(sectionKey, id);
  }, []);

  const finishSectionProgress = React.useCallback((sectionKey: string) => {
    const existing = uploadTimersRef.current.get(sectionKey);
    if (existing) {
      window.clearInterval(existing);
      uploadTimersRef.current.delete(sectionKey);
    }
    setSectionUpload((prev) => ({ ...prev, [sectionKey]: { progress: 100, active: true } }));
    window.setTimeout(() => {
      setSectionUpload((prev) => ({ ...prev, [sectionKey]: { progress: 0, active: false } }));
    }, 400);
  }, []);
  type LocalMov = {
    id: string;
    name: string;
    size: number;
    url: string;
    section?: string;
    storagePath?: string;
  };
  const [localMovs, setLocalMovs] = React.useState<LocalMov[]>(
    (movFiles || []).map((f) => ({
      id: String(f.id),
      name: f.name,
      size: f.size,
      url: f.url,
      storagePath: (f as any).storagePath || (f as any).storage_path,
    }))
  );

  // Keep local list in sync when movFiles prop changes (e.g., after refresh)
  const urlCacheRef = React.useRef<Map<string, string>>(new Map());

  React.useEffect(() => {
    console.log("[DynamicIndicatorForm] movFiles changed:", {
      count: movFiles?.length || 0,
      files: movFiles?.map((f: any) => ({
        id: f.id,
        name: f.name || f.filename,
      })),
    });

    let cancelled = false;
    (async () => {
      const mapped: LocalMov[] = await Promise.all(
        (movFiles || []).map(async (f: any) => {
          const name = f.name || f.original_filename || f.filename;
          const size = f.size ?? f.file_size;
          let url = f.url as string | undefined;
          const storagePath = (f.storage_path ?? (f as any).storagePath) as
            | string
            | undefined;
          if (!url && storagePath) {
            const cached = urlCacheRef.current.get(storagePath);
            if (cached) {
              url = cached;
            } else {
              url = await getSignedUrl(storagePath, 60);
              urlCacheRef.current.set(storagePath, url);
            }
          }
          const section =
            typeof storagePath === "string"
              ? storagePath.includes("bfdp_monitoring_forms")
                ? "bfdp_monitoring_forms"
                : storagePath.includes("photo_documentation")
                ? "photo_documentation"
                : undefined
              : undefined;
          return {
            id: String(f.id),
            name,
            size,
            url: url || "",
            section,
            storagePath,
          };
        })
      );
      if (!cancelled) {
        // Deduplicate by ID and storage_path
        const dedupedById = Array.from(
          new Map(mapped.map((f) => [f.id, f])).values()
        );
        const finalDeduped = Array.from(
          new Map(dedupedById.map((f) => [f.storagePath || f.id, f])).values()
        );
        console.log("[DynamicIndicatorForm] Setting localMovs:", {
          count: finalDeduped.length,
          files: finalDeduped.map((f) => ({ id: f.id, name: f.name })),
        });
        setLocalMovs(finalDeduped);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movFiles]);

  // Create a dynamic Zod schema based on the form schema
  const zodSchema = React.useMemo(() => {
    const schemaObj: Record<string, z.ZodType> = {};

    // Convert form schema fields to Zod validations
    Object.entries(formSchema.properties || {}).forEach(
      ([key, field]: [string, FormField]) => {
        switch (field.type) {
          case "string":
            schemaObj[key] = field.required
              ? z.string().min(1, { message: "This field is required" })
              : z.string().optional();
            break;
          case "number":
            schemaObj[key] = field.required
              ? z.number()
              : z.number().optional();
            break;
          case "boolean":
            schemaObj[key] = field.required
              ? z.boolean()
              : z.boolean().optional();
            break;
          // Add more field types as needed
        }
      }
    );

    return z.object(schemaObj);
  }, [formSchema]);

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: initialData || {},
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    form.reset(initialData || {});
  }, [form, initialData]);

  // Handle form changes
  React.useEffect(() => {
    if (onChange) {
      const subscription = form.watch((value) => {
        onChange(value);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, onChange]);

  // Render form fields based on schema
  const renderField = (name: string, field: FormField) => {
    switch (field.type) {
      case "boolean":
        return (
          <div className="space-y-3 mt-4" key={name}>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={name}
                checked={Boolean(form.watch(name))}
                onChange={(e) => form.setValue(name, e.target.checked)}
                disabled={isDisabled}
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--cityscape-yellow)] focus:ring-[var(--cityscape-yellow)]"
              />
              <Label htmlFor={name} className="text-sm font-semibold">
                {field.title || name}
              </Label>
            </div>
            {field.description && (
              <p className="text-xs text-[var(--text-secondary)] ml-6">
                {field.description}
              </p>
            )}
            {/* Show MOV upload section when checkbox is checked */}
            {form.watch(name) && (field as any).mov_upload_section && (
              <div className="ml-6 mt-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-[var(--cityscape-yellow)] rounded-full"></div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">
                    Upload Files for{" "}
                    {(field as any).mov_upload_section ===
                    "bfdp_monitoring_forms"
                      ? "BFDP Monitoring Forms"
                      : "Photo Documentation"}
                  </h4>
                </div>
                <div className="text-xs text-[var(--text-secondary)] mb-3">
                  {(field as any).mov_upload_section === "bfdp_monitoring_forms"
                    ? "Upload 3 BFDP Monitoring Form A documents"
                    : "Upload 2 photos of the BFDP board showing the barangay name"}
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  disabled={isDisabled || isUploading}
                  onChange={async (e) => {
                    const sectionKey = (field as any).mov_upload_section || 'unknown_section';
                    startSectionProgress(sectionKey);
                    const files = e.currentTarget.files;
                    if (!files || !indicatorId || !responseId) return;
                    for (const file of Array.from(files)) {
                      try {
                        const { storagePath } = await uploadMovFile(file, {
                          assessmentId: indicatorId,
                          responseId: responseId.toString(),
                          section: (field as any).mov_upload_section,
                        });
                        // Upload to backend and update UI immediately
                        await new Promise<void>((resolve, reject) => {
                          uploadMOV(
                            {
                              responseId,
                              data: {
                                filename: file.name,
                                original_filename: file.name,
                                file_size: file.size,
                                content_type: file.type,
                                storage_path: storagePath,
                                response_id: responseId,
                              },
                            },
                            {
                              onSuccess: async (created: any) => {
                                // Get a signed URL for immediate preview and add to local list
                                try {
                                  const url = await getSignedUrl(
                                    storagePath,
                                    60
                                  );
                                  setLocalMovs((prev) => {
                                    const next = [
                                      ...prev,
                                      {
                                        id: String(created?.id ?? Date.now()),
                                        name: file.name,
                                        size: file.size,
                                        url,
                                        section: (field as any)
                                          .mov_upload_section,
                                        storagePath,
                                      },
                                    ];
                                    // Deduplicate by storagePath or id
                                    return Array.from(
                                      new Map(
                                        next.map((f) => [
                                          f.storagePath || f.id,
                                          f,
                                        ])
                                      ).values()
                                    );
                                  });
                                } catch {}
                                // Mark indicator as completed in local assessment state for immediate progress update
                                if (updateAssessmentData && indicatorId) {
                                  updateAssessmentData((prev) => {
                                    const updated = { ...(prev as any) };
                                    const updateInTree = (nodes: any[]): boolean => {
                                      for (let i = 0; i < nodes.length; i++) {
                                        if (String(nodes[i].id) === String(indicatorId)) {
                                          nodes[i] = {
                                            ...nodes[i],
                                            status: 'completed',
                                          };
                                          return true;
                                        }
                                        if (nodes[i].children && updateInTree(nodes[i].children)) return true;
                                      }
                                      return false;
                                    };
                                    for (const area of (updated.governanceAreas || [])) {
                                      if (area.indicators && updateInTree(area.indicators)) break;
                                    }
                                    return updated as any;
                                  });
                                }
                                resolve();
                              },
                              onError: (error) => reject(error),
                            }
                          );
                        });
                      } catch (err) {
                        console.error("Upload failed:", err);
                      }
                    }
                    finishSectionProgress(sectionKey);
                    e.currentTarget.value = "";
                  }}
                />
                {(() => {
                  const sectionKey = (field as any).mov_upload_section || 'unknown_section';
                  const state = sectionUpload[sectionKey];
                  return state?.active ? (
                  <div className="mt-3">
                    <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-[var(--cityscape-yellow)] transition-all duration-150"
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                    <div className="text-[10px] mt-1 text-[var(--text-secondary)]">
                      Uploading... {state.progress}%
                    </div>
                  </div>
                  ) : null;
                })()}
                {localMovs.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {localMovs
                      .filter(
                        (f) =>
                          !f.section ||
                          f.section === (field as any).mov_upload_section
                      )
                      .map((f) => (
                        <div
                          key={f.id}
                          className="text-xs flex items-center gap-2"
                        >
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            {f.name}
                          </a>
                          <span>({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                          <button
                            type="button"
                            disabled={isDisabled || isDeleting}
                            onClick={() => {
                              // Optimistically remove from UI immediately and update area progress
                              setLocalMovs((prev) => {
                                const next = prev.filter(
                                  (m) => m.id !== f.id && m.storagePath !== f.storagePath
                                );
                                if (updateAssessmentData && indicatorId) {
                                  updateAssessmentData((prevAssess) => {
                                    const updated = { ...(prevAssess as any) };
                                    const updateInTree = (nodes: any[]): boolean => {
                                      for (let i = 0; i < nodes.length; i++) {
                                        if (String(nodes[i].id) === String(indicatorId)) {
                                          nodes[i] = {
                                            ...nodes[i],
                                            status: next.length > 0 ? 'completed' : 'not_started',
                                            movFiles: next,
                                          };
                                          return true;
                                        }
                                        if (nodes[i].children && updateInTree(nodes[i].children)) return true;
                                      }
                                      return false;
                                    };
                                    for (const area of (updated.governanceAreas || [])) {
                                      if (area.indicators && updateInTree(area.indicators)) break;
                                    }
                                    return updated as any;
                                  });
                                }
                                return next;
                              });
                              // Delete from backend (which deletes storage + DB)
                              deleteMOV({
                                movId: parseInt(f.id),
                                storagePath: f.storagePath,
                              });
                            }}
                            className="text-[var(--destructive)]"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "string":
        if (field.enum) {
          return (
            <div className="space-y-3 mt-4" key={name}>
              <Label className="text-sm font-semibold text-[var(--foreground)]">
                {field.title || name}
              </Label>
              <RadioGroup
                onValueChange={(value) => form.setValue(name, value)}
                defaultValue={String(form.getValues(name) || "")}
                disabled={isDisabled}
                className="space-y-3"
              >
                {field.enum.map((option: string) => (
                  <div className="flex items-center space-x-2" key={option}>
                    <RadioGroupItem value={option} id={`${name}-${option}`} />
                    <Label
                      htmlFor={`${name}-${option}`}
                      className="text-sm font-medium cursor-pointer capitalize"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {(field as any).mov_upload_section &&
                form.watch(name) === "yes" && (
                  <div className="ml-1 mt-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-[var(--cityscape-yellow)] rounded-full"></div>
                      <h4 className="text-sm font-semibold text-[var(--foreground)]">
                        Upload Files for{" "}
                        {(field as any).mov_upload_section ===
                        "bfdp_monitoring_forms"
                          ? "BFDP Monitoring Forms"
                          : "Photo Documentation"}
                      </h4>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      disabled={isDisabled || isUploading}
                      onChange={async (e) => {
                        const sectionKey = (field as any).mov_upload_section || 'unknown_section';
                        startSectionProgress(sectionKey);
                        const files = e.currentTarget.files;
                        if (!files || !indicatorId || !responseId) return;
                        for (const file of Array.from(files)) {
                          try {
                            const { storagePath } = await uploadMovFile(file, {
                              assessmentId: indicatorId,
                              responseId: responseId.toString(),
                              section: (field as any).mov_upload_section,
                            });
                            // Upload to backend and update UI immediately
                            await new Promise<void>((resolve, reject) => {
                              uploadMOV(
                                {
                                  responseId,
                                  data: {
                                    filename: file.name,
                                    original_filename: file.name,
                                    file_size: file.size,
                                    content_type: file.type,
                                    storage_path: storagePath,
                                    response_id: responseId,
                                  },
                                },
                                {
                                  onSuccess: async (created: any) => {
                                    try {
                                      const url = await getSignedUrl(
                                        storagePath,
                                        60
                                      );
                                      setLocalMovs((prev) => {
                                        const next = [
                                          ...prev,
                                          {
                                            id: String(
                                              created?.id ?? Date.now()
                                            ),
                                            name: file.name,
                                            size: file.size,
                                            url,
                                            section: (field as any)
                                              .mov_upload_section,
                                            storagePath,
                                          },
                                        ];
                                        return Array.from(
                                          new Map(
                                            next.map((f) => [
                                              f.storagePath || f.id,
                                              f,
                                            ])
                                          ).values()
                                        );
                                      });
                                    } catch {}
                                    // Mark indicator as completed in local assessment state for immediate progress update
                                    if (updateAssessmentData && indicatorId) {
                                      updateAssessmentData((prev) => {
                                        const updated = { ...(prev as any) };
                                        const updateInTree = (nodes: any[]): boolean => {
                                          for (let i = 0; i < nodes.length; i++) {
                                            if (String(nodes[i].id) === String(indicatorId)) {
                                              nodes[i] = {
                                                ...nodes[i],
                                                status: 'completed',
                                              };
                                              return true;
                                            }
                                            if (nodes[i].children && updateInTree(nodes[i].children)) return true;
                                          }
                                          return false;
                                        };
                                        for (const area of (updated.governanceAreas || [])) {
                                          if (area.indicators && updateInTree(area.indicators)) break;
                                        }
                                        return updated as any;
                                      });
                                    }
                                    resolve();
                                  },
                                  onError: (error) => reject(error),
                                }
                              );
                            });
                          } catch (err) {
                            console.error("Upload failed:", err);
                          }
                        }
                        finishSectionProgress(sectionKey);
                        e.currentTarget.value = "";
                      }}
                    />
                    {(() => {
                      const sectionKey = (field as any).mov_upload_section || 'unknown_section';
                      const state = sectionUpload[sectionKey];
                      return state?.active ? (
                      <div className="mt-3">
                        <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-[var(--cityscape-yellow)] transition-all duration-150"
                            style={{ width: `${state.progress}%` }}
                          />
                        </div>
                        <div className="text-[10px] mt-1 text-[var(--text-secondary)]">
                          Uploading... {state.progress}%
                        </div>
                      </div>
                      ) : null;
                    })()}
                    {localMovs.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {localMovs
                          .filter(
                            (f) =>
                              f.section === (field as any).mov_upload_section
                          )
                          .map((f) => (
                            <div
                              key={f.id}
                              className="text-xs flex items-center gap-2"
                            >
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                {f.name}
                              </a>
                              <span>
                                ({(f.size / 1024 / 1024).toFixed(1)} MB)
                              </span>
                              <button
                                type="button"
                                disabled={isDisabled || isDeleting}
                                onClick={() => {
                                  // Optimistically remove from UI immediately and update area progress
                                  setLocalMovs((prev) => {
                                    const next = prev.filter(
                                      (m) => m.id !== f.id && m.storagePath !== f.storagePath
                                    );
                                    if (updateAssessmentData && indicatorId) {
                                      updateAssessmentData((prevAssess) => {
                                        const updated = { ...(prevAssess as any) };
                                        const updateInTree = (nodes: any[]): boolean => {
                                          for (let i = 0; i < nodes.length; i++) {
                                            if (String(nodes[i].id) === String(indicatorId)) {
                                              nodes[i] = {
                                                ...nodes[i],
                                                status: next.length > 0 ? 'completed' : 'not_started',
                                                movFiles: next,
                                              };
                                              return true;
                                            }
                                            if (nodes[i].children && updateInTree(nodes[i].children)) return true;
                                          }
                                          return false;
                                        };
                                        for (const area of (updated.governanceAreas || [])) {
                                          if (area.indicators && updateInTree(area.indicators)) break;
                                        }
                                        return updated as any;
                                      });
                                    }
                                    return next;
                                  });
                                  // Delete from backend (which deletes storage + DB)
                                  deleteMOV({
                                    movId: parseInt(f.id),
                                    storagePath: f.storagePath,
                                  });
                                }}
                                className="text-[var(--destructive)]"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          );
        }
        return (
          <div className="space-y-3 mt-4" key={name}>
            <Label
              htmlFor={name}
              className="text-sm font-semibold text-[var(--foreground)]"
            >
              {field.title || name}
            </Label>
            <Input
              {...form.register(name)}
              id={name}
              placeholder={field.description}
              disabled={isDisabled}
              className="p-3 border-[var(--border)] focus:border-[var(--cityscape-yellow)] focus:ring-1 focus:ring-[var(--cityscape-yellow)] transition-colors duration-200"
            />
          </div>
        );
      // Add more field types as needed
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit || (() => {}))}
        className="space-y-6 bg-[var(--card)] p-6 rounded-lg border border-[var(--border)] shadow-sm"
      >
        {Object.entries(formSchema.properties || {}).map(
          ([name, field]: [string, FormField]) => renderField(name, field)
        )}

        {/* Debug: Show file count */}
        <div className="text-xs text-gray-500 mt-2">
          Debug: localMovs.length = {localMovs.length}, movFiles.length ={" "}
          {movFiles?.length || 0}
        </div>

        {localMovs.length > 0 && (
          <div className="pt-4 mt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-[var(--cityscape-yellow)] rounded-full"></div>
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                All Uploaded Files
              </h4>
            </div>
            <div className="mt-2 space-y-1">
              {Array.from(
                new Map(localMovs.map((f) => [f.id, f])).values()
              ).map((f) => (
                <div key={f.id} className="text-xs flex items-center gap-2">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {f.name}
                  </a>
                  <span>({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                  {f.section && (
                    <span className="text-[var(--text-secondary)]">
                      ·{" "}
                      {f.section === "bfdp_monitoring_forms"
                        ? "BFDP Monitoring Forms"
                        : "Photo Documentation"}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isDisabled || isDeleting}
                    onClick={() => {
                      // Optimistically remove from UI immediately and update area progress
                      setLocalMovs((prev) => {
                        const next = prev.filter(
                          (m) => m.id !== f.id && m.storagePath !== f.storagePath
                        );
                        if (updateAssessmentData && indicatorId) {
                          updateAssessmentData((prevAssess) => {
                            const updated = { ...(prevAssess as any) };
                            const updateInTree = (nodes: any[]): boolean => {
                              for (let i = 0; i < nodes.length; i++) {
                                if (String(nodes[i].id) === String(indicatorId)) {
                                  nodes[i] = {
                                    ...nodes[i],
                                    status: next.length > 0 ? 'completed' : 'not_started',
                                    movFiles: next,
                                  };
                                  return true;
                                }
                                if (nodes[i].children && updateInTree(nodes[i].children)) return true;
                              }
                              return false;
                            };
                            for (const area of (updated.governanceAreas || [])) {
                              if (area.indicators && updateInTree(area.indicators)) break;
                            }
                            return updated as any;
                          });
                        }
                        return next;
                      });
                      // Delete from backend (which deletes storage + DB)
                      deleteMOV({
                        movId: parseInt(f.id),
                        storagePath: f.storagePath,
                      });
                    }}
                    className="text-[var(--destructive)]"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
