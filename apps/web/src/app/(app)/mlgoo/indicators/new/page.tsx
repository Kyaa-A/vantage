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
import { usePostIndicators } from '@vantage/shared';
import { useGetGovernanceAreas } from '@vantage/shared';
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
  const { data: governanceAreas } = useGetGovernanceAreas();

  // Form for basic indicator fields
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<IndicatorFormData>();

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
      router.push(`/mlgoo/indicators/${result.id}`);
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
    <div className="flex h-screen flex-col">
      {/* Header with Breadcrumb */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <button
            onClick={() => router.push('/mlgoo/dashboard')}
            className="hover:text-gray-700"
          >
            Admin
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => router.push('/mlgoo/indicators')}
            className="hover:text-gray-700"
          >
            Indicators
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">New</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Indicator</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure basic details and build the form schema
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <FileText className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <SaveFormSchemaButton
              onSave={async () => {
                await handleSubmit(async (data) => {
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
                  markAsSaved();
                  router.push(`/mlgoo/indicators`);
                })();
              }}
              disabled={isSaving}
            >
              Save & Publish
            </SaveFormSchemaButton>
          </div>
        </div>
      </div>

      {/* Basic Fields Form */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Indicator Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required', minLength: 3 })}
              placeholder="Enter indicator name"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Governance Area */}
          <div className="space-y-2">
            <Label htmlFor="governance_area_id">
              Governance Area <span className="text-red-600">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue('governance_area_id', parseInt(value))}
            >
              <SelectTrigger>
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
              <p className="text-sm text-red-600">{errors.governance_area_id.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2 space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter indicator description"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Form Schema Builder */}
      <div className="flex-1 overflow-hidden">
        <FormSchemaBuilder />
      </div>
    </div>
  );
}
