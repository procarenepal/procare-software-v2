import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import {
  IoSearchOutline,
  IoAddOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoPrintOutline,
} from "react-icons/io5";

interface LegacyTestsTabProps {
  tests: any[];
  patients: any[];
  categories: any[];
  parameters: any[];
  technicians: any[];
  onAddTest: () => void;
  onEditTest: (test: any) => void;
  onDeleteTest: (id: string, name: string) => void;
  onPrintTest: (test: any) => void;
  onMigrateAll: () => Promise<void>;
  isMigrating?: boolean;
}

export default function LegacyTestsTab({
  tests,
  onAddTest,
  onEditTest,
  onDeleteTest,
  onPrintTest,
  onMigrateAll,
  isMigrating = false,
}: LegacyTestsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return tests;
    const query = searchQuery.toLowerCase();
    return tests.filter(
      (t) =>
        t.patientName?.toLowerCase().includes(query) ||
        t.testName?.toLowerCase().includes(query) ||
        t.id?.toLowerCase().includes(query)
    );
  }, [tests, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mountain-400 z-10" />
          <input
            className="w-full h-[32px] pl-9 pr-3 border border-mountain-200 rounded text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
            placeholder="Search legacy tests..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            color="secondary"
            variant="flat"
            onPress={onMigrateAll}
            isLoading={isMigrating}
            className="h-[32px] text-[13px] font-medium"
          >
            Unify with Modern System
          </Button>
          <Button
            color="primary"
            startContent={<IoAddOutline />}
            onPress={onAddTest}
            className="h-[32px] text-[13px] font-medium"
          >
            New Legacy Test
          </Button>
        </div>
      </div>

      <Table aria-label="Legacy tests table" className="clarity-table">
        <TableHeader>
          <TableColumn className="text-[12px] font-medium text-mountain-500 uppercase-none">TEST NAME</TableColumn>
          <TableColumn className="text-[12px] font-medium text-mountain-500 uppercase-none">PATIENT</TableColumn>
          <TableColumn className="text-[12px] font-medium text-mountain-500 uppercase-none">DATE</TableColumn>
          <TableColumn className="text-[12px] font-medium text-mountain-500 uppercase-none">LAB TECHNICIAN</TableColumn>
          <TableColumn className="text-[12px] font-medium text-mountain-500 uppercase-none text-right">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {filteredTests.map((test) => (
            <TableRow key={test.id} className="hover:bg-mountain-50/40 border-b border-mountain-100 transition-colors">
              <TableCell>
                <p className="text-[13.5px] font-medium text-mountain-800">{test.testName || "Custom Test"}</p>
                <p className="text-[11px] text-mountain-400 font-mono">{test.id}</p>
              </TableCell>
              <TableCell>
                <p className="text-[13.5px] font-medium text-mountain-800">{test.patientName}</p>
              </TableCell>
              <TableCell className="text-[13px] text-mountain-600">
                {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell>
                {test.labTechnicianName ? (
                  <Chip size="sm" variant="flat" color="primary" className="h-5 text-[11px]">
                    {test.labTechnicianName}
                  </Chip>
                ) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="flat"
                    isIconOnly
                    onPress={() => onPrintTest(test)}
                    className="h-8 w-8 min-w-0"
                  >
                    <IoPrintOutline className="text-lg" />
                  </Button>
                  <Button
                    color="primary"
                    size="sm"
                    variant="flat"
                    isIconOnly
                    onPress={() => onEditTest(test)}
                    className="h-8 w-8 min-w-0"
                  >
                    <IoCreateOutline className="text-lg" />
                  </Button>
                  <Button
                    color="danger"
                    size="sm"
                    variant="flat"
                    isIconOnly
                    onPress={() => onDeleteTest(test.id, test.testName || "Test")}
                    className="h-8 w-8 min-w-0"
                  >
                    <IoTrashOutline className="text-lg" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
