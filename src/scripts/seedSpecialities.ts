/**
 * Migration script to seed hardcoded specialities into the database
 * This script should be run once to migrate from hardcoded specialities to database-driven specialities
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import { specialityService } from "../services/specialityService";

// Firebase config - you'll need to replace this with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  // This is typically found in your firebase config file
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Hardcoded specialities that need to be migrated
const hardcodedSpecialities = [
  { key: "general-medicine", label: "General Medicine" },
  { key: "cardiology", label: "Cardiology" },
  { key: "orthopedics", label: "Orthopedics" },
  { key: "pediatrics", label: "Pediatrics" },
  { key: "neurology", label: "Neurology" },
  { key: "dermatology", label: "Dermatology" },
  { key: "ent", label: "ENT (Ear, Nose & Throat)" },
  { key: "gynecology", label: "Gynecology" },
  { key: "gastroenterology", label: "Gastroenterology" },
  { key: "ophthalmology", label: "Ophthalmology" },
  { key: "psychiatry", label: "Psychiatry" },
  { key: "endocrinology", label: "Endocrinology" },
  { key: "pulmonology", label: "Pulmonology" },
  { key: "urology", label: "Urology" },
  { key: "nephrology", label: "Nephrology" },
  { key: "oncology", label: "Oncology" },
  { key: "anesthesiology", label: "Anesthesiology" },
  { key: "radiology", label: "Radiology" },
  { key: "pathology", label: "Pathology" },
  { key: "emergency-medicine", label: "Emergency Medicine" },
];

/**
 * Seed specialities for a specific clinic
 * @param clinicId - The clinic ID to seed specialities for
 */
export async function seedSpecialitiesForClinic(clinicId: string) {
  console.log(`Starting to seed specialities for clinic: ${clinicId}`);

  try {
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < hardcodedSpecialities.length; i++) {
      const speciality = hardcodedSpecialities[i];

      try {
        // Check if speciality already exists
        const existingSpecialities =
          await specialityService.getSpecialitiesByClinic(clinicId);
        const exists = existingSpecialities.some(
          (existing) => existing.key === speciality.key,
        );

        if (exists) {
          console.log(
            `Speciality ${speciality.key} already exists, skipping...`,
          );
          skipCount++;
          continue;
        }

        // Create the speciality
        await specialityService.createSpeciality({
          name: speciality.label,
          key: speciality.key,
          description: `${speciality.label} speciality`,
          isActive: true,
          clinicId: clinicId,
        });

        console.log(`✓ Created speciality: ${speciality.label}`);
        successCount++;
      } catch (error) {
        console.error(
          `✗ Failed to create speciality ${speciality.label}:`,
          error,
        );
      }
    }

    console.log(`\nSeeding completed for clinic ${clinicId}:`);
    console.log(`  ✓ Successfully created: ${successCount} specialities`);
    console.log(`  - Skipped (already exists): ${skipCount} specialities`);
    console.log(
      `  ✗ Failed: ${hardcodedSpecialities.length - successCount - skipCount} specialities`,
    );

    return { successCount, skipCount };
  } catch (error) {
    console.error(`Error seeding specialities for clinic ${clinicId}:`, error);
    throw error;
  }
}

/**
 * Seed specialities for multiple clinics
 * @param clinicIds - Array of clinic IDs to seed specialities for
 */
export async function seedSpecialitiesForMultipleClinics(clinicIds: string[]) {
  console.log(`Starting to seed specialities for ${clinicIds.length} clinics`);

  const results = [];

  for (const clinicId of clinicIds) {
    try {
      const result = await seedSpecialitiesForClinic(clinicId);

      results.push({ clinicId, success: true, ...result });
    } catch (error) {
      console.error(
        `Failed to seed specialities for clinic ${clinicId}:`,
        error,
      );
      results.push({ clinicId, success: false, error: String(error) });
    }
  }

  console.log("\n=== FINAL RESULTS ===");
  results.forEach((result) => {
    if (result.success) {
      console.log(
        `✓ ${result.clinicId}: ${(result as any).successCount} created, ${(result as any).skipCount} skipped`,
      );
    } else {
      console.log(`✗ ${result.clinicId}: Failed - ${(result as any).error}`);
    }
  });

  return results;
}

// Example usage:
// To run this script, you can create a separate file or add it to your existing migration tools
// Example:
// seedSpecialitiesForClinic('your-clinic-id-here');
// or
// seedSpecialitiesForMultipleClinics(['clinic-1', 'clinic-2', 'clinic-3']);

export default {
  seedSpecialitiesForClinic,
  seedSpecialitiesForMultipleClinics,
  hardcodedSpecialities,
};
