/**
 * Shared Print Layout Configuration Interface
 * This interface is used by both the print layout configuration page
 * and the PrintLayout component to ensure perfect synchronization.
 */
export interface PrintLayoutConfig {
  id?: string;
  clinicId: string;

  // Clinic Information
  clinicName: string;
  tagline?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;

  // Logo and Branding
  logoUrl?: string;
  logoPosition: "left" | "center" | "right";
  logoSize: "small" | "medium" | "large";

  // Layout Settings
  headerHeight: "compact" | "standard" | "expanded";
  footerText?: string;
  showFooter: boolean;

  // Content spacing when printing without letterhead (for preprinted paper)
  contentTopMarginWithoutLetterheadMm?: number;

  // Default behavior for pathology reports
  defaultPathologyPrintWithoutLetterhead?: boolean;

  // Print Options (hidden from UI but used internally)
  paperSize: "A4" | "Letter" | "A5";
  margins: "narrow" | "normal" | "wide";
  fontSize: "small" | "medium" | "large";

  // Colors (for colored prints)
  primaryColor?: string;
  secondaryColor?: string;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy: string;
}

/**
 * Default Print Layout Configuration
 * Provides sensible defaults for new clinics
 */
export const DEFAULT_PRINT_LAYOUT: Omit<
  PrintLayoutConfig,
  "clinicId" | "updatedBy"
> = {
  clinicName: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "Nepal",
  phone: "",
  email: "",
  logoPosition: "left",
  logoSize: "medium",
  headerHeight: "standard",
  showFooter: true,
  paperSize: "A4",
  margins: "normal",
  fontSize: "medium",
  primaryColor: "#0ea5e9",
  secondaryColor: "#64748b",
  contentTopMarginWithoutLetterheadMm: 20,
  defaultPathologyPrintWithoutLetterhead: false,
};

/**
 * Creates a new print layout configuration with defaults
 * @param clinicId - The clinic ID
 * @param userId - The user ID who is creating/updating the config
 * @param overrides - Any specific values to override
 * @returns Complete PrintLayoutConfig with defaults
 */
export function createPrintLayoutConfig(
  clinicId: string,
  userId: string,
  overrides: Partial<PrintLayoutConfig> = {},
): PrintLayoutConfig {
  return {
    ...DEFAULT_PRINT_LAYOUT,
    clinicId,
    updatedBy: userId,
    ...overrides,
  };
}

/**
 * Validates that a print layout configuration has all required fields
 * @param config - The configuration to validate
 * @returns True if valid, throws error if invalid
 */
export function validatePrintLayoutConfig(
  config: Partial<PrintLayoutConfig>,
): config is PrintLayoutConfig {
  const required: (keyof PrintLayoutConfig)[] = [
    "clinicId",
    "updatedBy",
    "clinicName",
  ];

  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return true;
}
