import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  IoPeopleOutline,
  IoBusinessOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoStarOutline,
  IoChevronForwardOutline,
  IoLinkOutline,
} from "react-icons/io5";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: "general" | "clinic" | "security" | "advanced";
}

const settingsSections: SettingsSection[] = [
  // {
  //   id: "theme",
  //   title: "Theme & Appearance",
  //   description: "Customize dashboard theme, colors, and visual preferences",
  //   icon: <IoColorPaletteOutline className="w-6 h-6" />,
  //   href: "/dashboard/settings/theme",
  //   category: "general",
  // },
  {
    id: "clinic-info",
    title: "Clinic Information",
    description: "Update clinic details, contact info, and operating hours",
    icon: <IoBusinessOutline className="w-6 h-6" />,
    href: "/dashboard/settings/clinic",
    category: "clinic",
  },
  {
    id: "staff-management",
    title: "Staff & User Management",
    description: "Manage clinic staff, roles, and permissions",
    icon: <IoPeopleOutline className="w-6 h-6" />,
    href: "/dashboard/settings/staff",
    category: "clinic",
  },
  {
    id: "appointment-settings",
    title: "Appointment Configuration",
    description: "Set appointment types, durations, and booking rules",
    icon: <IoTimeOutline className="w-6 h-6" />,
    href: "/dashboard/settings/appointments",
    category: "clinic",
  },
  {
    id: "medical-report-fields",
    title: "Medical Report Fields",
    description: "Configure custom fields for patient medical reports",
    icon: <IoDocumentTextOutline className="w-6 h-6" />,
    href: "/dashboard/settings/medical-report-fields",
    category: "clinic",
  },
  {
    id: "notes-sections",
    title: "Notes Sections",
    description: "Configure customizable note sections for patient records",
    icon: <IoDocumentTextOutline className="w-6 h-6" />,
    href: "/dashboard/settings/notes-sections",
    category: "clinic",
  },
  {
    id: "doctor-speciality",
    title: "Manage Doctor Speciality",
    description: "Configure medical specialties and subspecialties for doctors",
    icon: <IoStarOutline className="w-6 h-6" />,
    href: "/dashboard/settings/doctor-speciality",
    category: "clinic",
  },
  {
    id: "print-layout",
    title: "Print Layout Configuration",
    description:
      "Configure clinic letterhead, logo, and layout for receipts, prescriptions, and reports",
    icon: <IoDocumentTextOutline className="w-6 h-6" />,
    href: "/dashboard/settings/print-layout",
    category: "clinic",
  },
  {
    id: "referral-partners",
    title: "Referral Partners",
    description: "Manage external referral sources and commission rates",
    icon: <IoLinkOutline className="w-6 h-6" />,
    href: "/dashboard/settings/referral-partners",
    category: "clinic",
  },
];

const categoryLabels: Record<string, string> = {
  general: "General Settings",
  clinic: "Clinic Management",
};

export default function SettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredSections =
    selectedCategory === "all"
      ? settingsSections
      : settingsSections.filter(
        (section) => section.category === selectedCategory,
      );

  return (
    <div className="flex flex-col gap-4">
      {/* Page header — spec: clarity-page-header */}
      <div className="clarity-page-header">
        <div>
          <h1 className="clarity-page-title">Settings</h1>
          <p className="clarity-page-subtitle">
            Manage your clinic settings and preferences
          </p>
        </div>
        <div className="flex gap-2" />
      </div>

      {/* Filter tabs — clarity-card, clarity-btn */}
      <div className="clarity-card p-3">
        <div className="flex flex-wrap gap-2">
          <button
            className={`clarity-btn ${selectedCategory === "all" ? "clarity-btn-primary" : "clarity-btn-ghost"}`}
            type="button"
            onClick={() => setSelectedCategory("all")}
          >
            All Settings
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              className={`clarity-btn ${selectedCategory === key ? "clarity-btn-primary" : "clarity-btn-ghost"}`}
              type="button"
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => {
          const categorySections = filteredSections.filter(
            (section) => section.category === categoryKey,
          );

          if (
            categorySections.length === 0 ||
            (selectedCategory !== "all" && selectedCategory !== categoryKey)
          ) {
            return null;
          }

          return (
            <div key={categoryKey}>
              {selectedCategory === "all" && (
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="clarity-section-header flex-1">
                    {categoryLabel}
                  </h2>
                  <div className="clarity-divider flex-1" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categorySections.map((section) => (
                  <RouterLink
                    key={section.id}
                    className="clarity-card p-3 block group border border-[rgb(var(--color-border))] hover:bg-slate-50 hover:border-teal-200 transition-colors duration-200 rounded-[var(--card-radius)]"
                    to={section.href}
                  >
                    <div className="flex gap-3 pb-2">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-teal-100/80 group-hover:bg-teal-100 text-teal-700 transition-colors">
                        {section.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[13px] text-[rgb(var(--color-text))] truncate">
                          {section.title}
                        </h4>
                      </div>
                    </div>
                    <p className="text-sm text-[rgb(var(--color-text-muted))] mb-3 line-clamp-2">
                      {section.description}
                    </p>
                    <div className="flex items-center justify-end">
                      <span className="clarity-btn clarity-btn-tinted opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                        Configure
                        <IoChevronForwardOutline className="w-4 h-4" />
                      </span>
                    </div>
                  </RouterLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
