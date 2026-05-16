import {
  IoSearchOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoFileTrayFullOutline,
} from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { PathologyTestTemplate, PathologyParameter } from "@/types/models";

interface PathologyTemplatesTabProps {
  filteredTemplates: PathologyTestTemplate[];
  parameters: PathologyParameter[];
  categories: any[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (template: PathologyTestTemplate) => void;
  onDelete: (template: PathologyTestTemplate) => void;
}

export default function PathologyTemplatesTab({
  filteredTemplates,
  parameters,
  categories,
  searchQuery,
  onSearchChange,
  onAdd,
  onEdit,
  onDelete,
}: PathologyTemplatesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mountain-400" />
          <input
            className="w-full h-[32px] pl-9 pr-3 border border-mountain-200 rounded text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
            placeholder="Search test templates (e.g. CBC)..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button color="primary" size="sm" startContent={<IoFileTrayFullOutline />} onClick={onAdd}>
          New Test Template
        </Button>
      </div>

      {filteredTemplates.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-mountain-200">
          <table className="clarity-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-mountain-50 border-b border-mountain-200">
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Test Name</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Category</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Included Parameters</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Price (NPR)</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => (
                <tr
                  key={template.id}
                  className="hover:bg-mountain-50/40 border-b border-mountain-100 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-[13.5px] font-semibold text-mountain-900 flex items-center gap-2">
                        {template.name}
                        {template.isMicrobiology && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-[9px] font-black uppercase tracking-tighter">
                            Micro
                          </span>
                        )}
                      </p>
                      {template.shortName && (
                        <p className="text-[11px] text-mountain-500">{template.shortName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(template.categoryNames && template.categoryNames.length > 0) ? (
                        template.categoryNames.map((name, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-mountain-100 text-mountain-700 text-[10px] font-medium border border-mountain-200 uppercase tracking-tighter">
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-mountain-100 text-mountain-700 text-[11px] font-medium border border-mountain-200">
                          {template.categoryName || "General"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                        template.targetType === 'category' 
                          ? "bg-purple-100 text-purple-700 border border-purple-200" 
                          : "bg-teal-100 text-teal-700 border border-teal-200"
                      }`}>
                        {template.targetType === 'category' ? "Dynamic" : "Custom"}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                          {(() => {
                            if (template.targetType === 'category') {
                              const targetCids = (template.categoryIds || []).filter(Boolean);
                              if (template.categoryId) targetCids.push(template.categoryId);
                              
                              const targetCnames = (template.categoryNames || []).map(n => n.toLowerCase().trim()).filter(Boolean);
                              if (template.categoryName) targetCnames.push(template.categoryName.toLowerCase().trim());
                              
                              const excluded = template.excludedParameterIds || [];
                              
                              return parameters.filter(p => {
                                if (excluded.includes(p.id)) return false;
                                
                                // 1. Match by Category ID directly
                                if (targetCids.includes(p.categoryId)) return true;
                                
                                // 2. Match by Category Name (Case-Insensitive)
                                const pCategory = categories?.find(c => c.id === p.categoryId);
                                if (pCategory && targetCnames.includes(pCategory.name.toLowerCase().trim())) return true;
                                
                                // 3. Match by Parameter's categoryId being a name itself (Legacy/Seeder fallback)
                                if (targetCnames.includes(p.categoryId?.toLowerCase().trim())) return true;
                                
                                return false;
                              }).length;
                            }
                            return template.parameters?.length || 0;
                          })()}
                        </span>
                        <span className="text-[11.5px] text-mountain-500">Parameters</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-mountain-400 mt-1 truncate max-w-[200px]">
                      {(() => {
                        if (template.targetType === 'category') {
                          const targetCids = (template.categoryIds || []).filter(Boolean);
                          if (template.categoryId) targetCids.push(template.categoryId);
                          const targetCnames = (template.categoryNames || []).map(n => n.toLowerCase().trim()).filter(Boolean);
                          if (template.categoryName) targetCnames.push(template.categoryName.toLowerCase().trim());
                          const excluded = template.excludedParameterIds || [];
                          
                          const matched = parameters.filter(p => {
                            if (excluded.includes(p.id)) return false;
                            if (targetCids.includes(p.categoryId)) return true;
                            const pCategory = categories?.find(c => c.id === p.categoryId);
                            if (pCategory && targetCnames.includes(pCategory.name.toLowerCase().trim())) return true;
                            if (targetCnames.includes(p.categoryId?.toLowerCase().trim())) return true;
                            return false;
                          });
                          return matched.map(p => p.name).join(', ') || "No parameters configured";
                        }
                        const matchedParams = template.parameters?.map(pid => parameters.find(p => p.id === pid)).filter(Boolean) as PathologyParameter[];
                        return matchedParams.map(p => p.name).join(', ') || "No parameters configured";
                      })()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[13.5px] font-semibold text-mountain-900">
                      NPR {template.price.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        color="primary"
                        size="sm"
                        isIconOnly
                        startContent={<IoCreateOutline />}
                        variant="flat"
                        className="h-8 w-8 min-w-0"
                        onClick={() => onEdit(template)}
                      />
                      <Button
                        color="danger"
                        size="sm"
                        isIconOnly
                        startContent={<IoTrashOutline />}
                        variant="flat"
                        className="h-8 w-8 min-w-0"
                        onClick={() => onDelete(template)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-mountain-50/30 rounded-lg border-2 border-dashed border-mountain-200">
          <IoFileTrayFullOutline className="w-12 h-12 text-mountain-200 mb-4" />
          <p className="text-mountain-500 font-medium">
            {searchQuery ? "No matching templates found" : "No test templates created yet"}
          </p>
          <Button className="mt-4" size="sm" variant="light" onClick={onAdd}>
            Create First Template
          </Button>
        </div>
      )}
    </div>
  );
}
