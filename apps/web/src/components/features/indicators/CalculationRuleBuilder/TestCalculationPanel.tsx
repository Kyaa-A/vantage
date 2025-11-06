'use client';

import { useState } from 'react';
import { useCalculationRuleStore } from '@/store/useCalculationRuleStore';
import type { FormSchema } from '@vantage/shared';
import { usePostIndicatorsTestCalculation } from '@vantage/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { DynamicFormInput } from './DynamicFormInput';

interface TestCalculationPanelProps {
  /** Form schema to generate input fields from */
  formSchema?: FormSchema | null;
}

/**
 * TestCalculationPanel - Test calculation rules with sample data
 *
 * This component allows MLGOO users to test their calculation rules
 * before saving by providing sample assessment data and seeing the
 * Pass/Fail result with explanation.
 *
 * Features:
 * - Dynamic input fields generated from form_schema
 * - API integration with /api/v1/indicators/test-calculation
 * - Visual Pass/Fail result display
 * - Detailed explanation of evaluation
 * - Validation and error handling
 */
export function TestCalculationPanel({ formSchema }: TestCalculationPanelProps) {
  const { schema, isSchemaValid } = useCalculationRuleStore();
  const [testData, setTestData] = useState<Record<string, any>>({});

  // Mutation for testing calculation
  const testCalculationMutation = usePostIndicatorsTestCalculation();

  // Handle field value change
  const handleFieldChange = (fieldId: string, value: any) => {
    setTestData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Handle test button click
  const handleRunTest = () => {
    if (!schema) return;

    testCalculationMutation.mutate({
      data: {
        calculation_schema: schema,
        assessment_data: testData,
      },
    });
  };

  // Check if test can be run
  const canRunTest = isSchemaValid() && formSchema && formSchema.input_fields?.length > 0;

  // Get result data
  const result = testCalculationMutation.data;
  const isLoading = testCalculationMutation.isPending;
  const error = testCalculationMutation.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Calculation</CardTitle>
        <CardDescription>
          Test your calculation rules with sample data to verify they work as expected
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Validation Checks */}
        {!isSchemaValid() && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please add at least one condition group with rules before testing.
            </AlertDescription>
          </Alert>
        )}

        {!formSchema && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No form schema found. Please create a form schema before testing calculation rules.
            </AlertDescription>
          </Alert>
        )}

        {formSchema && formSchema.input_fields?.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Form schema has no fields. Please add fields to the form schema.
            </AlertDescription>
          </Alert>
        )}

        {/* Dynamic Input Fields */}
        {canRunTest && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Sample Assessment Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter sample values for the fields referenced in your calculation rules
              </p>
            </div>

            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              {formSchema!.input_fields!.map((field) => (
                <DynamicFormInput
                  key={field.field_id}
                  field={field}
                  value={testData[field.field_id]}
                  onChange={(value) => handleFieldChange(field.field_id, value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Run Test Button */}
        {canRunTest && (
          <div className="flex justify-end">
            <Button onClick={handleRunTest} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Test
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Test Failed:</strong>{' '}
              {error.message || 'An error occurred while testing the calculation'}
            </AlertDescription>
          </Alert>
        )}

        {/* Result Display */}
        {result && !error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-6">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">Test Result</h3>
                <div className="flex items-center gap-3">
                  {result.result === 'Pass' ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                      <div>
                        <Badge variant="default" className="text-lg px-4 py-1">
                          Pass
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          All conditions evaluated to true
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <Badge variant="destructive" className="text-lg px-4 py-1">
                          Fail
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          One or more conditions evaluated to false
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Evaluation Result</p>
                <p className="text-2xl font-bold">
                  {result.evaluation_result ? 'True' : 'False'}
                </p>
              </div>
            </div>

            {/* Detailed Explanation */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="text-sm font-semibold mb-2">Explanation</h4>
              <p className="text-sm text-gray-700">{result.explanation}</p>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">If conditions pass:</span>
                  <Badge
                    variant={result.output_status_on_pass === 'Pass' ? 'default' : 'destructive'}
                    className="ml-2"
                  >
                    {result.output_status_on_pass}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">If conditions fail:</span>
                  <Badge
                    variant={result.output_status_on_fail === 'Fail' ? 'destructive' : 'default'}
                    className="ml-2"
                  >
                    {result.output_status_on_fail}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Test completed successfully. Your calculation rules are working correctly with the
                provided sample data.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
