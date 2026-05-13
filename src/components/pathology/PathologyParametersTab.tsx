import React from "react";
import {
  IoSearchOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoOptionsOutline,
} from "react-icons/io5";

import { Button } from "@/components/ui/button";
import {
  PathologyParameter,
  PathologyUnit,
  PathologyCategory,
  ReferenceRange,
} from "@/types/models";

interface PathologyParametersTabProps {
  filteredParameters: PathologyParameter[];
  categories: PathologyCategory[];
  units: PathologyUnit[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (parameter: PathologyParameter) => void;
  onDelete: (parameter: PathologyParameter) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBackfillRanges?: () => void;
}

const formatRange = (range?: ReferenceRange) => {
  if (!range) return "—";
  if (range.description) return range.description;
  if (range.min !== undefined && range.max !== undefined) return `${range.min} - ${range.max}`;
  if (range.min !== undefined) return `> ${range.min}`;
  if (range.max !== undefined) return `< ${range.max}`;
  if (range.normalValue) return range.normalValue;
  return "—";
};

export default function PathologyParametersTab({
  filteredParameters,
  categories,
  units,
  searchQuery,
  onSearchChange,
  onAdd,
  onEdit,
  onDelete,
  onBulkDelete,
  onBackfillRanges,
}: PathologyParametersTabProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredParameters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredParameters.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedIds.length > 0) {
      await onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mountain-400" />
            <input
              className="w-full h-[32px] pl-9 pr-3 border border-mountain-200 rounded text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
              placeholder="Search parameters..."
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {selectedIds.length > 0 && (
            <Button 
              color="danger" 
              variant="flat" 
              size="sm" 
              startContent={<IoTrashOutline />}
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onBackfillRanges && (
            <Button color="secondary" variant="flat" size="sm" onClick={onBackfillRanges}>
              Fix Flagging Ranges
            </Button>
          )}
          <Button color="primary" size="sm" startContent={<IoOptionsOutline />} onClick={onAdd}>
            Configure Parameter
          </Button>
        </div>
      </div>

      {filteredParameters.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-mountain-200">
          <table className="clarity-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-mountain-50 border-b border-mountain-200">
                <th className="px-4 py-2.5 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-mountain-300 text-teal-600 focus:ring-teal-500"
                    checked={selectedIds.length === filteredParameters.length && filteredParameters.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Parameter Name</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Category</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Type</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Reference Range(s)</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Unit</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const grouped = filteredParameters.reduce((acc: Record<string, PathologyParameter[]>, p) => {
                  const catId = p.categoryId || "uncategorized";
                  if (!acc[catId]) acc[catId] = [];
                  acc[catId].push(p);
                  return acc;
                }, {});

                return Object.entries(grouped).map(([catId, params], groupIdx) => {
                  const category = categories.find(c => c.id === catId);
                  return (
                    <React.Fragment key={catId}>
                      {/* Section Divider Header */}
                      <tr className={`${groupIdx > 0 ? 'border-t-[12px] border-white' : ''} bg-mountain-100/60`}>
                        <td colSpan={7} className="px-4 py-3 border-y border-mountain-200">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-teal-600 rounded-full" />
                            <span className="text-[12px] font-semibold text-teal-900">
                              {category?.name || "Uncategorized Parameters"}
                            </span>
                            <span className="text-[10px] font-medium text-mountain-400 ml-2">
                              ({params.length} Items)
                            </span>
                          </div>
                        </td>
                      </tr>
                      
                      {params.map((parameter) => {
                        const unitObj = units.find((u) => u.id === parameter.unit);
                        return (
                          <tr
                            key={parameter.id}
                            className={`hover:bg-mountain-50/40 border-b border-mountain-100 transition-colors group ${selectedIds.includes(parameter.id) ? 'bg-teal-50/30' : ''}`}
                          >
                            <td className="px-4 py-4">
                              <input 
                                type="checkbox" 
                                className="rounded border-mountain-300 text-teal-600 focus:ring-teal-500"
                                checked={selectedIds.includes(parameter.id)}
                                onChange={() => toggleSelect(parameter.id)}
                              />
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-[13.5px] font-semibold text-mountain-900 group-hover:text-teal-700 transition-colors">
                                {parameter.name}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-[12px] text-mountain-600">
                                {category?.name || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                parameter.resultType === 'numeric' ? 'text-teal-600 bg-teal-50' : 
                                parameter.resultType === 'calculated' ? 'text-indigo-600 bg-indigo-50' :
                                'text-mountain-600 bg-mountain-50'
                              }`}>
                                {parameter.resultType}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {parameter.isGenderSensitive ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-blue-600 w-4">M:</span>
                                    <span className="text-[12px] text-mountain-700 font-medium">{formatRange(parameter.maleRange)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-pink-600 w-4">F:</span>
                                    <span className="text-[12px] text-mountain-700 font-medium">{formatRange(parameter.femaleRange)}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[12px] text-mountain-700 font-medium">{formatRange(parameter.allRange)}</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded border border-teal-100 bg-teal-50 text-teal-700 text-[11px] font-medium">
                                {unitObj?.name || parameter.unit || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  color="primary"
                                  size="sm"
                                  isIconOnly
                                  startContent={<IoCreateOutline />}
                                  variant="flat"
                                  className="h-8 w-8 min-w-0"
                                  onClick={() => onEdit(parameter)}
                                />
                                <Button
                                  color="danger"
                                  size="sm"
                                  isIconOnly
                                  startContent={<IoTrashOutline />}
                                  variant="flat"
                                  className="h-8 w-8 min-w-0"
                                  onClick={() => onDelete(parameter)}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-mountain-50/30 rounded-lg border-2 border-dashed border-mountain-200">
          <IoOptionsOutline className="w-12 h-12 text-mountain-200 mb-4" />
          <p className="text-mountain-500 font-medium">
            {searchQuery ? "No matching parameters found" : "No pathology parameters configured yet"}
          </p>
        </div>
      )}
    </div>
  );
}

