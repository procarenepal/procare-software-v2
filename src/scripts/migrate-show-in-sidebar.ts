// src/scripts/migrate-show-in-sidebar.ts
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

import { db } from "../config/firebase";

async function migrateShowInSidebarField() {
  console.log("🔄 Starting showInSidebar field migration...");

  try {
    const pagesCollection = collection(db, "pages");
    const snapshot = await getDocs(pagesCollection);

    if (snapshot.empty) {
      console.log("📭 No pages found to migrate.");

      return;
    }

    let updatedCount = 0;

    for (const pageDoc of snapshot.docs) {
      const pageData = pageDoc.data();

      // Check if showInSidebar field already exists
      if (pageData.hasOwnProperty("showInSidebar")) {
        console.log(
          `⏭️  Page "${pageData.name}" already has showInSidebar field, skipping...`,
        );
        continue;
      }

      // Default to true for all existing pages (they were all showing before)
      const pageRef = doc(db, "pages", pageDoc.id);

      await updateDoc(pageRef, {
        showInSidebar: true,
      });

      console.log(`✅ Updated "${pageData.name}" - showInSidebar: true`);
      updatedCount++;
    }

    console.log(`✨ Migration completed! Updated ${updatedCount} pages.`);

    if (updatedCount === 0) {
      console.log("🎉 All pages already had the showInSidebar field!");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration
migrateShowInSidebarField().catch(console.error);
