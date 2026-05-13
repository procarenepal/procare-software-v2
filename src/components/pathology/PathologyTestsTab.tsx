import {
  IoSearchOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoPrintOutline,
  IoFilterOutline,
  IoFlaskOutline,
  IoChevronDownOutline,
} from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem 
} from "@/components/ui/dropdown";
import { PathologyOrder } from "@/types/models";

interface PathologyTestsTabProps {
  filteredTests: PathologyOrder[];
  searchQuery: string;
  technicians: any[];
  signatories: any[];
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onPrint: (order: PathologyOrder) => void;
  onEdit: (order: PathologyOrder) => void;
  onDelete: (order: PathologyOrder) => void;
  onAssignStaff: (orderId: string, technicianIds: string[]) => void;
  onAssignSignatory: (orderId: string, signatoryId: string) => void;
}

const statusColors: Record<string, string> = {
  ordered: "bg-slate-100 text-slate-700 border-slate-200",
  collected: "bg-blue-100 text-blue-700 border-blue-200",
  received: "bg-indigo-100 text-indigo-700 border-indigo-200",
  processing: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-teal-100 text-teal-700 border-teal-200",
  verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

interface StaffMultiSelectProps {
  technicians: any[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function StaffMultiSelect({ technicians, selectedIds, onChange }: StaffMultiSelectProps) {
  const selectedNames = technicians
    .filter(t => selectedIds.includes(t.id))
    .map(t => t.name);

  const displayLabel = selectedNames.length === 0 
    ? "Unassigned" 
    : selectedNames.length === 1 
      ? selectedNames[0] 
      : `${selectedNames.length} Staff Selected`;

  return (
    <Dropdown placement="bottom-start" className="w-full">
      <DropdownTrigger>
        <div className="flex items-center justify-between h-8 w-full border border-mountain-200 rounded px-2 text-[12px] text-mountain-800 bg-white hover:border-teal-600 transition-all shadow-sm cursor-pointer truncate">
          <span className="truncate flex-1">{displayLabel}</span>
          <IoChevronDownOutline className="w-3 h-3 text-mountain-400 shrink-0 ml-1" />
        </div>
      </DropdownTrigger>
      <DropdownMenu className="w-56 p-1 max-h-64 overflow-y-auto">
        <div className="px-2 py-1.5 border-b border-mountain-100 mb-1">
          <p className="text-[10px] font-bold text-mountain-400 uppercase tracking-wider">Assign Staff</p>
        </div>
        {technicians.length === 0 ? (
          <div className="px-3 py-4 text-center text-[11px] text-mountain-400">
            No technicians found
          </div>
        ) : (
          technicians.map((tech) => (
            <div 
              key={tech.id} 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-mountain-50 rounded cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const isSelected = selectedIds.includes(tech.id);
                const nextIds = isSelected 
                  ? selectedIds.filter(id => id !== tech.id)
                  : [...selectedIds, tech.id];
                onChange(nextIds);
              }}
            >
              <div className="pointer-events-none">
                <Checkbox 
                  isSelected={selectedIds.includes(tech.id)}
                  size="sm"
                  readOnly
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium text-mountain-800 truncate">{tech.name}</span>
                {tech.specialization && (
                  <span className="text-[10px] text-mountain-400 truncate">{tech.specialization}</span>
                )}
              </div>
            </div>
          ))
        )}
        {selectedIds.length > 0 && (
          <div className="mt-1 pt-1 border-t border-mountain-100">
            <button 
              className="w-full py-1.5 text-[11px] text-red-600 hover:bg-red-50 font-medium transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
            >
              Clear Selections
            </button>
          </div>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}

interface SignatorySelectProps {
  signatories: any[];
  selectedId: string;
  onChange: (id: string) => void;
}

function SignatorySelect({ signatories, selectedId, onChange }: SignatorySelectProps) {
  const selected = signatories.find(s => s.id === selectedId);
  const displayLabel = selected ? selected.name : "Select Signatory";

  return (
    <Dropdown placement="bottom-start" className="w-full">
      <DropdownTrigger>
        <div className={`flex items-center justify-between h-8 w-full border rounded px-2 text-[12px] transition-all shadow-sm cursor-pointer truncate ${
          selected ? "border-emerald-200 bg-emerald-50/30 text-emerald-800" : "border-mountain-200 bg-white text-mountain-500"
        }`}>
          <span className="truncate flex-1 font-medium">{displayLabel}</span>
          <IoChevronDownOutline className="w-3 h-3 text-mountain-400 shrink-0 ml-1" />
        </div>
      </DropdownTrigger>
      <DropdownMenu className="w-56 p-1 max-h-64 overflow-y-auto">
        <div className="px-2 py-1.5 border-b border-mountain-100 mb-1">
          <p className="text-[10px] font-bold text-mountain-400 uppercase tracking-wider">Authorized Signatory</p>
        </div>
        {signatories.length === 0 ? (
          <div className="px-3 py-4 text-center text-[11px] text-mountain-400">
            No signatories found
          </div>
        ) : (
          signatories.map((s) => (
            <DropdownItem 
              key={s.id}
              onClick={() => onChange(s.id)}
              className="px-2 py-1.5"
            >
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold text-mountain-800">{s.name}</span>
                <span className="text-[10px] text-mountain-500">{s.designation}</span>
              </div>
            </DropdownItem>
          ))
        )}
      </DropdownMenu>
    </Dropdown>
  );
}

export default function PathologyTestsTab({
  filteredTests,
  searchQuery,
  technicians,
  signatories,
  onSearchChange,
  onAdd,
  onPrint,
  onEdit,
  onDelete,
  onAssignStaff,
  onAssignSignatory,
}: PathologyTestsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mountain-400" />
            <input
              className="w-full h-[32px] pl-9 pr-3 border border-mountain-200 rounded text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
              placeholder="Search by Lab ID, Patient, or Test..."
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button size="sm" startContent={<IoFilterOutline />} variant="flat">
            Filters
          </Button>
        </div>
        <Button color="primary" startContent={<IoFlaskOutline />} onClick={onAdd}>
          New Lab Order
        </Button>
      </div>

      {filteredTests.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-mountain-200">
          <table className="clarity-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-mountain-50 border-b border-mountain-200">
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500 hidden sm:table-cell">
                  Accession #
                </th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">
                  Patient Info
                </th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500 hidden md:table-cell">
                  Ordered Tests
                </th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">
                  Status
                </th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500 hidden lg:table-cell">
                  Timeline
                </th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">
                  Staff
                </th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">
                  Verified By
                </th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-mountain-50/40 border-b border-mountain-100 transition-colors"
                >
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-[13px] font-semibold text-mountain-800 font-mono tracking-tight">
                      {order.orderNumber}
                      {order.isMicrobiology && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-black uppercase tracking-tighter">
                          Micro
                        </span>
                      )}
                      {(order as any).isLegacy && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-mountain-900 text-white text-[9px] font-bold uppercase tracking-tighter">
                          Legacy
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-mountain-100 text-mountain-600 flex items-center justify-center text-[12px] font-medium border border-mountain-200 shrink-0">
                        {order.patientName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-medium text-mountain-800 leading-tight">
                          {order.patientName}
                        </p>
                        <p className="text-[11.5px] text-mountain-500 mt-0.5 sm:block hidden">
                          {order.patientAge}y • {order.patientGender}
                        </p>
                        <p className="text-[10px] text-mountain-400 mt-0.5 sm:hidden block font-mono">
                          {order.orderNumber}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {order.testNames.map((name, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-mountain-100 text-mountain-700 text-[11px] font-medium border border-mountain-200">
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium ${statusColors[order.status] || "bg-mountain-100 text-mountain-700"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="space-y-0.5">
                      <p className="text-[12px] text-mountain-700">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-mountain-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StaffMultiSelect 
                      technicians={technicians} 
                      selectedIds={order.labTechnicianIds || (order.labTechnicianId ? [order.labTechnicianId] : [])}
                      onChange={(ids) => onAssignStaff(order.id, ids)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <SignatorySelect 
                      signatories={signatories}
                      selectedId={order.verifiedById || ""}
                      onChange={(id) => onAssignSignatory(order.id, id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        color="secondary"
                        size="sm"
                        startContent={<IoPrintOutline />}
                        variant="flat"
                        className="h-8"
                        onClick={() => onPrint(order)}
                      >
                        Report
                      </Button>
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<IoCreateOutline />}
                        variant="flat"
                        className="h-8"
                        onClick={() => onEdit(order)}
                      >
                        Results
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        isIconOnly
                        startContent={<IoTrashOutline />}
                        variant="flat"
                        className="h-8 w-8 min-w-0"
                        onClick={() => onDelete(order)}
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
          <IoFlaskOutline className="w-12 h-12 text-mountain-200 mb-4" />
          <p className="text-mountain-500 font-medium">
            {searchQuery ? "No matching orders found" : "Your clinical worklist is empty"}
          </p>
          <Button className="mt-4" size="sm" variant="light" onClick={onAdd}>
            Create First Order
          </Button>
        </div>
      )}
    </div>
  );
}
