/**
 * Assessment system types for BLGU pre-assessment workflow
 */

import { FormSchema } from "./form-schema";

export type AssessmentStatus =
  | "Draft"
  | "Submitted for Review"
  | "Validated"
  | "Needs Rework";

export type ComplianceAnswer = "yes" | "no" | "na";

export type IndicatorStatus = "not_started" | "completed" | "needs_rework";

export interface GovernanceArea {
  id: string;
  name: string;
  code: string;
  description: string;
  isCore: boolean; // Core areas must pass all 3, Essential areas must pass 1 of 3
  indicators: Indicator[];
}

export interface Indicator {
  id: string;
  code: string; // e.g., "3.1.1"
  name: string;
  description: string;
  technicalNotes: string;
  governanceAreaId: string;
  status: IndicatorStatus;
  complianceAnswer?: ComplianceAnswer;
  movFiles: MOVFile[];
  assessorComment?: string; // Only present when status is 'needs_rework'
  formSchema: FormSchema; // Dynamic form schema for the indicator
  responseData?: Record<string, unknown>; // Form response data
  requiresRework?: boolean; // Editable during Needs Rework when true
  responseId?: number | null; // Backend response id for mutations
}

export interface MOVFile {
  id: string;
  name: string; // API returns name instead of filename
  size: number;
  url: string;
  storagePath?: string; // Supabase storage path for deletion
  uploadedAt?: string; // Make uploadedAt optional since API doesn't always return it
}

export interface Assessment {
  id: string;
  barangayId: string;
  barangayName: string;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  governanceAreas: GovernanceArea[];
  totalIndicators: number;
  completedIndicators: number;
  needsReworkIndicators: number;
}

export interface AssessmentValidation {
  isComplete: boolean;
  missingIndicators: string[];
  missingMOVs: string[];
  canSubmit: boolean;
}

