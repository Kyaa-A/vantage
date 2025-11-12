/**
 * Governance Area Logo Mapping and Utilities
 * Maps governance area codes to their official DILG logo assets
 */

export const GOVERNANCE_AREA_LOGOS: Record<string, string> = {
  FI: "/Assessment_Areas/financialAdmin.png",
  DI: "/Assessment_Areas/disasterPreparedness.png",
  SA: "/Assessment_Areas/safetyPeaceAndOrder.png",
  SO: "/Assessment_Areas/socialProtectAndSensitivity.png",
  BU: "/Assessment_Areas/businessFriendliness.png",
  EN: "/Assessment_Areas/environmentalManagement.png",
} as const;

/**
 * Get the logo path for a governance area code
 * Returns null if no logo is found (fallback to folder icon)
 */
export function getGovernanceAreaLogo(code: string): string | null {
  return GOVERNANCE_AREA_LOGOS[code.toUpperCase()] || null;
}

/**
 * Get all governance area codes with logos
 */
export function getAvailableLogoCodes(): string[] {
  return Object.keys(GOVERNANCE_AREA_LOGOS);
}

/**
 * Check if a governance area has a logo
 */
export function hasGovernanceAreaLogo(code: string): boolean {
  return code.toUpperCase() in GOVERNANCE_AREA_LOGOS;
}
