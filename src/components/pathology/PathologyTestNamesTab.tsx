import {
  IoAddOutline,
  IoSearchOutline,
  IoCreateOutline,
  IoTrashOutline,
} from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { PathologyTest } from "@/types/models";

interface PathologyTestNamesTabProps {
  filteredTestNames: PathologyTest[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (testName: PathologyTest) => void;
  onDelete: (testName: PathologyTest) => void;
}

export default function PathologyTestNamesTab({
  filteredTestNames,
  searchQuery,
  onSearchChange,
  onAdd,
  onEdit,
  onDelete,
}: PathologyTestNamesTabProps) {
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
          New Test Name
        </Button>
      </div>

      {filteredTestNames.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="clarity-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-mountain-50 border-b border-mountain-200">
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Name
                </th>
                <th className="px-4 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTestNames.map((testName) => (
                <tr
                  key={testName.id}
                  className="hover:bg-mountain-50/40 border-b border-mountain-100"
                >
                  <td className="px-4 py-2">
                    <p className="text-[13.5px] font-medium text-mountain-900">
                      {testName.testName}
                    </p>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<IoCreateOutline />}
                        variant="flat"
                        onClick={() => onEdit(testName)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<IoTrashOutline />}
                        variant="flat"
                        onClick={() => onDelete(testName)}
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
            {searchQuery ? "No test names found" : "No test names yet"}
          </p>
        </div>
      )}
    </div>
  );
}
