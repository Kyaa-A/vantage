"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
    useGetAssessorAssessmentsAssessmentId,
    useGetAssessorQueue,
    usePostAssessorAssessmentResponsesResponseIdMovs,
    usePostAssessorAssessmentResponsesResponseIdValidate,
    usePostAssessorAssessmentsAssessmentIdFinalize,
    usePostAssessorAssessmentsAssessmentIdRework
} from "@vantage/shared";

const assessorKeys = {
  all: ["assessor"] as const,
  queue: () => [...assessorKeys.all, "queue"] as const,
  assessmentDetails: (id: string) => [...assessorKeys.all, "assessment", id] as const,
};

export function useAssessorQueue() {
  return useGetAssessorQueue();
}

export function useAssessorAssessmentDetails(assessmentId: string) {
  return useGetAssessorAssessmentsAssessmentId(parseInt(assessmentId));
}

export function useAssessorValidationMutation(_assessmentId: string) {
  return usePostAssessorAssessmentResponsesResponseIdValidate({
    mutation: {
      onSuccess: () => {
        // Invalidate the assessment details query to refresh the data
        // This will be handled by the component using the mutation
      },
    },
  });
}

export function useAssessorMOVUploadMutation(_assessmentId: string) {
  return usePostAssessorAssessmentResponsesResponseIdMovs({
    mutation: {
      onSuccess: () => {
        // Invalidate the assessment details query to refresh the data
        // This will be handled by the component using the mutation
      },
    },
  });
}

export function useAssessorReworkMutation(assessmentId: string) {
  const queryClient = useQueryClient();
  
  return usePostAssessorAssessmentsAssessmentIdRework({
    mutation: {
      onSuccess: () => {
        // Invalidate the assessment details query to refresh the data
        queryClient.invalidateQueries({ 
          queryKey: assessorKeys.assessmentDetails(assessmentId) 
        });
        // Also invalidate the queue to reflect status changes
        queryClient.invalidateQueries({ 
          queryKey: assessorKeys.queue() 
        });
      },
    },
  });
}

export function useAssessorFinalizeMutation(assessmentId: string) {
  const queryClient = useQueryClient();
  
  return usePostAssessorAssessmentsAssessmentIdFinalize({
    mutation: {
      onSuccess: () => {
        // Invalidate the assessment details query to refresh the data
        queryClient.invalidateQueries({ 
          queryKey: assessorKeys.assessmentDetails(assessmentId) 
        });
        // Also invalidate the queue to reflect status changes
        queryClient.invalidateQueries({ 
          queryKey: assessorKeys.queue() 
        });
      },
    },
  });
}
