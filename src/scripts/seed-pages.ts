// src/scripts/seed-pages.ts
import { collection, addDoc, Timestamp } from "firebase/firestore";

import { db } from "../config/firebase";

async function seedPages() {
  console.log("🌱 Seeding pages...");

  const pagesCollection = collection(db, "pages");

  // Default pages for testing
  const defaultPages = [
    {
      name: "Dashboard",
      path: "/dashboard",
      description: "Main dashboard overview",
      icon: "IoHomeOutline",
      isActive: true,
      order: 1,
      autoAssign: true, // Dashboard should be auto-assigned to all clinic types
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Patients",
      path: "/dashboard/patients",
      description: "Manage patient records",
      icon: "IoPeopleOutline",
      isActive: true,
      order: 2,
      autoAssign: true, // Patients management is essential for all clinics
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Appointments",
      path: "/dashboard/appointments",
      description: "Schedule and manage appointments",
      icon: "IoCalendarOutline",
      isActive: true,
      order: 3,
      autoAssign: true, // Appointments are essential for all clinics
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Appointment Billing",
      path: "/dashboard/appointments-billing",
      description: "Create and manage appointment invoices",
      icon: "IoReceiptOutline",
      isActive: true,
      order: 4,
      autoAssign: false, // Not all clinics may have billing enabled
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Doctors",
      path: "/dashboard/doctors",
      description: "Manage doctors and staff",
      icon: "IoMedicalOutline",
      isActive: true,
      order: 5,
      autoAssign: false, // Not all clinics may need doctor management (e.g., diagnostic centers)
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Billing",
      path: "/dashboard/billing",
      description: "Manage invoices and payments",
      icon: "IoWalletOutline",
      isActive: true,
      order: 6,
      autoAssign: true, // Billing is essential for most clinics
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Inventory",
      path: "/dashboard/inventory",
      description: "Manage medical supplies and equipment",
      icon: "IoBusinessOutline",
      isActive: true,
      order: 7,
      autoAssign: false, // Not all clinics may need inventory management
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Medicine Management",
      path: "/dashboard/medicine-management",
      description: "Manage medicines, brands, categories, stock, and suppliers",
      icon: "IoMedkitOutline",
      isActive: true,
      order: 8,
      autoAssign: false, // Only for clinics that sell medicines or handle prescriptions
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Reports",
      path: "/dashboard/reports",
      description: "View and generate reports",
      icon: "IoStatsChartOutline",
      isActive: true,
      order: 9,
      autoAssign: true, // Reports are important for all clinics
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      description: "Configure clinic settings",
      icon: "IoSettingsOutline",
      isActive: true,
      order: 10,
      autoAssign: true, // Settings access is essential for all clinics
      showInSidebar: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: "Appointment Settings",
      path: "/dashboard/settings/appointments",
      description:
        "Configure appointment types, working hours, and booking settings",
      icon: "IoTimeOutline",
      isActive: true,
      order: 11,
      autoAssign: false, // Optional setting page - not all clinics may need detailed appointment configuration
      showInSidebar: false, // This is a sub-page, accessed from main settings
      parentId: null, // Will be set programmatically to reference the Settings page
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];

  // Add each page to the database
  for (const page of defaultPages) {
    try {
      await addDoc(pagesCollection, page);
      console.log(`✅ Created page: ${page.name}`);
    } catch (error) {
      console.error(`❌ Error creating page ${page.name}:`, error);
    }
  }

  console.log("✨ Pages seeding completed!");
}

// Run the seed function
seedPages().catch(console.error);
