// src/utils/pageStats.ts
import { Page } from "@/types/models";
import { pageService } from "@/services/pageService";
import { clinicTypeService } from "@/services/clinicTypeService";

export interface PageStatistics {
  totalPages: number;
  activePages: number;
  autoAssignPages: number;
  inactivePages: number;
  autoAssignPercentage: number;
}

export interface ClinicTypePageStats {
  clinicTypeId: string;
  clinicTypeName: string;
  totalAssignedPages: number;
  autoAssignedPages: number;
  manuallyAssignedPages: number;
}

/**
 * Get overall page statistics
 */
export async function getPageStatistics(): Promise<PageStatistics> {
  try {
    const pages = await pageService.getAllPages();

    const totalPages = pages.length;
    const activePages = pages.filter((p) => p.isActive).length;
    const autoAssignPages = pages.filter(
      (p) => p.autoAssign && p.isActive,
    ).length;
    const inactivePages = pages.filter((p) => !p.isActive).length;
    const autoAssignPercentage =
      activePages > 0 ? (autoAssignPages / activePages) * 100 : 0;

    return {
      totalPages,
      activePages,
      autoAssignPages,
      inactivePages,
      autoAssignPercentage: Math.round(autoAssignPercentage * 100) / 100,
    };
  } catch (error) {
    console.error("Error getting page statistics:", error);
    throw error;
  }
}

/**
 * Get page assignment statistics for all clinic types
 */
export async function getClinicTypePageStats(): Promise<ClinicTypePageStats[]> {
  try {
    const [clinicTypes, autoAssignPages] = await Promise.all([
      clinicTypeService.getAllClinicTypes(),
      pageService.getPagesForAutoAssign(),
    ]);

    const stats: ClinicTypePageStats[] = [];

    for (const clinicType of clinicTypes) {
      const assignments = await pageService.getClinicTypePageAssignments(
        clinicType.id,
      );
      const enabledAssignments = assignments.filter((a) => a.isEnabled);

      const autoAssignedCount = enabledAssignments.filter((assignment) =>
        autoAssignPages.some((page) => page.id === assignment.pageId),
      ).length;

      stats.push({
        clinicTypeId: clinicType.id,
        clinicTypeName: clinicType.name,
        totalAssignedPages: enabledAssignments.length,
        autoAssignedPages: autoAssignedCount,
        manuallyAssignedPages: enabledAssignments.length - autoAssignedCount,
      });
    }

    return stats;
  } catch (error) {
    console.error("Error getting clinic type page statistics:", error);
    throw error;
  }
}

/**
 * Get pages that would be auto-assigned to a new clinic type
 */
export async function getAutoAssignPreview(): Promise<Page[]> {
  try {
    return await pageService.getPagesForAutoAssign();
  } catch (error) {
    console.error("Error getting auto-assign preview:", error);
    throw error;
  }
}

/**
 * Validate that essential pages are marked for auto-assignment
 */
export async function validateAutoAssignConfiguration(): Promise<{
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
}> {
  try {
    const pages = await pageService.getAllPages();
    const autoAssignPages = pages.filter((p) => p.autoAssign && p.isActive);

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Essential pages that should typically be auto-assigned
    const essentialPages = ["Dashboard", "Patients", "Appointments"];
    const missingEssential = essentialPages.filter(
      (essential) => !autoAssignPages.some((page) => page.name === essential),
    );

    if (missingEssential.length > 0) {
      warnings.push(
        `Essential pages not set for auto-assignment: ${missingEssential.join(", ")}`,
      );
      recommendations.push(
        "Consider enabling auto-assignment for essential pages to ensure new clinic types have core functionality",
      );
    }

    // Check if any auto-assign pages are inactive
    const inactiveAutoAssign = pages.filter((p) => p.autoAssign && !p.isActive);

    if (inactiveAutoAssign.length > 0) {
      warnings.push(
        `Inactive pages are marked for auto-assignment: ${inactiveAutoAssign.map((p) => p.name).join(", ")}`,
      );
      recommendations.push(
        "Remove auto-assignment from inactive pages or reactivate them",
      );
    }

    // Check if too few or too many pages are auto-assigned
    if (autoAssignPages.length === 0) {
      warnings.push("No pages are set for auto-assignment");
      recommendations.push(
        "Enable auto-assignment for at least essential pages to improve new clinic type setup experience",
      );
    } else if (
      autoAssignPages.length === pages.filter((p) => p.isActive).length
    ) {
      warnings.push("All active pages are set for auto-assignment");
      recommendations.push(
        "Consider whether all pages are truly essential for every clinic type",
      );
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations,
    };
  } catch (error) {
    console.error("Error validating auto-assign configuration:", error);
    throw error;
  }
}
