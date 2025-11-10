'use client';

import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Form Schema Builder Component
 *
 * Visual builder for creating JSON schemas for indicator forms.
 * Supports multiple field types, validation rules, and drag-and-drop reordering.
 *
 * Features:
 * - Add/remove/reorder fields
 * - Configure field properties (label, type, validation)
 * - Preview generated schema
 * - Export JSON schema
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'url'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file';

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'minLength' | 'maxLength' | 'email' | 'url';
  value?: string | number;
  message?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  required: boolean;
  validation: ValidationRule[];
  options?: SelectOption[]; // For select, radio, checkbox
  accept?: string; // For file input
  multiple?: boolean; // For select and file
}

export interface FormSchema {
  fields: FormField[];
  version: string;
}

interface FormSchemaBuilderProps {
  /** Initial schema */
  value?: FormSchema;

  /** Callback when schema changes */
  onChange?: (schema: FormSchema) => void;

  /** Whether the builder is readonly */
  readonly?: boolean;

  /** Custom class name */
  className?: string;
}

// ============================================================================
// Field Type Configuration
// ============================================================================

const FIELD_TYPE_CONFIG: Record<FieldType, { label: string; icon: string; defaultValidation: ValidationRule[] }> = {
  text: {
    label: 'Text Input',
    icon: 'T',
    defaultValidation: [],
  },
  textarea: {
    label: 'Text Area',
    icon: 'P',
    defaultValidation: [],
  },
  number: {
    label: 'Number',
    icon: '#',
    defaultValidation: [],
  },
  email: {
    label: 'Email',
    icon: '@',
    defaultValidation: [{ type: 'email', message: 'Please enter a valid email address' }],
  },
  url: {
    label: 'URL',
    icon: 'U',
    defaultValidation: [{ type: 'url', message: 'Please enter a valid URL' }],
  },
  date: {
    label: 'Date',
    icon: 'D',
    defaultValidation: [],
  },
  select: {
    label: 'Select Dropdown',
    icon: 'S',
    defaultValidation: [],
  },
  radio: {
    label: 'Radio Buttons',
    icon: 'R',
    defaultValidation: [],
  },
  checkbox: {
    label: 'Checkbox',
    icon: 'C',
    defaultValidation: [],
  },
  file: {
    label: 'File Upload',
    icon: 'F',
    defaultValidation: [],
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultField(type: FieldType): FormField {
  const config = FIELD_TYPE_CONFIG[type];
  return {
    id: generateFieldId(),
    type,
    name: `field_${Date.now()}`,
    label: `New ${config.label}`,
    required: false,
    validation: [...config.defaultValidation],
    options: type === 'select' || type === 'radio' ? [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ] : undefined,
  };
}

// ============================================================================
// Field List Item Component
// ============================================================================

interface FieldListItemProps {
  field: FormField;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function FieldListItem({ field, index, isSelected, onClick, onDelete }: FieldListItemProps) {
  const config = FIELD_TYPE_CONFIG[field.type];

  return (
    <Draggable draggableId={field.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'group flex items-center gap-2 p-3 rounded-lg border bg-card transition-colors',
            isSelected && 'border-primary bg-accent',
            snapshot.isDragging && 'shadow-lg',
            !isSelected && 'hover:bg-accent/50'
          )}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Field Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{config.icon}</span>
          </div>

          {/* Field Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{field.label}</span>
              {field.required && (
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {config.label} • {field.name}
            </div>
          </div>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}
    </Draggable>
  );
}

// ============================================================================
// Field Configuration Panel Component
// ============================================================================

interface FieldConfigPanelProps {
  field: FormField | null;
  onChange: (field: FormField) => void;
}

function FieldConfigPanel({ field, onChange }: FieldConfigPanelProps) {
  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Settings className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Field Selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a field from the list to configure its properties
        </p>
      </div>
    );
  }

  const updateField = (updates: Partial<FormField>) => {
    onChange({ ...field, ...updates });
  };

  const addValidationRule = (type: ValidationRule['type']) => {
    const newRule: ValidationRule = { type, message: '' };
    updateField({ validation: [...field.validation, newRule] });
  };

  const updateValidationRule = (index: number, updates: Partial<ValidationRule>) => {
    const newValidation = [...field.validation];
    newValidation[index] = { ...newValidation[index], ...updates };
    updateField({ validation: newValidation });
  };

  const removeValidationRule = (index: number) => {
    updateField({ validation: field.validation.filter((_, i) => i !== index) });
  };

  const addOption = () => {
    const newOption: SelectOption = {
      label: `Option ${(field.options?.length || 0) + 1}`,
      value: `option${(field.options?.length || 0) + 1}`,
    };
    updateField({ options: [...(field.options || []), newOption] });
  };

  const updateOption = (index: number, updates: Partial<SelectOption>) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = { ...newOptions[index], ...updates };
    updateField({ options: newOptions });
  };

  const removeOption = (index: number) => {
    updateField({ options: field.options?.filter((_, i) => i !== index) });
  };

  const showOptions = field.type === 'select' || field.type === 'radio';

  return (
    <div className="space-y-6 p-4">
      {/* Basic Properties */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Basic Properties</h3>

        <div className="space-y-2">
          <Label htmlFor="field-label">Label</Label>
          <Input
            id="field-label"
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="Enter field label"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-name">Field Name</Label>
          <Input
            id="field-name"
            value={field.name}
            onChange={(e) => updateField({ name: e.target.value })}
            placeholder="field_name"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Used as the key in the form data
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-placeholder">Placeholder</Label>
          <Input
            id="field-placeholder"
            value={field.placeholder || ''}
            onChange={(e) => updateField({ placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-help">Help Text</Label>
          <Textarea
            id="field-help"
            value={field.helpText || ''}
            onChange={(e) => updateField({ helpText: e.target.value })}
            placeholder="Additional help text for users"
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="field-required">Required Field</Label>
          <Switch
            id="field-required"
            checked={field.required}
            onCheckedChange={(checked) => updateField({ required: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Options (for select/radio) */}
      {showOptions && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Options</h3>
              <Button size="sm" variant="outline" onClick={addOption}>
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => updateOption(index, { label: e.target.value })}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={option.value}
                    onChange={(e) => updateOption(index, { value: e.target.value })}
                    placeholder="Value"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeOption(index)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Validation Rules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Validation Rules</h3>
          <Select onValueChange={(value) => addValidationRule(value as ValidationRule['type'])}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Add Rule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="required">Required</SelectItem>
              <SelectItem value="minLength">Min Length</SelectItem>
              <SelectItem value="maxLength">Max Length</SelectItem>
              <SelectItem value="min">Min Value</SelectItem>
              <SelectItem value="max">Max Value</SelectItem>
              <SelectItem value="pattern">Pattern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {field.validation.map((rule, index) => (
            <div key={index} className="flex gap-2 items-start p-2 rounded border bg-muted/50">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {rule.type}
                  </Badge>
                </div>
                {(rule.type === 'min' || rule.type === 'max' || rule.type === 'minLength' || rule.type === 'maxLength' || rule.type === 'pattern') && (
                  <Input
                    value={rule.value || ''}
                    onChange={(e) => updateValidationRule(index, { value: e.target.value })}
                    placeholder="Value"
                    className="h-8 text-sm"
                  />
                )}
                <Input
                  value={rule.message || ''}
                  onChange={(e) => updateValidationRule(index, { message: e.target.value })}
                  placeholder="Error message"
                  className="h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeValidationRule(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {field.validation.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No validation rules added
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Form Schema Builder Component
// ============================================================================

export function FormSchemaBuilder({
  value,
  onChange,
  readonly: _readonly = false,
  className = '',
}: FormSchemaBuilderProps) {
  const [schema, setSchema] = React.useState<FormSchema>(
    value || { fields: [], version: '1.0' }
  );
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'builder' | 'preview'>('builder');

  // Sync with external value
  React.useEffect(() => {
    if (value) {
      setSchema(value);
    }
  }, [value]);

  // Notify parent of changes
  const updateSchema = React.useCallback(
    (newSchema: FormSchema) => {
      setSchema(newSchema);
      onChange?.(newSchema);
    },
    [onChange]
  );

  // Add new field
  const addField = (type: FieldType) => {
    const newField = createDefaultField(type);
    updateSchema({
      ...schema,
      fields: [...schema.fields, newField],
    });
    setSelectedFieldId(newField.id);
  };

  // Update field
  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    updateSchema({
      ...schema,
      fields: schema.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  // Delete field
  const deleteField = (fieldId: string) => {
    updateSchema({
      ...schema,
      fields: schema.fields.filter((f) => f.id !== fieldId),
    });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  // Reorder fields
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newFields = Array.from(schema.fields);
    const [removed] = newFields.splice(result.source.index, 1);
    newFields.splice(result.destination.index, 0, removed);

    updateSchema({ ...schema, fields: newFields });
  };

  const selectedField = schema.fields.find((f) => f.id === selectedFieldId) || null;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'builder' | 'preview')}>
        <div className="border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="builder">
              <Settings className="h-4 w-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Builder Tab */}
        <TabsContent value="builder" className="flex-1 m-0 flex overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Field List */}
            <div className="w-80 border-r flex flex-col">
              {/* Add Field Dropdown */}
              <div className="p-4 border-b bg-muted/50">
                <Select onValueChange={(value) => addField(value as FieldType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPE_CONFIG).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {config.icon}
                          </span>
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Field List */}
              <div className="flex-1 overflow-y-auto p-4">
                {schema.fields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No fields added yet</p>
                    <p className="text-xs mt-1">Use the dropdown above to add fields</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="fields">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {schema.fields.map((field, index) => (
                            <FieldListItem
                              key={field.id}
                              field={field}
                              index={index}
                              isSelected={selectedFieldId === field.id}
                              onClick={() => setSelectedFieldId(field.id)}
                              onDelete={() => deleteField(field.id)}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            </div>

            {/* Right Panel: Field Configuration */}
            <div className="flex-1 overflow-y-auto">
              <FieldConfigPanel
                field={selectedField}
                onChange={(updated) => updateField(updated.id, updated)}
              />
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="flex-1 m-0 overflow-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono">Generated JSON Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-[600px]">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
