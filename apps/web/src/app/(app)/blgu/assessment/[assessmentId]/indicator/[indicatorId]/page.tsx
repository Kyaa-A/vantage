// 📝 Dynamic Form Page
// Renders assessment indicator form with dynamic schema-driven fields

"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { DynamicFormRenderer } from "@/components/features/forms/DynamicFormRenderer";
import {
  useGetIndicatorsIndicatorIdFormSchema,
  useGetIndicatorsIndicatorId,
} from "@vantage/shared";

export default function IndicatorFormPage() {
  const params = useParams();
  const router = useRouter();

  // Extract route parameters
  const assessmentId = Number(params.assessmentId);
  const indicatorId = Number(params.indicatorId);

  // Fetch indicator metadata for title and description
  const {
    data: indicatorData,
    isLoading: isLoadingIndicator,
    isError: isErrorIndicator,
    refetch: refetchIndicator,
  } = useGetIndicatorsIndicatorId(indicatorId, {
    query: {
      enabled: !!indicatorId,
    },
  });

  // Fetch form schema for the indicator
  const {
    data: formSchemaData,
    isLoading: isLoadingSchema,
    isError: isErrorSchema,
    refetch: refetchSchema,
  } = useGetIndicatorsIndicatorIdFormSchema(indicatorId, {
    query: {
      enabled: !!indicatorId,
    },
  });

  // Handle save success - could redirect or show confirmation
  const handleSaveSuccess = () => {
    // Could add additional logic here if needed
    // For now, the DynamicFormRenderer handles the toast notification
  };

  // Loading state
  if (isLoadingIndicator || isLoadingSchema) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>

        {/* Form Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Error state for indicator metadata
  if (isErrorIndicator) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Unable to load indicator information. Please try again.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchIndicator()}
              className="ml-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href="/blgu/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Error state for form schema
  if (isErrorSchema) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Unable to load form. Please try again.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSchema()}
              className="ml-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href="/blgu/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const indicator = indicatorData;
  const formSchema = formSchemaData?.form_schema;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header with Navigation */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/blgu/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href={`/blgu/assessment/${assessmentId}`}
            className="hover:text-foreground transition-colors"
          >
            Assessment
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {indicator?.indicator_code || `Indicator ${indicatorId}`}
          </span>
        </div>

        {/* Back Button */}
        <Button variant="outline" asChild>
          <Link href="/blgu/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Page Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {indicator?.title || "Assessment Form"}
          </h1>
          {indicator?.description && (
            <p className="text-muted-foreground">{indicator.description}</p>
          )}
        </div>
      </div>

      {/* Dynamic Form */}
      {formSchema ? (
        <DynamicFormRenderer
          formSchema={formSchema}
          assessmentId={assessmentId}
          indicatorId={indicatorId}
          onSaveSuccess={handleSaveSuccess}
        />
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No form schema available for this indicator. Please contact support.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
