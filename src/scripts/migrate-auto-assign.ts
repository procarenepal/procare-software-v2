// src/scripts/migrate-auto-assign.ts
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

import { db } from "../config/firebase";

async function migrateAutoAssignField() {
  console.log("🔄 Starting auto-assign field migration...");

  try {
    const pagesCollection = collection(db, "pages");
    const snapshot = await getDocs(pagesCollection);

    if (snapshot.empty) {
      console.log("📭 No pages found to migrate.");

      return;
    }

    let updatedCount = 0;
    const batch = [];

    // Define which pages should be auto-assigned by default
    const autoAssignPages = [
      "Dashboard",
      "Patients",
      "Appointments",
      "Billing",
      "Reports",
      "Settings",
    ];

    for (const pageDoc of snapshot.docs) {
      const pageData = pageDoc.data();

      // Check if autoAssign field already exists
      if (pageData.hasOwnProperty("autoAssign")) {
        console.log(
          `⏭️  Page "${pageData.name}" already has autoAssign field, skipping...`,
        );
        continue;
      }

      // Determine if this page should be auto-assigned
      const shouldAutoAssign = autoAssignPages.includes(pageData.name);

      // Update the document
      const pageRef = doc(db, "pages", pageDoc.id);

      batch.push(
        updateDoc(pageRef, {
          autoAssign: shouldAutoAssign,
        }),
      );

      console.log(
        `✅ Queued update for "${pageData.name}" - autoAssign: ${shouldAutoAssign}`,
      );
      updatedCount++;
    }

    // Execute all updates
    await Promise.all(batch);

    console.log(
      `🎉 Migration completed! Updated ${updatedCount} pages with autoAssign field.`,
    );
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  }
}

// Run the migration
migrateAutoAssignField()
  .then(() => {
    console.log("✨ Auto-assign field migration finished successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
