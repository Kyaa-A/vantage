"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Assessment, AssessmentValidation } from "@/types/assessment";
import { useSubmitAssessment } from "@/hooks/useAssessment";
import { CheckCircle, AlertCircle, Clock, TrendingUp, FileText, Send, Info } from "lucide-react";

interface AssessmentHeaderProps {
  assessment: Assessment;
  validation: AssessmentValidation;
}

export function AssessmentHeader({ assessment, validation }: AssessmentHeaderProps) {
  const submitMutation = useSubmitAssessment();

  const getStatusIcon = () => {
    switch (assessment.status) {
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'needs_rework':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'submitted':
      case 'validated':
      case 'finalized':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (assessment.status) {
      case 'in_progress':
        return 'In Progress';
      case 'needs_rework':
        return 'Needs Rework';
      case 'submitted':
        return 'Submitted for Review';
      case 'validated':
        return 'Validated';
      case 'finalized':
        return 'Finalized';
      default:
        return 'Unknown';
    }
  };

  const getTooltipContent = () => {
    if (validation.missingIndicators.length > 0) {
      return (
        <div>
          <p className="font-medium mb-2">Missing indicator responses:</p>
          <ul className="text-sm space-y-1">
            {validation.missingIndicators.slice(0, 3).map((indicator, index) => (
              <li key={index}>• {indicator}</li>
            ))}
            {validation.missingIndicators.length > 3 && (
              <li>• ... and {validation.missingIndicators.length - 3} more</li>
            )}
          </ul>
        </div>
      );
    }

    if (validation.missingMOVs.length > 0) {
      return (
        <div>
          <p className="font-medium mb-2">Missing MOV files:</p>
          <ul className="text-sm space-y-1">
            {validation.missingMOVs.slice(0, 3).map((indicator, index) => (
              <li key={index}>• {indicator}</li>
            ))}
            {validation.missingMOVs.length > 3 && (
              <li>• ... and {validation.missingMOVs.length - 3} more</li>
            )}
          </ul>
        </div>
      );
    }

    return "Please complete all indicators and upload required MOVs before submitting.";
  };

  const progressPercentage = Math.round((assessment.completedIndicators / assessment.totalIndicators) * 100);

  const getStatusConfig = () => {
    switch (assessment.status) {
      case 'in_progress':
        return {
          bgGradient: 'bg-[var(--card)]',
          accentColor: 'text-blue-600',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'needs_rework':
        return {
          bgGradient: 'bg-[var(--card)]',
          accentColor: 'text-amber-600',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'submitted':
        return {
          bgGradient: 'bg-[var(--card)]',
          accentColor: 'text-purple-600',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'validated':
      case 'finalized':
        return {
          bgGradient: 'bg-[var(--card)]',
          accentColor: 'text-emerald-600',
          badgeClass: 'bg-green-100 text-green-800 border-green-200'
        };
      default:
        return {
          bgGradient: 'bg-[var(--card)]',
          accentColor: 'text-gray-600',
          badgeClass: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`relative overflow-hidden ${statusConfig.bgGradient} border border-[var(--border)] rounded-sm shadow-lg p-8`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--cityscape-yellow)]/5 rounded-full -translate-y-20 translate-x-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--cityscape-yellow)]/3 rounded-full translate-y-16 -translate-x-16"></div>
      
      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          {/* Left side - Title and Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                SGLGB Pre-Assessment for <span className="bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] bg-clip-text text-transparent">{assessment.barangayName}</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm border ${statusConfig.badgeClass} backdrop-blur-sm`}>
                {getStatusIcon()}
                <span className="text-sm font-semibold">
                  {getStatusText()}
                </span>
              </div>
              
              <div className="bg-[var(--hover)] backdrop-blur-sm px-4 py-2 rounded-sm border border-[var(--border)]">
                <span className="text-sm text-[var(--text-secondary)]">
                  <FileText className="inline h-4 w-4 mr-1" />
                  {assessment.completedIndicators} of {assessment.totalIndicators} indicators completed
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Stats and Submit Button */}
          <div className="flex flex-col items-end gap-4">
            {/* Progress Stats */}
            <div className="flex items-center gap-6">
              <div className="bg-[var(--card)]/80 backdrop-blur-sm rounded-sm p-4 text-center shadow-sm border border-[var(--border)]">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {assessment.completedIndicators}
                </div>
                <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Completed</div>
              </div>
              <div className="bg-[var(--card)]/80 backdrop-blur-sm rounded-sm p-4 text-center shadow-sm border border-[var(--border)]">
                <div className="text-3xl font-bold text-[var(--foreground)]">
                  {assessment.totalIndicators - assessment.completedIndicators}
                </div>
                <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Remaining</div>
              </div>
              <div className="bg-[var(--card)]/80 backdrop-blur-sm rounded-sm p-4 text-center shadow-sm border border-[var(--border)]">
                <div className="text-3xl font-bold bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] bg-clip-text text-transparent">
                  {progressPercentage}%
                </div>
                <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Complete</div>
              </div>
            </div>

            {/* Submit Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => submitMutation.mutate()}
                      disabled={!validation.canSubmit || submitMutation.isPending}
                      className="h-12 px-8 text-sm font-semibold bg-[var(--cityscape-yellow)] hover:bg-[var(--cityscape-yellow-dark)] text-[var(--cityscape-accent-foreground)] rounded-sm shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit for Review
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!validation.canSubmit && (
                  <TooltipContent side="bottom" className="max-w-sm bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] shadow-xl">
                    <div className="p-2">
                      {getTooltipContent()}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

                      {/* Enhanced Progress Section */}
              <div className="bg-[var(--hover)] backdrop-blur-sm rounded-sm p-6 border border-[var(--border)]">
                       <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <TrendingUp className="h-5 w-5 text-blue-600" />
                 <span className="text-lg font-semibold text-[var(--foreground)]">Assessment Progress</span>
               </div>
               <div className="text-right">
                 <div className="text-2xl font-bold text-[var(--foreground)]">{progressPercentage}%</div>
                 <div className="text-xs text-[var(--text-secondary)]">Overall Completion</div>
               </div>
             </div>
          
          <div className="space-y-3">
                            <div className="w-full bg-[var(--border)]/80 rounded-sm h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--cityscape-yellow)] to-[var(--cityscape-yellow-dark)] rounded-sm transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
                         <div className="flex justify-between text-sm">
               <span className="text-[var(--text-secondary)]">
                 {assessment.completedIndicators} indicators completed
               </span>
               <span className="text-[var(--text-secondary)]">
                 {assessment.totalIndicators - assessment.completedIndicators} remaining
               </span>
             </div>
          </div>

                     {/* Validation Info */}
           {(!validation.canSubmit && (validation.missingIndicators.length > 0 || validation.missingMOVs.length > 0)) && (
             <div className="mt-4 p-4 bg-[var(--cityscape-yellow)]/10 border border-[var(--cityscape-yellow)]/20 rounded-sm">
               <div className="flex items-start gap-3">
                 <Info className="h-5 w-5 text-[var(--cityscape-yellow)] mt-0.5 flex-shrink-0" />
                 <div className="space-y-2">
                   <p className="text-sm font-medium text-[var(--foreground)]">Complete the following to submit:</p>
                   {validation.missingIndicators.length > 0 && (
                     <div>
                       <p className="text-xs text-[var(--cityscape-yellow)] font-medium">Missing Responses ({validation.missingIndicators.length}):</p>
                       <p className="text-xs text-[var(--text-secondary)]">
                         {validation.missingIndicators.slice(0, 2).join(', ')}
                         {validation.missingIndicators.length > 2 && ` and ${validation.missingIndicators.length - 2} more`}
                       </p>
                     </div>
                   )}
                   {validation.missingMOVs.length > 0 && (
                     <div>
                       <p className="text-xs text-[var(--cityscape-yellow)] font-medium">Missing MOV Files ({validation.missingMOVs.length}):</p>
                       <p className="text-xs text-[var(--text-secondary)]">
                         {validation.missingMOVs.slice(0, 2).join(', ')}
                         {validation.missingMOVs.length > 2 && ` and ${validation.missingMOVs.length - 2} more`}
                       </p>
                     </div>
                   )}
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
} 