import React, { useState } from "react";
import {
  IoAddOutline,
  IoSearchOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoChevronDown,
  IoChevronForward,
} from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { PathologyCategory, PathologyParameter } from "@/types/models";

interface PathologyCategoriesTabProps {
  filteredCategories: PathologyCategory[];
  parameters: PathologyParameter[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (category: PathologyCategory) => void;
  onDelete: (category: PathologyCategory) => void;
  onAddSubCategory: (category: PathologyCategory) => void;
}

export default function PathologyCategoriesTab({
  filteredCategories,
  parameters = [],
  searchQuery,
  onSearchChange,
  onAdd,
  onEdit,
  onDelete,
  onAddSubCategory,
}: PathologyCategoriesTabProps) {
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mountain-400" />
          <input
            className="w-full h-[32px] pl-9 pr-3 border border-mountain-200 rounded text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
            placeholder="Search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button color="primary" startContent={<IoAddOutline />} onClick={onAdd}>
          New Pathology Category
        </Button>
      </div>

      {filteredCategories.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="clarity-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-mountain-50 border-b border-mountain-200">
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Name</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => {
                const isExpanded = expandedCategoryIds.includes(category.id);
                const categoryParams = parameters.filter(p => p.categoryId === category.id);

                return (
                  <React.Fragment key={category.id}>
                    <tr
                      className="hover:bg-mountain-50/40 border-b border-mountain-100 cursor-pointer"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-mountain-100 transition-colors shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCategory(category.id);
                            }}
                          >
                            {isExpanded ? (
                              <IoChevronDown className="w-4 h-4 text-mountain-500" />
                            ) : (
                              <IoChevronForward className="w-4 h-4 text-mountain-500" />
                            )}
                          </button>
                          <div>
                            <p className="text-[13.5px] font-semibold text-mountain-900 hover:text-teal-700 transition-colors">
                              {category.name}
                            </p>
                            <p className="text-[11px] text-mountain-400 font-medium">
                              {categoryParams.length} {categoryParams.length === 1 ? "parameter" : "parameters"} associated
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button
                            color="default"
                            size="sm"
                            startContent={<IoAddOutline />}
                            variant="flat"
                            onClick={() => onAddSubCategory(category)}
                            className="text-[12px] font-medium"
                          >
                            Add Parameter
                          </Button>
                          <Button
                            color="primary"
                            size="sm"
                            startContent={<IoCreateOutline />}
                            variant="flat"
                            onClick={() => onEdit(category)}
                            className="text-[12px] font-medium"
                          >
                            Edit
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            startContent={<IoTrashOutline />}
                            variant="flat"
                            onClick={() => onDelete(category)}
                            className="text-[12px] font-medium"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-mountain-50/15 border-b border-mountain-100">
                        <td colSpan={2} className="px-6 py-4">
                          <div className="border-l-[3px] border-teal-500 pl-4 py-1">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                                Associated Parameters ({categoryParams.length})
                              </p>
                            </div>
                            {categoryParams.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categoryParams.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between p-3 bg-white border border-mountain-200/70 rounded-md shadow-sm hover:border-teal-500/50 hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <p className="text-[13px] font-semibold text-mountain-900 truncate">
                                        {p.name}
                                      </p>
                                      <p className="text-[11px] text-mountain-400 font-medium">
                                        {p.unit ? `Unit: ${p.unit}` : "No Unit"}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-100/50 capitalize">
                                        {p.resultType}
                                      </span>
                                      {p.allRange?.description && (
                                        <p
                                          className="text-[10px] text-mountain-500 mt-1 max-w-[140px] truncate font-medium"
                                          title={p.allRange.description}
                                        >
                                          Ref: {p.allRange.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[12px] text-mountain-400 italic">
                                No parameters associated with this category yet. Click "Add Parameter" to get started.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-mountain-500 text-[13.5px]">
            {searchQuery
              ? "No categories found"
              : "No pathology categories yet"}
          </p>
        </div>
      )}
    </div>
  );
}
