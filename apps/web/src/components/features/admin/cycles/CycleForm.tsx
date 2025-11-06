import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { CycleFormData } from "@/hooks/useCycles";

interface CycleFormProps {
  onSubmit: (data: CycleFormData) => Promise<void>;
  isLoading?: boolean;
  initialValues?: Partial<CycleFormData>;
}

export function CycleForm({
  onSubmit,
  isLoading = false,
  initialValues,
}: CycleFormProps) {
  const [form, setForm] = React.useState<CycleFormData>({
    name: initialValues?.name || "",
    year: initialValues?.year || new Date().getFullYear(),
    phase1_deadline: initialValues?.phase1_deadline || "",
    rework_deadline: initialValues?.rework_deadline || "",
    phase2_deadline: initialValues?.phase2_deadline || "",
    calibration_deadline: initialValues?.calibration_deadline || "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Validate chronological order of deadlines
  const validateDeadlines = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check if all fields are filled
    if (!form.name) {
      newErrors.name = "Cycle name is required";
    }

    if (!form.year) {
      newErrors.year = "Year is required";
    }

    if (!form.phase1_deadline) {
      newErrors.phase1_deadline = "Phase 1 deadline is required";
    }

    if (!form.rework_deadline) {
      newErrors.rework_deadline = "Rework deadline is required";
    }

    if (!form.phase2_deadline) {
      newErrors.phase2_deadline = "Phase 2 deadline is required";
    }

    if (!form.calibration_deadline) {
      newErrors.calibration_deadline = "Calibration deadline is required";
    }

    // If any field is empty, return early
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    // Convert to Date objects for comparison
    const phase1 = new Date(form.phase1_deadline);
    const rework = new Date(form.rework_deadline);
    const phase2 = new Date(form.phase2_deadline);
    const calibration = new Date(form.calibration_deadline);

    // Validate chronological order
    if (phase1 >= rework) {
      newErrors.rework_deadline =
        "Rework deadline must be after Phase 1 deadline";
    }

    if (rework >= phase2) {
      newErrors.phase2_deadline =
        "Phase 2 deadline must be after Rework deadline";
    }

    if (phase2 >= calibration) {
      newErrors.calibration_deadline =
        "Calibration deadline must be after Phase 2 deadline";
    }

    // Check if Phase 1 is in the future
    const now = new Date();
    if (phase1 <= now) {
      newErrors.phase1_deadline = "Phase 1 deadline must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDeadlines()) {
      return;
    }

    try {
      await onSubmit(form);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleInputChange = (field: keyof CycleFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cycle Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Cycle Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="e.g., SGLGB 2025"
          disabled={isLoading}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Year */}
      <div className="space-y-2">
        <Label htmlFor="year">
          Assessment Year <span className="text-red-500">*</span>
        </Label>
        <Input
          id="year"
          type="number"
          value={form.year}
          onChange={(e) => handleInputChange("year", parseInt(e.target.value))}
          min={new Date().getFullYear()}
          max={new Date().getFullYear() + 10}
          disabled={isLoading}
          className={errors.year ? "border-red-500" : ""}
        />
        {errors.year && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.year}
          </p>
        )}
      </div>

      {/* Deadlines Section */}
      <div className="space-y-4 pt-4 border-t border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Submission Deadlines
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          All deadlines must be in chronological order: Phase 1 → Rework → Phase 2
          → Calibration
        </p>

        {/* Phase 1 Deadline */}
        <div className="space-y-2">
          <Label htmlFor="phase1_deadline">
            Phase 1 Deadline (Initial Submission){" "}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phase1_deadline"
            type="datetime-local"
            value={form.phase1_deadline}
            onChange={(e) => handleInputChange("phase1_deadline", e.target.value)}
            disabled={isLoading}
            className={errors.phase1_deadline ? "border-red-500" : ""}
          />
          {errors.phase1_deadline && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.phase1_deadline}
            </p>
          )}
        </div>

        {/* Rework Deadline */}
        <div className="space-y-2">
          <Label htmlFor="rework_deadline">
            Rework Deadline <span className="text-red-500">*</span>
          </Label>
          <Input
            id="rework_deadline"
            type="datetime-local"
            value={form.rework_deadline}
            onChange={(e) => handleInputChange("rework_deadline", e.target.value)}
            disabled={isLoading}
            className={errors.rework_deadline ? "border-red-500" : ""}
          />
          {errors.rework_deadline && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.rework_deadline}
            </p>
          )}
        </div>

        {/* Phase 2 Deadline */}
        <div className="space-y-2">
          <Label htmlFor="phase2_deadline">
            Phase 2 Deadline (Final Submission){" "}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phase2_deadline"
            type="datetime-local"
            value={form.phase2_deadline}
            onChange={(e) => handleInputChange("phase2_deadline", e.target.value)}
            disabled={isLoading}
            className={errors.phase2_deadline ? "border-red-500" : ""}
          />
          {errors.phase2_deadline && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.phase2_deadline}
            </p>
          )}
        </div>

        {/* Calibration Deadline */}
        <div className="space-y-2">
          <Label htmlFor="calibration_deadline">
            Calibration Deadline <span className="text-red-500">*</span>
          </Label>
          <Input
            id="calibration_deadline"
            type="datetime-local"
            value={form.calibration_deadline}
            onChange={(e) =>
              handleInputChange("calibration_deadline", e.target.value)
            }
            disabled={isLoading}
            className={errors.calibration_deadline ? "border-red-500" : ""}
          />
          {errors.calibration_deadline && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.calibration_deadline}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[var(--cityscape-yellow)] hover:bg-[var(--cityscape-yellow-dark)] text-white"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            "Create Assessment Cycle"
          )}
        </Button>
      </div>
    </form>
  );
}
