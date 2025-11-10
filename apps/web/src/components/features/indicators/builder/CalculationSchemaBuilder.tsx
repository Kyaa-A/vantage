'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Play,
  AlertCircle,
  Calculator,
  Code,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Calculation Schema Builder Component
 *
 * Visual builder for creating calculation schemas for auto-calculable indicators.
 * Supports conditional rules, formulas, and lookups for scoring logic.
 *
 * Features:
 * - Add/edit/delete calculation rules
 * - Conditional rule builder with AND/OR logic
 * - Formula editor for complex calculations
 * - Test calculation with sample data
 * - Validate field references against form schema
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type RuleType = 'conditional' | 'formula' | 'lookup';
export type LogicalOperator = 'AND' | 'OR';
export type ComparisonOperator = '>=' | '<=' | '==' | '>' | '<' | '!=';

export interface ConditionRule {
  field: string; // Field name from form_schema
  operator: ComparisonOperator;
  value: string | number;
}

export interface ConditionGroup {
  operator: LogicalOperator;
  conditions: ConditionRule[];
}

export interface ConditionalRule {
  type: 'conditional';
  id: string;
  name: string;
  description?: string;
  conditionGroup: ConditionGroup;
  score: number; // 0-100
  priority?: number; // For rule ordering
}

export interface FormulaRule {
  type: 'formula';
  id: string;
  name: string;
  description?: string;
  formula: string; // JavaScript expression
  variables: Record<string, string>; // Map variable names to form field names
}

export interface LookupRule {
  type: 'lookup';
  id: string;
  name: string;
  description?: string;
  field: string; // Field to lookup
  mappings: Array<{
    value: string | number;
    score: number;
  }>;
  defaultScore?: number;
}

export type CalculationRule = ConditionalRule | FormulaRule | LookupRule;

export interface CalculationSchema {
  rules: CalculationRule[];
  defaultScore?: number;
  version: string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
}

interface CalculationSchemaBuilderProps {
  /** Initial schema */
  value?: CalculationSchema;

  /** Form schema fields (for validation and field selection) */
  formFields?: FormField[];

  /** Callback when schema changes */
  onChange?: (schema: CalculationSchema) => void;

  /** Whether the builder is readonly */
  readonly?: boolean;

