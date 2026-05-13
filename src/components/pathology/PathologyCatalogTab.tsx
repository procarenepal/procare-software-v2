import React, { useState } from "react";
import {
  IoFileTrayFullOutline,
  IoOptionsOutline,
  IoFolderOpenOutline,
  IoScaleOutline,
  IoMedkitOutline
} from "react-icons/io5";
import { Button } from "@heroui/button";

import PathologyTemplatesTab from "./PathologyTemplatesTab";
import PathologyParametersTab from "./PathologyParametersTab";
import PathologyCategoriesTab from "./PathologyCategoriesTab";
import PathologyUnitsTab from "./PathologyUnitsTab";
import {
  PathologyTestTemplate,
  PathologyParameter,
  PathologyCategory,
  PathologyUnit
} from "@/types/models";

interface PathologyCatalogTabProps {
  templates: PathologyTestTemplate[];
  parameters: PathologyParameter[];
  categories: PathologyCategory[];
  units: PathologyUnit[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddTemplate: () => void;
  onEditTemplate: (t: PathologyTestTemplate) => void;
  onDeleteTemplate: (t: PathologyTestTemplate) => void;
  onAddParameter: () => void;
  onEditParameter: (p: PathologyParameter) => void;
  onDeleteParameter: (p: PathologyParameter) => void;
  onBulkDeleteParameter: (ids: string[]) => Promise<void>;
  onAddCategory: () => void;
  onEditCategory: (c: PathologyCategory) => void;
  onDeleteCategory: (c: PathologyCategory) => void;
  onAddSubCategory: (c: PathologyCategory) => void;

  onAddUnit: () => void;
  onEditUnit: (u: PathologyUnit) => void;
  onDeleteUnit: (u: PathologyUnit) => void;
  onBackfillRanges: () => void;
  onOpenSeeder: () => void;
}

export default function PathologyCatalogTab(props: PathologyCatalogTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"templates" | "parameters" | "categories" | "units">("templates");

  const subTabs = [
    { id: "templates", label: "Test Templates", icon: <IoFileTrayFullOutline /> },
    { id: "parameters", label: "Parameters", icon: <IoOptionsOutline /> },
    { id: "categories", label: "Categories", icon: <IoFolderOpenOutline /> },
    { id: "units", label: "Units", icon: <IoScaleOutline /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 bg-mountain-50 p-1 rounded-lg border border-mountain-200">
        <div className="flex items-center gap-1">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${activeSubTab === tab.id
                  ? "bg-white text-teal-700 shadow-sm border border-mountain-200"
                  : "text-mountain-500 hover:text-mountain-900 hover:bg-mountain-100/50"
                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            color="secondary"
            startContent={<IoMedkitOutline />}
            onClick={props.onOpenSeeder}
            className="font-semibold bg-secondary-50 hover:bg-secondary-100 border border-secondary-200"
          >
            Launch Seed Architect
          </Button>
        </div>
      </div>


      <div className="bg-white">
        {activeSubTab === "templates" && (
          <PathologyTemplatesTab
            filteredTemplates={props.templates}
            parameters={props.parameters}
            searchQuery={props.searchQuery}
            onSearchChange={props.onSearchChange}
            onAdd={props.onAddTemplate}
            onEdit={props.onEditTemplate}
            onDelete={props.onDeleteTemplate}
          />
        )}
        {activeSubTab === "parameters" && (
          <PathologyParametersTab
            filteredParameters={props.parameters}
            categories={props.categories}
            units={props.units}
            searchQuery={props.searchQuery}
            onSearchChange={props.onSearchChange}
            onAdd={props.onAddParameter}
            onEdit={props.onEditParameter}
            onDelete={props.onDeleteParameter}
            onBulkDelete={props.onBulkDeleteParameter}
            onBackfillRanges={props.onBackfillRanges}
          />
        )}
        {activeSubTab === "categories" && (
          <PathologyCategoriesTab
            filteredCategories={props.categories}
            searchQuery={props.searchQuery}
            onSearchChange={props.onSearchChange}
            onAdd={props.onAddCategory}
            onEdit={props.onEditCategory}
            onDelete={props.onDeleteCategory}
            onAddSubCategory={props.onAddSubCategory}
          />
        )}
        {activeSubTab === "units" && (
          <PathologyUnitsTab
            filteredUnits={props.units}
            searchQuery={props.searchQuery}
            onSearchChange={props.onSearchChange}
            onAdd={props.onAddUnit}
            onEdit={props.onEditUnit}
            onDelete={props.onDeleteUnit}
          />
        )}
      </div>
    </div>
  );
}