// Mock data for development
export const MOCK_GOVERNANCE_AREAS: GovernanceArea[] = [
  {
    id: "financial-admin",
    name: "Financial Administration and Sustainability",
    code: "FA",
    description: "Financial management and sustainability practices",
    isCore: true,
    indicators: [
      {
        id: "fa-1",
        code: "1.1.1",
        name: "Structure: Organized BADAC",
        description:
          "The barangay has an organized Barangay Anti-Drug Abuse Council (BADAC) with proper documentation.",
        technicalNotes:
          "BADAC must be established through a barangay resolution and have regular meetings documented.",
        governanceAreaId: "financial-admin",
        status: "not_started",
        movFiles: [],
        formSchema: {
          properties: {
            compliance: {
              type: "string" as const,
              title: "Compliance",
              description: "Is this indicator compliant?",
              required: true,
              enum: ["yes", "no", "na"],
            },
          },
        },
      },
      {
        id: "fa-2",
        code: "1.1.2",
        name: "Budget Planning and Execution",
        description:
          "The barangay has a comprehensive budget plan that is properly executed and monitored.",
        technicalNotes:
          "Budget documents must include detailed breakdown of income and expenditures with proper accounting.",
        governanceAreaId: "financial-admin",
        status: "not_started",
        movFiles: [],
        formSchema: {
          properties: {
            compliance: {
              type: "string" as const,
              title: "Compliance",
              description: "Is this indicator compliant?",
              required: true,
              enum: ["yes", "no", "na"],
            },
          },
        },
      },
    ],
  },
  {
    id: "disaster-preparedness",
    name: "Disaster Preparedness",
    code: "DP",
    description: "Disaster risk reduction and management capabilities",
    isCore: true,
    indicators: [
      {
        id: "dp-1",
        code: "2.1.1",
        name: "Disaster Risk Reduction Plan",
        description:
          "The barangay has a comprehensive disaster risk reduction and management plan.",
        technicalNotes:
          "Plan must be approved by the Sangguniang Barangay and include evacuation procedures.",
        governanceAreaId: "disaster-preparedness",
        status: "not_started",
        movFiles: [],
        formSchema: {
          properties: {
            compliance: {
              type: "string" as const,
              title: "Compliance",
              description: "Is this indicator compliant?",
              required: true,
              enum: ["yes", "no", "na"],
            },
          },
        },
      },
    ],
  },
  {
    id: "peace-order",
    name: "Safety, Peace and Order",
    code: "PO",
    description: "Public safety and peace maintenance",
    isCore: true,
    indicators: [
      {
        id: "po-1",
        code: "3.1.1",
        name: "Peace and Order Committee",
        description:
          "The barangay has an active peace and order committee with regular activities.",
        technicalNotes:
          "Committee must have documented meetings and community engagement activities.",
        governanceAreaId: "peace-order",
        status: "not_started",
        movFiles: [],
        formSchema: {
          properties: {
            compliance: {
              type: "string" as const,
              title: "Compliance",
              description: "Is this indicator compliant?",
              required: true,
              enum: ["yes", "no", "na"],
            },
          },
        },
      },
    ],
  },
  {
    id: "social-protection",
    name: "Social Protection and Sensitivity",
    code: "SP",
    description: "Social welfare and community sensitivity programs",
    isCore: false,
    indicators: [
      {
        id: "sp-1",
        code: "4.1.1",
        name: "Social Welfare Programs",
        description:
          "The barangay implements social welfare programs for vulnerable sectors.",
        technicalNotes:
          "Programs must be documented with beneficiary lists and impact assessments.",
        governanceAreaId: "social-protection",
        status: "not_started",
        movFiles: [],
        formSchema: {
          properties: {
            compliance: {
              type: "string" as const,
              title: "Compliance",
              description: "Is this indicator compliant?",
              required: true,
              enum: ["yes", "no", "na"],
            },
          },
        },
      },
    ],
  },
  {
    id: "business-friendliness",
    name: "Business-Friendliness and Competitiveness",
    code: "BF",
    description: "Support for local business development",
    isCore: false,
    indicators: [
      {
        id: "bf-1",
        code: "5.1.1",
        name: "Business Support Services",
        description:
          "The barangay provides support services for local businesses and entrepreneurs.",
        technicalNotes:
          "Services must be documented and accessible to all business owners in the barangay.",
        governanceAreaId: "business-friendliness",
        status: "not_started",
        movFiles: [],
        formSchema: {
          properties: {
            compliance: {
              type: "string" as const,
              title: "Compliance",
              description: "Is this indicator compliant?",
              required: true,
              enum: ["yes", "no", "na"],
            },
          },
        },
      },
    ],
  },
  {
    id: "environmental-management",
    name: "Environmental Management",
    code: "EM",
    description: "Environmental protection and sustainability",
    isCore: false,
    indicators: [
      {
        id: "em-1",
        code: "6.1.1",
        name: "Environmental Programs",
        description:
          "The barangay implements environmental protection and sustainability programs.",
        technicalNotes:
          "Programs must include waste management, tree planting, or similar environmental initiatives.",
        governanceAreaId: "environmental-management",
        status: "not_started",
        movFiles: [],
        formSchema: {
          properties: {
            compliance: {
              type: "string" as const,
              title: "Compliance",
              description: "Is this indicator compliant?",
              required: true,
              enum: ["yes", "no", "na"],
            },
          },
        },
      },
    ],
  },
];

export const MOCK_ASSESSMENT: Assessment = {
  id: "assessment-1",
  barangayId: "barangay-1",
  barangayName: "Barangay Sulop",
  status: "Draft",
  createdAt: "2024-01-15T00:00:00Z",
  updatedAt: "2024-01-20T00:00:00Z",
  governanceAreas: MOCK_GOVERNANCE_AREAS,
  totalIndicators: 6,
  completedIndicators: 0,
  needsReworkIndicators: 0,
};