  /** Custom class name */
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultConditionalRule(): ConditionalRule {
  return {
    type: 'conditional',
    id: generateRuleId(),
    name: 'New Conditional Rule',
    conditionGroup: {
      operator: 'AND',
      conditions: [
        {
          field: '',
          operator: '>=',
          value: '',
        },
      ],
    },
    score: 0,
  };
}

function createDefaultFormulaRule(): FormulaRule {
  return {
    type: 'formula',
    id: generateRuleId(),
    name: 'New Formula Rule',
    formula: '',
    variables: {},
  };
}

function createDefaultLookupRule(): LookupRule {
  return {
    type: 'lookup',
    id: generateRuleId(),
    name: 'New Lookup Rule',
    field: '',
    mappings: [],
    defaultScore: 0,
  };
}

// ============================================================================
// Conditional Rule Editor Component
// ============================================================================

interface ConditionalRuleEditorProps {
  rule: ConditionalRule;
  formFields: FormField[];
  onChange: (rule: ConditionalRule) => void;
  onDelete: () => void;
}

function ConditionalRuleEditor({
  rule,
  formFields,
  onChange,
  onDelete,
}: ConditionalRuleEditorProps) {
  const updateRule = (updates: Partial<ConditionalRule>) => {
    onChange({ ...rule, ...updates });
  };

  const addCondition = () => {
    const newCondition: ConditionRule = {
      field: '',
      operator: '>=',
      value: '',
    };
    updateRule({
      conditionGroup: {
        ...rule.conditionGroup,
        conditions: [...rule.conditionGroup.conditions, newCondition],
      },
    });
  };

  const updateCondition = (index: number, updates: Partial<ConditionRule>) => {
    const newConditions = [...rule.conditionGroup.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    updateRule({
      conditionGroup: {
        ...rule.conditionGroup,
        conditions: newConditions,
      },
    });
  };

  const removeCondition = (index: number) => {
    updateRule({
      conditionGroup: {
        ...rule.conditionGroup,
        conditions: rule.conditionGroup.conditions.filter((_, i) => i !== index),
      },
    });
  };

  const toggleOperator = () => {
    updateRule({
      conditionGroup: {
        ...rule.conditionGroup,
        operator: rule.conditionGroup.operator === 'AND' ? 'OR' : 'AND',
      },
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      {/* Rule Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Input
            value={rule.name}
            onChange={(e) => updateRule({ name: e.target.value })}
            placeholder="Rule name"
            className="font-semibold"
          />
          <Textarea
            value={rule.description || ''}
            onChange={(e) => updateRule({ description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
            className="text-sm"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <Separator />

      {/* Condition Group */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Conditions</h4>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={rule.conditionGroup.operator === 'AND' ? 'default' : 'outline'}
              onClick={toggleOperator}
              className="h-7 px-3 text-xs"
            >
              {rule.conditionGroup.operator}
            </Button>
            <Button size="sm" variant="outline" onClick={addCondition}>
              <Plus className="h-3 w-3 mr-1" />
              Add Condition
            </Button>
          </div>
        </div>

        {/* Conditions List */}
        <div className="space-y-2">
          {rule.conditionGroup.conditions.map((condition, index) => (
            <div key={index} className="flex gap-2 items-center p-3 bg-muted/50 rounded">
              {/* Field Selector */}
              <Select
                value={condition.field}
                onValueChange={(value) => updateCondition(index, { field: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {formFields.map((field) => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.label} ({field.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator Selector */}
              <Select
                value={condition.operator}
                onValueChange={(value) =>
                  updateCondition(index, { operator: value as ComparisonOperator })
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=">=">&gt;=</SelectItem>
                  <SelectItem value="<=">&lt;=</SelectItem>
                  <SelectItem value="==">=</SelectItem>
                  <SelectItem value=">">&gt;</SelectItem>
                  <SelectItem value="<">&lt;</SelectItem>
                  <SelectItem value="!=">!=</SelectItem>
                </SelectContent>
              </Select>

              {/* Value Input */}
              <Input
                value={condition.value}
                onChange={(e) => updateCondition(index, { value: e.target.value })}
                placeholder="Value"
                className="flex-1"
              />

              {/* Delete Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeCondition(index)}
                disabled={rule.conditionGroup.conditions.length === 1}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Score Input */}
      <div className="space-y-2">
        <Label>Score (0-100)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={rule.score}
          onChange={(e) => updateRule({ score: parseInt(e.target.value, 10) || 0 })}
          className="w-32"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Formula Rule Editor Component
// ============================================================================

interface FormulaRuleEditorProps {
  rule: FormulaRule;
  formFields: FormField[];
  onChange: (rule: FormulaRule) => void;
  onDelete: () => void;
}

function FormulaRuleEditor({
  rule,
  formFields,
  onChange,
  onDelete,
}: FormulaRuleEditorProps) {
  const updateRule = (updates: Partial<FormulaRule>) => {
    onChange({ ...rule, ...updates });
  };

  const addVariable = () => {
    const varName = `var${Object.keys(rule.variables).length + 1}`;
    updateRule({
      variables: {
        ...rule.variables,
        [varName]: '',
      },
    });
  };

  const updateVariable = (varName: string, fieldName: string) => {
    updateRule({
      variables: {
        ...rule.variables,
        [varName]: fieldName,
      },
    });
  };

  const removeVariable = (varName: string) => {
    const newVariables = { ...rule.variables };
    delete newVariables[varName];
    updateRule({ variables: newVariables });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      {/* Rule Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Input
            value={rule.name}
            onChange={(e) => updateRule({ name: e.target.value })}
            placeholder="Rule name"
            className="font-semibold"
          />
          <Textarea
            value={rule.description || ''}
            onChange={(e) => updateRule({ description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
            className="text-sm"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <Separator />

      {/* Variables */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Variables</h4>
          <Button size="sm" variant="outline" onClick={addVariable}>
            <Plus className="h-3 w-3 mr-1" />
            Add Variable
          </Button>
        </div>

        <div className="space-y-2">
          {Object.entries(rule.variables).map(([varName, fieldName]) => (
            <div key={varName} className="flex gap-2 items-center">
              <Input value={varName} disabled className="w-32 font-mono text-sm" />
              <span className="text-muted-foreground">=</span>
              <Select value={fieldName} onValueChange={(value) => updateVariable(varName, value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {formFields.map((field) => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.label} ({field.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => removeVariable(varName)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Formula Input */}
      <div className="space-y-2">
        <Label>Formula (JavaScript Expression)</Label>
        <Textarea
          value={rule.formula}
          onChange={(e) => updateRule({ formula: e.target.value })}
          placeholder="e.g., (var1 + var2) / 2 * 100"
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use variable names defined above. Result should be 0-100.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Lookup Rule Editor Component
// ============================================================================

interface LookupRuleEditorProps {
  rule: LookupRule;
  formFields: FormField[];
  onChange: (rule: LookupRule) => void;
  onDelete: () => void;
}

function LookupRuleEditor({
  rule,
  formFields,
  onChange,
  onDelete,
}: LookupRuleEditorProps) {
  const updateRule = (updates: Partial<LookupRule>) => {
    onChange({ ...rule, ...updates });
  };

  const addMapping = () => {
    updateRule({
      mappings: [
        ...rule.mappings,
        { value: '', score: 0 },
      ],
    });
  };

  const updateMapping = (index: number, updates: Partial<{ value: string | number; score: number }>) => {
    const newMappings = [...rule.mappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    updateRule({ mappings: newMappings });
  };

  const removeMapping = (index: number) => {
    updateRule({
      mappings: rule.mappings.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      {/* Rule Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Input
            value={rule.name}
            onChange={(e) => updateRule({ name: e.target.value })}
            placeholder="Rule name"
            className="font-semibold"
          />
          <Textarea
            value={rule.description || ''}
            onChange={(e) => updateRule({ description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
            className="text-sm"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <Separator />

      {/* Field Selection */}
      <div className="space-y-2">
        <Label>Lookup Field</Label>
        <Select value={rule.field} onValueChange={(value) => updateRule({ field: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select field to lookup" />
          </SelectTrigger>
          <SelectContent>
            {formFields.map((field) => (
              <SelectItem key={field.name} value={field.name}>
                {field.label} ({field.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Mappings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Value Mappings</h4>
          <Button size="sm" variant="outline" onClick={addMapping}>
            <Plus className="h-3 w-3 mr-1" />
            Add Mapping
          </Button>
        </div>

        <div className="space-y-2">
          {rule.mappings.map((mapping, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={mapping.value}
                onChange={(e) => updateMapping(index, { value: e.target.value })}
                placeholder="Field value"
                className="flex-1"
              />
              <span className="text-muted-foreground">→</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={mapping.score}
                onChange={(e) => updateMapping(index, { score: parseInt(e.target.value, 10) || 0 })}
                placeholder="Score"
                className="w-24"
              />
              <Button size="sm" variant="ghost" onClick={() => removeMapping(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Default Score */}
      <div className="space-y-2">
        <Label>Default Score (if no match)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={rule.defaultScore ?? 0}
          onChange={(e) => updateRule({ defaultScore: parseInt(e.target.value, 10) || 0 })}
          className="w-32"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Test Calculator Component
// ============================================================================

interface TestCalculatorProps {
  schema: CalculationSchema;
  formFields: FormField[];
}

function TestCalculator({ schema, formFields }: TestCalculatorProps) {
  const [testData, setTestData] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<{
    score: number;
    matchedRules: string[];
  } | null>(null);

  const runTest = () => {
    // Simple evaluation - in real implementation, this would be server-side
    let finalScore = schema.defaultScore ?? 0;
    const matchedRules: string[] = [];

    for (const rule of schema.rules) {
      if (rule.type === 'conditional') {
        const condRule = rule as ConditionalRule;
        let conditionsMet = true;

        for (const condition of condRule.conditionGroup.conditions) {
          const fieldValue = testData[condition.field];
          const conditionValue = condition.value;
          const numFieldValue = parseFloat(fieldValue);
          const numConditionValue = typeof conditionValue === 'number'
            ? conditionValue
            : parseFloat(conditionValue as string);

          let met = false;
          switch (condition.operator) {
            case '>=':
              met = numFieldValue >= numConditionValue;
              break;
            case '<=':
              met = numFieldValue <= numConditionValue;
              break;
            case '==':
              met = fieldValue === conditionValue.toString();
              break;
            case '>':
              met = numFieldValue > numConditionValue;
              break;
            case '<':
              met = numFieldValue < numConditionValue;
              break;
            case '!=':
              met = fieldValue !== conditionValue.toString();
              break;
          }

          if (condRule.conditionGroup.operator === 'AND' && !met) {
            conditionsMet = false;
            break;
          }
          if (condRule.conditionGroup.operator === 'OR' && met) {
            conditionsMet = true;
            break;
          }
        }

        if (conditionsMet) {
          finalScore = condRule.score;
          matchedRules.push(condRule.name);
          break; // First match wins
        }
      }
    }

    setResult({ score: finalScore, matchedRules });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Test Calculation
        </CardTitle>
        <CardDescription>
          Enter sample values to test your calculation logic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Data Inputs */}
        <div className="space-y-2">
          {formFields.map((field) => (
            <div key={field.name} className="flex gap-2 items-center">
              <Label className="w-40 text-sm">{field.label}</Label>
              <Input
                value={testData[field.name] || ''}
                onChange={(e) =>
                  setTestData({ ...testData, [field.name]: e.target.value })
                }
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="flex-1"
              />
            </div>
          ))}
        </div>

        {/* Run Test Button */}
        <Button onClick={runTest} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Calculate Score
        </Button>

        {/* Results */}
        {result && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Result</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Score:</span>
                  <Badge variant="default" className="text-lg">
                    {result.score}
                  </Badge>
                </div>
                {result.matchedRules.length > 0 && (
                  <div>
                    <span className="font-semibold">Matched Rules:</span>
                    <ul className="list-disc list-inside mt-1">
                      {result.matchedRules.map((ruleName, index) => (
                        <li key={index} className="text-sm">
                          {ruleName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Calculation Schema Builder Component
// ============================================================================

export function CalculationSchemaBuilder({
  value,
  formFields = [],
  onChange,
  readonly: _readonly = false,
  className = '',
}: CalculationSchemaBuilderProps) {
  const [schema, setSchema] = React.useState<CalculationSchema>(
    value || { rules: [], version: '1.0' }
  );
  const [activeTab, setActiveTab] = React.useState<'builder' | 'test' | 'preview'>('builder');

  // Sync with external value
  React.useEffect(() => {
    if (value) {
      setSchema(value);
    }
  }, [value]);

  // Notify parent of changes
  const updateSchema = React.useCallback(
    (newSchema: CalculationSchema) => {
      setSchema(newSchema);
      onChange?.(newSchema);
    },
    [onChange]
  );

  // Add new rule
  const addRule = (type: RuleType) => {
    let newRule: CalculationRule;
    switch (type) {
      case 'conditional':
        newRule = createDefaultConditionalRule();
        break;
      case 'formula':
        newRule = createDefaultFormulaRule();
        break;
      case 'lookup':
        newRule = createDefaultLookupRule();
        break;
    }

    updateSchema({
      ...schema,
      rules: [...schema.rules, newRule],
    });
  };

  // Update rule
  const updateRule = (index: number, rule: CalculationRule) => {
    const newRules = [...schema.rules];
    newRules[index] = rule;
    updateSchema({ ...schema, rules: newRules });
  };

  // Delete rule
  const deleteRule = (index: number) => {
    updateSchema({
      ...schema,
      rules: schema.rules.filter((_, i) => i !== index),
    });
  };

  // Validation warnings
  const warnings: string[] = [];
  if (formFields.length === 0) {
    warnings.push('No form fields available. Define form schema first.');
  }
  if (schema.rules.length === 0) {
    warnings.push('No calculation rules defined. Add at least one rule.');
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="builder">
              <Calculator className="h-4 w-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="test">
              <Play className="h-4 w-4 mr-2" />
              Test
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Builder Tab */}
        <TabsContent value="builder" className="flex-1 m-0 overflow-auto p-4 space-y-4">
          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Add Rule Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => addRule('conditional')}>
              <Plus className="h-4 w-4 mr-2" />
              Conditional Rule
            </Button>
            <Button variant="outline" onClick={() => addRule('formula')}>
              <Plus className="h-4 w-4 mr-2" />
              Formula Rule
            </Button>
            <Button variant="outline" onClick={() => addRule('lookup')}>
              <Plus className="h-4 w-4 mr-2" />
              Lookup Rule
            </Button>
          </div>

          {/* Rules List */}
          {schema.rules.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Calculation Rules</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add calculation rules to define how scores are computed
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {schema.rules.map((rule, index) => (
                <AccordionItem key={rule.id} value={rule.id} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rule.type}
                      </Badge>
                      <span className="font-medium">{rule.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {rule.type === 'conditional' && (
                      <ConditionalRuleEditor
                        rule={rule as ConditionalRule}
                        formFields={formFields}
                        onChange={(updated) => updateRule(index, updated)}
                        onDelete={() => deleteRule(index)}
                      />
                    )}
                    {rule.type === 'formula' && (
                      <FormulaRuleEditor
                        rule={rule as FormulaRule}
                        formFields={formFields}
                        onChange={(updated) => updateRule(index, updated)}
                        onDelete={() => deleteRule(index)}
                      />
                    )}
                    {rule.type === 'lookup' && (
                      <LookupRuleEditor
                        rule={rule as LookupRule}
                        formFields={formFields}
                        onChange={(updated) => updateRule(index, updated)}
                        onDelete={() => deleteRule(index)}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Default Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Default Score</CardTitle>
              <CardDescription>Score used when no rules match</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                min={0}
                max={100}
                value={schema.defaultScore ?? 0}
                onChange={(e) =>
                  updateSchema({
                    ...schema,
                    defaultScore: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-32"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="flex-1 m-0 overflow-auto p-4">
          <TestCalculator schema={schema} formFields={formFields} />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="flex-1 m-0 overflow-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Code className="h-4 w-4" />
                Generated JSON Schema
              </CardTitle>
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
