'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ChevronRight, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormSchemaBuilder } from '@/components/features/indicators/FormSchemaBuilder';
import { SaveFormSchemaButton } from '@/components/features/indicators/SaveFormSchemaButton';
import { useFormBuilderStore } from '@/store/useFormBuilderStore';
import { usePostIndicators, useGetLookupsGovernanceAreas } from '@vantage/shared';
import { useToast } from '@/hooks/use-toast';

interface IndicatorFormData {
  name: string;
  description?: string;
  governance_area_id: number;
  parent_id?: number;
}

/**
 * Create New Indicator Page
 *
 * Allows MLGOO users to create a new indicator with form schema builder.
 *
 * Features:
 * - Basic indicator fields (name, description, governance area, parent)
 * - Form schema builder integration
 * - "Save Draft" (without form_schema validation)
 * - "Save & Publish" (with full validation)
 * - Redirects to indicator detail on success
 */
export default function NewIndicatorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { fields, clearFields, markAsSaved } = useFormBuilderStore();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch governance areas
  const { data: governanceAreas } = useGetLookupsGovernanceAreas();

  // Form for basic indicator fields
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<IndicatorFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const selectedGovernanceAreaId = watch('governance_area_id');

  // Create indicator mutation
  const createIndicator = usePostIndicators();

  // Clear form builder on mount
  useEffect(() => {
    clearFields();
  }, [clearFields]);

  // Handle save draft (without form_schema)
  const handleSaveDraft = handleSubmit(async (data) => {
    setIsSaving(true);
    try {
      const result = await createIndicator.mutateAsync({
        data: {
          name: data.name,
          description: data.description || undefined,
          governance_area_id: data.governance_area_id,
          parent_id: data.parent_id || undefined,
          is_active: false, // Draft mode
        },
      });

      toast({
        title: 'Draft saved',
        description: 'Indicator draft created successfully',
      });

      markAsSaved();
      router.push(`/mlgoo/indicators/${result.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save draft',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  });

  // Handle save & publish (with form_schema)
  const handleSaveAndPublish = handleSubmit(async (data) => {
    // Validate governance area is selected
    if (!data.governance_area_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a Governance Area',
        variant: 'destructive',
      });
      return;
    }

    // Validate that form has fields
    if (fields.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one field to the form',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const formSchema = {
        fields: fields,
      };

      const result = await createIndicator.mutateAsync({
        data: {
          name: data.name,
          description: data.description || undefined,
          governance_area_id: data.governance_area_id,
          parent_id: data.parent_id || undefined,
          form_schema: formSchema as any,
          is_active: true, // Published
        },
      });

      toast({
        title: 'Success',
        description: 'Indicator created and published successfully',
      });

      markAsSaved();
      // Redirect to indicators list page
      router.push(`/mlgoo/indicators`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || error?.message || 'Failed to create indicator',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Enhanced Header with Breadcrumb - Sticky */}
      <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)] shadow-lg">
        <div className="relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-indigo-100/15 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100/20 to-pink-100/10 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10 px-6 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
              <button
                onClick={() => router.push('/mlgoo/dashboard')}
                className="hover:text-[var(--cityscape-yellow)] transition-colors font-medium"
              >
                Admin
              </button>
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() => router.push('/mlgoo/indicators')}
                className="hover:text-[var(--cityscape-yellow)] transition-colors font-medium"
              >
                Indicators
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-[var(--foreground)] font-semibold">New</span>
            </div>

            {/* Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[var(--foreground)]">
                  Create{" "}
                  <span className="bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] bg-clip-text text-transparent">
                    New Indicator
                  </span>
                </h1>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Configure basic details and build the form schema for assessment
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="hover:border-[var(--cityscape-yellow)] hover:text-[var(--cityscape-yellow)] transition-all"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <SaveFormSchemaButton
                  onSave={async () => {
                    await handleSubmit(async (data) => {
                      // Validate governance area is selected
                      if (!data.governance_area_id) {
                        toast({
                          title: 'Validation Error',
                          description: 'Please select a Governance Area',
                          variant: 'destructive',
                        });
                        throw new Error('Governance area is required');
                      }

                      const formSchema = { fields };
                      await createIndicator.mutateAsync({
                        data: {
                          name: data.name,
                          description: data.description || undefined,
                          governance_area_id: data.governance_area_id,
                          parent_id: data.parent_id || undefined,
                          form_schema: formSchema as any,
                          is_active: true,
                        },
                      });

                      toast({
                        title: 'Success',
                        description: 'Indicator created and published successfully',
                      });

                      markAsSaved();
                      // Redirect to indicators list page
                      router.push(`/mlgoo/indicators`);
                    })();
                  }}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] hover:shadow-lg transition-all"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save & Publish
                </SaveFormSchemaButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Basic Information Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-[var(--card)] rounded-sm shadow-lg border border-[var(--border)] p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] rounded-sm"></div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-[var(--foreground)]">
                Indicator Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required', minLength: 3 })}
                placeholder="Enter indicator name"
                className={`${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-600">⚠</span> {errors.name.message}
                </p>
              )}
            </div>

            {/* Governance Area */}
            <div className="space-y-2">
              <Label htmlFor="governance_area_id" className="text-sm font-semibold text-[var(--foreground)]">
                Governance Area <span className="text-red-600">*</span>
              </Label>
              <Select
                onValueChange={(value) => {
                  setValue('governance_area_id', parseInt(value), { shouldValidate: true });
                }}
                required
              >
                <SelectTrigger className={`${errors.governance_area_id ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select governance area" />
                </SelectTrigger>
                <SelectContent>
                  {governanceAreas?.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.governance_area_id && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="text-red-600">⚠</span> {errors.governance_area_id.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="col-span-1 lg:col-span-2 space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-[var(--foreground)]">
                Description <span className="text-[var(--text-secondary)] font-normal">(optional)</span>
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter a brief description of this indicator..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-[var(--text-secondary)]">
                Provide context and guidance for assessors completing this indicator
              </p>
            </div>
          </div>
        </div>

        {/* Form Schema Builder Section */}
        <div className="bg-[var(--card)] rounded-sm shadow-lg border border-[var(--border)] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-sm"></div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Form Schema Builder</h2>
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)] ml-3">
              Design the assessment form by adding and configuring fields
            </p>
          </div>
          <FormSchemaBuilder />
        </div>
      </div>
    </div>
  );
}
