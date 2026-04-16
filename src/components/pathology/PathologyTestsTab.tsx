import {
  IoAddOutline,
  IoSearchOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoPrintOutline,
} from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { PathologyTest } from "@/types/models";

interface PathologyTestsTabProps {
  filteredTests: PathologyTest[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onPrint: (test: PathologyTest) => void;
  onEdit: (test: PathologyTest) => void;
  onDelete: (test: PathologyTest) => void;
}

export default function PathologyTestsTab({
  filteredTests,
  searchQuery,
  onSearchChange,
  onAdd,
  onPrint,
  onEdit,
  onDelete,
}: PathologyTestsTabProps) {
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
          New Pathology Tests
        </Button>
      </div>

      {filteredTests.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="clarity-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-mountain-50 border-b border-mountain-200">
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Test Name
                </th>
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Patient
                </th>
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Short Name
                </th>
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Test Type
                </th>
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Category Name
                </th>
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Lab Technician
                </th>
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Charge Cat
                </th>
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <tr
                  key={test.id}
                  className="hover:bg-mountain-50/40 border-b border-mountain-100"
                >
                  <td className="px-4 py-2">
                    <p className="text-[13.5px] font-medium text-mountain-900">
                      {test.testName}
                    </p>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[11px] font-semibold">
                        {test.patientName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-medium text-mountain-900">
                          {test.patientName}
                        </p>
                        {test.patientEmail && (
                          <p className="text-[11.5px] text-mountain-500">
                            {test.patientEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-[13px] text-mountain-700">
                    {test.shortName || "—"}
                  </td>
                  <td className="px-4 py-2 text-[13px] text-mountain-700">
                    {test.testType || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold bg-teal-100 text-teal-700 border-teal-200">
                      {test.categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {test.labTechnicianName ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold bg-health-100 text-health-700 border-health-200">
                        {test.labTechnicianName}
                      </span>
                    ) : (
                      <span className="text-mountain-400 text-[13px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[13px] text-mountain-700">
                    {test.chargeCategory || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        color="secondary"
                        size="sm"
                        startContent={<IoPrintOutline />}
                        variant="flat"
                        onClick={() => onPrint(test)}
                      >
                        Print
                      </Button>
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<IoCreateOutline />}
                        variant="flat"
                        onClick={() => onEdit(test)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<IoTrashOutline />}
                        variant="flat"
                        onClick={() => onDelete(test)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-mountain-500 text-[13.5px]">
            {searchQuery ? "No tests found" : "No pathology tests yet"}
          </p>
        </div>
      )}
    </div>
  );
}
