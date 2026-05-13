import {
  IoCalendarOutline,
  IoPrintOutline,
  IoStatsChartOutline,
  IoPeopleOutline,
  IoReceiptOutline,
} from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { PathologyOrder, PathologyBilling, PathologyCategory } from "@/types/models";

export interface DailyReportData {
  dailyTests: PathologyOrder[];
  dailyBillings: PathologyBilling[];
  totalTests: number;
  totalBillings: number;
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  testTypeBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  technicianBreakdown: Record<string, number>;
  totalPatients: number;
}

interface PathologyDailyReportTabProps {
  dailyReportData: DailyReportData;
  selectedDate: string;
  categories: PathologyCategory[];
  onDateChange: (date: string) => void;
  onPrintReport: () => void;
}

export default function PathologyDailyReportTab({
  dailyReportData,
  selectedDate,
  categories,
  onDateChange,
  onPrintReport,
}: PathologyDailyReportTabProps) {
  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-mountain-700">
              Select Date
            </label>
            <div className="relative">
              <IoCalendarOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mountain-400" />
              <input
                className="w-64 h-[32px] pl-9 pr-3 border border-mountain-200 rounded text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="flat"
            onClick={() => onDateChange(new Date().toISOString().split("T")[0])}
          >
            Today
          </Button>
        </div>
        <Button
          color="primary"
          startContent={<IoPrintOutline />}
          onClick={onPrintReport}
        >
          Print Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clarity-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-mountain-500">Total Tests</p>
              <p className="text-[22px] font-semibold text-mountain-900">
                {dailyReportData.totalTests}
              </p>
            </div>
            <IoStatsChartOutline className="text-3xl text-teal-600" />
          </div>
        </div>
        <div className="clarity-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-mountain-500">Total Patients</p>
              <p className="text-[22px] font-semibold text-mountain-900">
                {dailyReportData.totalPatients}
              </p>
            </div>
            <IoPeopleOutline className="text-3xl text-health-600" />
          </div>
        </div>
        <div className="clarity-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-mountain-500">Total Revenue</p>
              <p className="text-[22px] font-semibold text-mountain-900">
                NPR {dailyReportData.totalRevenue.toLocaleString()}
              </p>
            </div>
            <IoReceiptOutline className="text-3xl text-saffron-600" />
          </div>
        </div>
        <div className="clarity-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-mountain-500">Total Invoices</p>
              <p className="text-[22px] font-semibold text-mountain-900">
                {dailyReportData.totalBillings}
              </p>
            </div>
            <IoReceiptOutline className="text-3xl text-teal-600" />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="clarity-card p-4">
          <p className="text-[12px] text-mountain-500 mb-2">Paid Amount</p>
          <p className="text-xl font-semibold text-health-700">
            NPR {dailyReportData.totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="clarity-card p-4">
          <p className="text-[12px] text-mountain-500 mb-2">Pending Amount</p>
          <p className="text-xl font-semibold text-saffron-700">
            NPR {dailyReportData.totalPending.toLocaleString()}
          </p>
        </div>
        <div className="clarity-card p-4">
          <p className="text-[12px] text-mountain-500 mb-2">Payment Rate</p>
          <p className="text-xl font-semibold text-mountain-900">
            {dailyReportData.totalRevenue > 0
              ? (
                  (dailyReportData.totalPaid / dailyReportData.totalRevenue) *
                  100
                ).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Tests Table */}
      <div className="clarity-card border border-mountain-200 rounded">
        <div className="px-4 py-3 border-b border-mountain-100 bg-mountain-50/60">
          <h3 className="text-[14px] font-semibold text-mountain-900">
            Tests Performed
          </h3>
        </div>
        <div className="p-0">
          {dailyReportData.dailyTests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="clarity-table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-mountain-50 border-b border-mountain-200">
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Test Name
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Patient
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Test Type
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Category
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Lab Technician
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailyReportData.dailyTests.map((test) => (
                    <tr
                      key={test.id}
                      className="hover:bg-mountain-50/40 border-b border-mountain-100"
                    >
                      <td className="px-4 py-2">
                        <p className="text-[13.5px] font-medium text-mountain-900">
                          {test.testNames?.join(", ") || "No tests listed"}
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
                            {test.patientAge && (
                              <p className="text-[11.5px] text-mountain-500">
                                {test.patientAge}{" "}
                                {test.patientGender
                                  ? `, ${test.patientGender}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-[13px] text-mountain-700">
                        —
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const orderCategories = new Set<string>();
                            test.results?.forEach(res => {
                              const cat = categories.find(c => c.id === (res as any).categoryId);
                              if (cat) orderCategories.add(cat.name);
                            });
                            
                            if (orderCategories.size === 0) return <span className="text-mountain-400 text-[13px]">—</span>;
                            
                            return Array.from(orderCategories).map((catName, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold bg-teal-100 text-teal-700 border-teal-200">
                                {catName}
                              </span>
                            ));
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {test.labTechnicianName ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold bg-health-100 text-health-700 border-health-200">
                            {test.labTechnicianName}
                          </span>
                        ) : (
                          <span className="text-mountain-400 text-[13px]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-[13px] text-mountain-700">
                        {new Date(test.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-mountain-500 text-[13.5px]">
              No tests performed on this date
            </div>
          )}
        </div>
      </div>

      {/* Billings Table */}
      <div className="clarity-card border border-mountain-200 rounded">
        <div className="px-4 py-3 border-b border-mountain-100 bg-mountain-50/60">
          <h3 className="text-[14px] font-semibold text-mountain-900">
            Invoices
          </h3>
        </div>
        <div className="p-0">
          {dailyReportData.dailyBillings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="clarity-table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-mountain-50 border-b border-mountain-200">
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Invoice No
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Patient
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Items
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Status
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailyReportData.dailyBillings.map((billing) => (
                    <tr
                      key={billing.id}
                      className="hover:bg-mountain-50/40 border-b border-mountain-100"
                    >
                      <td className="px-4 py-2">
                        <p className="text-[13.5px] font-medium text-mountain-900">
                          {billing.invoiceNumber}
                        </p>
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <p className="text-[13.5px] font-medium text-mountain-900">
                            {billing.patientName}
                          </p>
                          {billing.patientEmail && (
                            <p className="text-[11.5px] text-mountain-500">
                              {billing.patientEmail}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-[13px] text-mountain-700">
                        {billing.items.length} item(s)
                      </td>
                      <td className="px-4 py-2">
                        <p className="text-[13.5px] font-medium text-mountain-900">
                          NPR {billing.totalAmount.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium ${
                            billing.status === "paid"
                              ? "bg-health-100 text-health-700 border-health-200"
                              : "bg-saffron-100 text-saffron-700 border-saffron-200"
                          }`}
                        >
                          {billing.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[13px] text-mountain-700">
                        {new Date(billing.invoiceDate).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-mountain-500 text-[13.5px]">
              No invoices created on this date
            </div>
          )}
        </div>
      </div>

      {/* Statistics Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test Types Breakdown */}
        <div className="clarity-card border border-mountain-200 rounded">
          <div className="px-4 py-3 border-b border-mountain-100 bg-mountain-50/60">
            <h3 className="text-[14px] font-semibold text-mountain-900">
              Test Types Breakdown
            </h3>
          </div>
          <div className="p-0">
            {Object.keys(dailyReportData.testTypeBreakdown).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="clarity-table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-mountain-50 border-b border-mountain-200">
                      <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                        Test Type
                      </th>
                      <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(dailyReportData.testTypeBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <tr
                          key={type}
                          className="hover:bg-mountain-50/40 border-b border-mountain-100"
                        >
                          <td className="px-4 py-2 text-[13px] text-mountain-800">
                            {type}
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium bg-teal-100 text-teal-700 border-teal-200">
                              {count}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-mountain-500 text-[13.5px]">
                No test types data
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="clarity-card border border-mountain-200 rounded">
          <div className="px-4 py-3 border-b border-mountain-100 bg-mountain-50/60">
            <h3 className="text-[14px] font-semibold text-mountain-900">
              Category Breakdown
            </h3>
          </div>
          <div className="p-0">
            {Object.keys(dailyReportData.categoryBreakdown).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="clarity-table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-mountain-50 border-b border-mountain-200">
                      <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                        Category
                      </th>
                      <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(dailyReportData.categoryBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, count]) => (
                        <tr
                          key={category}
                          className="hover:bg-mountain-50/40 border-b border-mountain-100"
                        >
                          <td className="px-4 py-2 text-[13px] text-mountain-800">
                            {category}
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium bg-health-100 text-health-700 border-health-200">
                              {count}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-mountain-500 text-[13.5px]">
                No category data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lab Technician Breakdown */}
      {Object.keys(dailyReportData.technicianBreakdown).length > 0 && (
        <div className="clarity-card border border-mountain-200 rounded">
          <div className="px-4 py-3 border-b border-mountain-100 bg-mountain-50/60">
            <h3 className="text-[14px] font-semibold text-mountain-900">
              Lab Technician Breakdown
            </h3>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="clarity-table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-mountain-50 border-b border-mountain-200">
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Technician
                    </th>
                    <th className="px-4 py-2 text-[12px] font-medium text-mountain-500">
                      Tests Performed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dailyReportData.technicianBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([technician, count]) => (
                      <tr
                        key={technician}
                        className="hover:bg-mountain-50/40 border-b border-mountain-100"
                      >
                        <td className="px-4 py-2 text-[13px] text-mountain-800">
                          {technician}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold bg-teal-100 text-teal-700 border-teal-200">
                            {count}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
