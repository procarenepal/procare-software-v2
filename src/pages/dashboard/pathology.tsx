import React, { useState, useEffect, useMemo } from "react";
import { writeBatch, collection, doc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { createPortal } from "react-dom";
import {
  IoAddOutline,
  IoSearchOutline,
  IoTrashOutline,
  IoArrowBackOutline,
  IoArrowUpOutline,
  IoCloseOutline,
  IoFlaskOutline,
  IoOptionsOutline,
  IoMedkitOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";

import { title } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { addToast } from "@/components/ui/toast";
import { useAuthContext } from "@/context/AuthContext";
import { useModalState } from "@/hooks/useModalState";
import { patientService } from "@/services/patientService";
import { pathologyService } from "@/services/pathologyService";
import { labTechnicianService } from "@/services/labTechnicianService";
import { pathologySignatoryService } from "@/services/pathologySignatoryService";
import { pathologyBillingService } from "@/services/pathologyBillingService";
import { clinicService } from "@/services/clinicService";
import { pathologySeederData } from "@/services/pathologySeederData";
import LabTechnicianManagement from "@/components/pathology/LabTechnicianManagement";
import PathologySignatoryManagement from "@/components/pathology/PathologySignatoryManagement";
import PathologyBillingTab from "@/components/pathology/PathologyBillingTab";
import PathologyTestsTab from "@/components/pathology/PathologyTestsTab";
import PathologyCategoriesTab from "@/components/pathology/PathologyCategoriesTab";
import PathologyUnitsTab from "@/components/pathology/PathologyUnitsTab";
import PathologyParametersTab from "@/components/pathology/PathologyParametersTab";
import PathologyCatalogTab from "@/components/pathology/PathologyCatalogTab";
import PathologyDailyReportTab from "@/components/pathology/PathologyDailyReportTab";
import PathologyResultEntryModal from "@/components/pathology/PathologyResultEntryModal";
import LegacyTestsTab from "@/components/pathology/LegacyTestsTab";
import {
  PathologyOrder,
  PathologyTestTemplate,
  PathologyCategory,
  PathologyUnit,
  PathologyParameter,
  PathologyResult,
  LabTechnician,
  PathologySignatory,
  PathologyBilling,
  Patient,
  ReferenceRange,
} from "@/types/models";


import { PrintLayoutConfig } from "@/types/printLayout";
import {
  getPrintBrandingCSS,
  getPrintHeaderHTML,
  getPrintFooterHTML,
} from "@/utils/printBranding";
import { generatePathologyReportHTML } from "@/utils/invoicePrinting";

const TAB_KEYS = [
  "worklist",
  "billing",
  "catalog",
  "technicians",
  "signatories",
  "dailyReport",
  "legacy",
] as const;



function PathologySearchSelect({
  label,
  items,
  value,
  onChange,
  onInputChange,
  onAddNew,
  required,
  placeholder,
  defaultDisplay,
}: {
  label: string;
  items: { id: string; primary: string; secondary?: string }[];
  value: string;
  onChange: (id: string, primary: string) => void;
  onInputChange?: (value: string) => void;
  onAddNew?: (q: string) => void;
  required?: boolean;
  placeholder?: string;
  defaultDisplay?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = (
    q
      ? items.filter((i) =>
        (i.primary + (i.secondary || ""))
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
      : items
  ).slice(0, 100);
  const selected = items.find((i) => i.id === value);
  const displayValue = open ? q : selected ? selected.primary : (defaultDisplay || "");
  const displayPlaceholder = selected && !open ? selected.primary : (defaultDisplay && !open ? defaultDisplay : placeholder || "Search…");

  return (
    <div className="flex flex-col gap-1.5 relative">
      {(label || required) && (
        <label className="text-[13px] font-medium text-mountain-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div
        className="flex flex-wrap items-center min-h-[32px] border border-mountain-200 rounded focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-100 bg-white"
        onClick={() => setOpen(true)}
      >
        <IoSearchOutline className="ml-3 w-4 h-4 text-mountain-400 shrink-0" />
        <input
          className="flex-1 text-[13.5px] px-2 py-1.5 bg-transparent focus:outline-none text-mountain-800 placeholder:text-mountain-400 w-full min-w-0"
          placeholder={displayPlaceholder}
          value={displayValue}
          onChange={(e) => {
            const val = e.target.value;
            setQ(val);
            setOpen(true);
            if (onInputChange) onInputChange(val);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Auto-stage as new item if typed text doesn't match any existing item
            setTimeout(() => {
              if (q.trim() && !items.find(i => i.primary.toLowerCase() === q.toLowerCase()) && onAddNew) {
                onAddNew(q.trim());
              }
              setOpen(false);
              setQ("");
            }, 150);
          }}
        />
        {value && (
          <button
            className="mr-3 text-mountain-400 hover:text-mountain-700"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("", "");
              setQ("");
              if (onInputChange) onInputChange("");
            }}
          >
            <IoCloseOutline className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-mountain-200 rounded shadow-lg max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-4 text-center">
                <p className="text-[13px] text-mountain-500">
                  No results found for "{q}"
                </p>
                {onAddNew && q && (
                  <Button
                    color="primary"
                    size="sm"
                    startContent={<IoAddOutline className="w-4 h-4" />}
                    variant="flat"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNew(q);
                      setOpen(false);
                    }}
                  >
                    Create New
                  </Button>
                )}
              </div>
            ) : (
              filtered.map((i) => (
                <button
                  key={i.id}
                  className={`flex flex-col w-full text-left px-3 py-2 hover:bg-teal-50 border-b border-mountain-50 last:border-0 ${i.id === value ? "bg-teal-50/50" : ""}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents input from losing focus immediately
                    e.stopPropagation();
                    onChange(i.id, i.primary);
                    setQ("");
                    setOpen(false);
                  }}
                >
                  <span className="text-[13.5px] font-medium text-mountain-800 leading-tight">
                    {i.primary}
                  </span>
                  {i.secondary && (
                    <span className="text-[11.5px] text-mountain-500 mt-0.5 leading-tight">
                      {i.secondary}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}


export default function PathologyPage() {
  const { clinicId, currentUser, userData } = useAuthContext();
  const branchId = userData?.branchId || userData?.clinicId || clinicId;

  // Active tab state
  const [activeTab, setActiveTab] = useState<(typeof TAB_KEYS)[number]>(
    "worklist",
  );


  // Loading state
  // Loading state
  const [loading, setLoading] = useState(true);

  // Data states
  const [orders, setOrders] = useState<PathologyOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PathologyOrder | null>(null);
  const [templates, setTemplates] = useState<PathologyTestTemplate[]>([]);
  const [categories, setCategories] = useState<PathologyCategory[]>([]);
  const [units, setUnits] = useState<PathologyUnit[]>([]);
  const [parameters, setParameters] = useState<PathologyParameter[]>([]);
  const [labTechnicians, setLabTechnicians] = useState<LabTechnician[]>([]);
  const [pathologySignatories, setPathologySignatories] = useState<PathologySignatory[]>([]);
  const [billings, setBillings] = useState<PathologyBilling[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  const [clinic, setClinic] = useState<any>(null);
  const [layoutConfig, setLayoutConfig] = useState<PrintLayoutConfig | null>(
    null,
  );
  const [isMigrating, setIsMigrating] = useState(false);

  // Modal states
  const testModalState = useModalState(false);
  const resultEntryModalState = useModalState(false);
  const categoryModalState = useModalState(false);
  const unitModalState = useModalState(false);
  const parameterModalState = useModalState(false);
  const testTypeModalState = useModalState(false);
  const quickPatientModalState = useModalState(false);
  const deleteConfirmModalState = useModalState(false);
  const seederModalState = useModalState(false);
  const [seederSelectedIds, setSeederSelectedIds] = useState<string[]>([]);

  // Form states
  const [testForm, setTestForm] = useState({
    id: "",
    isWalkIn: false,
    walkInPhone: "",
    patientId: "",
    patientName: "",
    patientAge: "",
    patientGender: "",
    selectedTemplates: [] as string[],
    testType: "",
    selectedCategories: [] as string[],
    reportDays: "",
    chargeCategory: "",
    standardCharge: "",
    labTechnicianId: "",
    verifiedById: "",
    parameters: [
      {
        categoryId: "",
        parameterId: "",
        parameterName: "",
        patientResult: "",
        referenceRange: "",
        unit: "",
        isHeader: false,
        indentationLevel: 0
      },
    ],
  });
  const [quickPatientForm, setQuickPatientForm] = useState({
    name: "",
    age: "",
    gender: "",
    mobile: "",
  });

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const [testsSearchQuery, setTestsSearchQuery] = useState("");

  const [testTypeForm, setTestTypeForm] = useState({
    id: "",
    name: "",
    targetType: "category" as "category" | "parameter",
    categoryId: "",
    newCategoryName: "", // For inline creation
    price: "",
    reportDays: "1", // Turnaround time
    isMicrobiology: false,
    // Unified Parameters (for 'parameter' targetType)
    selectedParameters: [] as { id?: string; name: string; unit: string; range: string; resultType: string; tiers?: any[]; showTiers?: boolean }[]
  });

  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
  });

  const [unitForm, setUnitForm] = useState({
    id: "",
    name: "",
  });

  const [parameterForm, setParameterForm] = useState({
    id: "",
    categoryId: "",
    name: "",
    referenceRange: "",
    unit: "",
    resultType: "numeric" as "numeric" | "text" | "qualitative",
    isGenderSensitive: false,
    tiers: [] as any[] // [{ label, min, max, status }]
  });

  const [isEditing, setIsEditing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);

  // Filtered data
  const filteredOrders = useMemo(() => {
    const unifiedWorklist = [
      ...orders,
      ...tests.map(t => ({
        ...t,
        isLegacy: true,
        orderNumber: t.id.slice(-8).toUpperCase(),
        testNames: [t.testName || "Legacy Test"],
        status: "Completed", // Legacy tests are generally considered finished
        labTechnicianName: t.labTechnicianName || t.technicianName
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (!testsSearchQuery.trim()) return unifiedWorklist;
    const query = testsSearchQuery.toLowerCase();

    return unifiedWorklist.filter(
      (item: any) =>
        (item.orderNumber || "").toLowerCase().includes(query) ||
        (item.patientName || "").toLowerCase().includes(query) ||
        (item.status || "").toLowerCase().includes(query) ||
        (item.testNames || []).some((n: string) => n.toLowerCase().includes(query))
    );
  }, [orders, tests, testsSearchQuery]);

  const dailyReportData = useMemo(() => {
    const selectedDateObj = new Date(selectedDate);
    const startOfDay = new Date(selectedDateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDateObj.setHours(23, 59, 59, 999));

    const dailyOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });

    const dailyBillings = billings.filter((billing) => {
      const invoiceDate = new Date(billing.invoiceDate);
      return invoiceDate >= startOfDay && invoiceDate <= endOfDay;
    });

    const dailyLegacyTests = tests.filter((test) => {
      const testDate = new Date(test.createdAt);
      return testDate >= startOfDay && testDate <= endOfDay;
    });

    const totalOrders = dailyOrders.length + dailyLegacyTests.length;
    const totalBillings = dailyBillings.length;

    let totalRevenue = 0;
    let totalPaid = 0;
    let totalPending = 0;

    dailyBillings.forEach(billing => {
      totalRevenue += billing.totalAmount || 0;
      if (billing.paymentStatus === 'paid') {
        totalPaid += billing.totalAmount || 0;
      } else {
        totalPending += billing.totalAmount || 0;
      }
    });

    const testTypeBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};
    const technicianBreakdown: Record<string, number> = {};
    const uniquePatients = new Set();

    // Process Modern Orders
    dailyOrders.forEach(order => {
      (order.testNames || []).forEach(name => {
        testTypeBreakdown[name] = (testTypeBreakdown[name] || 0) + 1;
      });

      const orderCategories = new Set<string>();
      (order.testTemplateIds || []).forEach(tid => {
        const template = templates.find(t => t.id === tid);
        if (template) orderCategories.add(template.categoryName);
      });

      orderCategories.forEach(catName => {
        categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + 1;
      });

      if (order.labTechnicianName) {
        technicianBreakdown[order.labTechnicianName] = (technicianBreakdown[order.labTechnicianName] || 0) + 1;
      }
      uniquePatients.add(order.patientId || order.patientName);
    });

    // Process Legacy Tests
    dailyLegacyTests.forEach(test => {
      const name = test.testName || "Legacy Test";
      testTypeBreakdown[name] = (testTypeBreakdown[name] || 0) + 1;

      if (test.categoryName) {
        categoryBreakdown[test.categoryName] = (categoryBreakdown[test.categoryName] || 0) + 1;
      }

      const techName = test.labTechnicianName || test.technicianName || "Legacy Technician";
      technicianBreakdown[techName] = (technicianBreakdown[techName] || 0) + 1;
      uniquePatients.add(test.patientId || test.patientName);
    });

    // Unified list for the table
    const unifiedTests = [
      ...dailyOrders,
      ...dailyLegacyTests.map(t => ({
        ...t,
        isLegacy: true,
        testNames: [t.testName || "Legacy Test"],
        labTechnicianName: t.labTechnicianName || t.technicianName
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      dailyTests: unifiedTests as any,
      dailyBillings,
      totalTests: totalOrders,
      totalBillings,
      totalRevenue,
      totalPaid,
      totalPending,
      testTypeBreakdown,
      categoryBreakdown,
      technicianBreakdown,
      totalPatients: uniquePatients.size,
    };
  }, [orders, tests, billings, selectedDate, categories]);

  const resetTestForm = () => {
    setTestForm({
      id: "",
      isWalkIn: false,
      walkInPhone: "",
      patientId: "",
      patientName: "",
      patientAge: "",
      patientGender: "",
      selectedTemplates: [],
      testType: "",
      selectedCategories: [],
      reportDays: "",
      chargeCategory: "",
      standardCharge: "",
      labTechnicianId: "",
      verifiedById: "",
      parameters: [{ categoryId: "", parameterId: "", parameterName: "", patientResult: "", referenceRange: "", unit: "", isHeader: false, indentationLevel: 0 }],
    });
    setIsEditing(false);
  };

  const addTestParameter = () => {
    setTestForm((prev) => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        {
          categoryId: "",
          parameterId: "",
          parameterName: "",
          patientResult: "",
          referenceRange: "",
          unit: "",
          isHeader: false,
          indentationLevel: 0
        },
      ],
    }));
  };

  const removeTestParameter = (index: number) => {
    setTestForm((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  // Sync reference ranges when patient gender changes to make it completely dynamic
  useEffect(() => {
    if (testForm.parameters.some(p => p.parameterId)) {
      setTestForm(prev => {
        const updated = prev.parameters.map(p => {
          if (!p.parameterId) return p;
          const paramMeta = parameters.find(param => param.id === p.parameterId);
          if (!paramMeta || !paramMeta.isGenderSensitive) return p;

          const gender = prev.patientGender || "male";
          const newRange = gender === 'female'
            ? formatRange(paramMeta.femaleRange)
            : formatRange(paramMeta.maleRange);

          if (p.referenceRange === newRange) return p;
          return { ...p, referenceRange: newRange };
        });

        // Only update if something actually changed to avoid infinite loops
        const hasChanges = updated.some((p, i) => p.referenceRange !== prev.parameters[i].referenceRange);
        if (!hasChanges) return prev;

        return { ...prev, parameters: updated };
      });
    }
  }, [testForm.patientGender, parameters]);

  const formatRange = (range?: ReferenceRange) => {
    if (!range) return "";
    if (range.description) return range.description;
    if (range.min !== undefined && range.max !== undefined) return `${range.min} - ${range.max}`;
    if (range.min !== undefined) return `> ${range.min}`;
    if (range.max !== undefined) return `< ${range.max}`;
    if (range.normalValue) return range.normalValue;
    return "";
  };

  const updateTestParameter = (
    index: number,
    field: string,
    value: string,
  ) => {
    setTestForm((prev) => {
      const updated = [...prev.parameters];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "parameterId") {
        const selectedParam = parameters.find((p) => p.id === value);
        if (selectedParam) {
          updated[index].parameterName = selectedParam.name;
          updated[index].categoryId = selectedParam.categoryId || updated[index].categoryId;

          const gender = prev.patientGender || "male";
          updated[index].referenceRange = selectedParam.isGenderSensitive
            ? (gender === 'female' ? formatRange(selectedParam.femaleRange) : formatRange(selectedParam.maleRange))
            : formatRange(selectedParam.allRange);

          const unitObj = units.find((u) => u.id === selectedParam.unit);
          updated[index].unit = unitObj?.name || selectedParam.unit || "";
        }
      }

      return { ...prev, parameters: updated };
    });
  };

  const moveTestParameter = (index: number, direction: "up" | "down") => {
    setTestForm((prev) => {
      const updated = [...prev.parameters];
      if (direction === "up" && index > 0) {
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      } else if (direction === "down" && index < updated.length - 1) {
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      }
      return { ...prev, parameters: updated };
    });
  };

  const handleSaveTest = async () => {
    try {
      setLoading(true);
      const orderNumber = await pathologyService.generateAccessionNumber(clinicId!);

      const selectedTech = labTechnicians.find(t => t.id === testForm.labTechnicianId);
      const selectedSignatory = pathologySignatories.find(s => s.id === testForm.verifiedById);

      const orderData: Omit<PathologyOrder, "id" | "createdAt" | "updatedAt"> = {
        orderNumber,
        patientId: testForm.patientId,
        patientName: testForm.patientName,
        patientAge: parseInt(testForm.patientAge) || 0,
        patientGender: (testForm.patientGender as any) || "other",
        testTemplateIds: [],
        testNames: [testForm.testType || "Manual Lab Entry"],
        status: "ordered",
        labTechnicianId: testForm.labTechnicianId,
        labTechnicianName: selectedTech?.name || "",
        labTechnicianIds: testForm.labTechnicianId ? [testForm.labTechnicianId] : [],
        labTechnicianNames: selectedTech ? [selectedTech.name] : [],
        labTechnicianSignatureUrls: selectedTech ? [selectedTech.signatureUrl || ""] : [],
        verifiedById: testForm.verifiedById,
        verifiedByName: selectedSignatory?.name || "",
        verifiedByRegNo: selectedSignatory?.registrationNumber || "",
        verifiedByDesignation: selectedSignatory?.designation || "",
        verifiedBySignatureUrl: selectedSignatory?.signatureUrl || "",
        isMicrobiology: testForm.selectedTemplates?.some(tid => templates.find(t => t.id === tid)?.isMicrobiology) || false,
        results: testForm.parameters.map(p => ({
          categoryId: p.categoryId,
          parameterId: p.parameterId,
          parameterName: p.parameterName,
          value: p.patientResult,
          unit: p.unit,
          referenceRange: p.referenceRange,
          status: "normal",
          isHeader: p.isHeader || false,
          indentationLevel: p.indentationLevel || 0
        })),
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdBy: currentUser?.uid || "",
      };

      await pathologyService.createOrder(orderData);

      addToast({
        title: "Success",
        description: "Lab order created successfully",
        color: "success",
      });

      await reloadAllData();
      testModalState.close();
      resetTestForm();
    } catch (error) {
      console.error("Error creating manual test:", error);
      addToast({
        title: "Error",
        description: "Failed to create lab order",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetCategoryForm = () => { setCategoryForm({ id: "", name: "" }); setIsEditing(false); };
  const resetUnitForm = () => { setUnitForm({ id: "", name: "" }); setIsEditing(false); };
  const resetParameterForm = () => { setParameterForm({ id: "", categoryId: "", name: "", referenceRange: "", unit: "", resultType: "numeric", isGenderSensitive: false, tiers: [] }); setIsEditing(false); };
  const resetTestTypeForm = () => { setTestTypeForm({ id: "", name: "", targetType: "category", categoryId: "", newCategoryName: "", price: "", reportDays: "1", isMicrobiology: false, selectedParameters: [] }); setIsEditing(false); };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    try {
      setLoading(true);
      const data = { name: categoryForm.name.trim(), clinicId: clinicId!, branchId: branchId!, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: currentUser?.uid || "" };
      if (isEditing) { await pathologyService.updateCategory(categoryForm.id, data); }
      else { await pathologyService.createCategory(data); }
      setCategories(await pathologyService.getCategoriesByClinic(clinicId!, branchId!));
      categoryModalState.close();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSaveUnit = async () => {
    if (!unitForm.name.trim()) return;
    try {
      setLoading(true);
      const data = { name: unitForm.name.trim(), clinicId: clinicId!, branchId: branchId!, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: currentUser?.uid || "" };
      if (isEditing) { await pathologyService.updateUnit(unitForm.id, data); }
      else { await pathologyService.createUnit(data); }
      setUnits(await pathologyService.getUnitsByClinic(clinicId!, branchId!));
      unitModalState.close();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSaveParameter = async (keepOpen = false) => {
    if (!parameterForm.name.trim()) return;
    try {
      setLoading(true);
      const data = {
        ...parameterForm,
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || "",
        allRange: {
          description: parameterForm.referenceRange,
          tiers: parameterForm.tiers
        },
        maleRange: { description: parameterForm.referenceRange, tiers: parameterForm.tiers },
        femaleRange: { description: parameterForm.referenceRange, tiers: parameterForm.tiers },
      };
      if (isEditing) { await pathologyService.updateParameter(parameterForm.id, data); }
      else { await pathologyService.createParameter(data); }

      const updatedParams = await pathologyService.getParametersByClinic(clinicId!, branchId!);
      setParameters(updatedParams);

      if (keepOpen) {
        addToast({ title: "Success", description: "Parameter saved. Ready for next.", color: "success" });
        // Reset name and range but keep category and unit for efficiency
        setParameterForm(prev => ({ ...prev, name: "", referenceRange: "", tiers: [] }));
      } else {
        parameterModalState.close();
      }
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", description: "Failed to save parameter", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTestType = async () => {
    if (!testTypeForm.name.trim()) {
      addToast({ title: "Required", description: "Please enter a Test Name.", color: "warning" });
      return;
    }
    if (!testTypeForm.categoryId && !testTypeForm.newCategoryName.trim()) {
      addToast({ title: "Required", description: "Please select or create a Category.", color: "warning" });
      return;
    }
    if (!testTypeForm.price.trim()) {
      addToast({ title: "Required", description: "Please enter a Price.", color: "warning" });
      return;
    }

    try {
      setLoading(true);
      const batch = writeBatch(db);

      let finalCategoryId = testTypeForm.categoryId;
      let finalCategoryName = categories.find(c => c.id === testTypeForm.categoryId)?.name || "General";

      // 1. Handle Inline Category Creation
      if (!finalCategoryId && testTypeForm.newCategoryName) {
        const newCatRef = doc(collection(db, "pathologyCategories"));
        const newCatData = {
          name: testTypeForm.newCategoryName,
          clinicId: clinicId!,
          branchId: branchId!,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: currentUser?.uid || ""
        };
        batch.set(newCatRef, newCatData);
        finalCategoryId = newCatRef.id;
        finalCategoryName = testTypeForm.newCategoryName;
      }

      let finalParameterIds: string[] = [];

      if (testTypeForm.targetType === 'category') {
        finalParameterIds = parameters
          .filter(p => p.categoryId === finalCategoryId)
          .map(p => p.id);
      } else {
        // 2. Unified flow: Create any new parameters defined inline
        // Track units staged in this batch to avoid duplicates
        const stagedUnitNames = new Set(units.map(u => u.name.toLowerCase()));

        for (const p of testTypeForm.selectedParameters) {
          if (p.id) {
            finalParameterIds.push(p.id);
          } else {
            const newParamRef = doc(collection(db, "pathologyParameters"));

            // Parse "X - Y" range string into numeric min/max for the flagging engine
            const parseRange = (rangeStr: string) => {
              const match = rangeStr?.trim().match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
              if (match) return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
              const ltMatch = rangeStr?.trim().match(/^[<]\s*([\d.]+)$/);
              if (ltMatch) return { max: parseFloat(ltMatch[1]) };
              const gtMatch = rangeStr?.trim().match(/^[>]\s*([\d.]+)$/);
              if (gtMatch) return { min: parseFloat(gtMatch[1]) };
              return {};
            };
            const parsedRange = parseRange(p.range);

            const newParamData = {
              name: p.name,
              unit: p.unit,
              allRange: { description: p.range, tiers: p.tiers || [], ...parsedRange },
              maleRange: { description: p.range, tiers: p.tiers || [], ...parsedRange },
              femaleRange: { description: p.range, tiers: p.tiers || [], ...parsedRange },
              resultType: p.resultType,
              categoryId: finalCategoryId,
              clinicId: clinicId!,
              branchId: branchId!,
              isActive: true,
              isGenderSensitive: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: currentUser?.uid || ""
            };
            batch.set(newParamRef, newParamData);
            finalParameterIds.push(newParamRef.id);

            // Auto-create unit in pathologyUnits if not already present
            if (p.unit?.trim() && !stagedUnitNames.has(p.unit.trim().toLowerCase())) {
              const newUnitRef = doc(collection(db, "pathologyUnits"));
              batch.set(newUnitRef, {
                name: p.unit.trim(),
                clinicId: clinicId!,
                branchId: branchId!,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: currentUser?.uid || ""
              });
              stagedUnitNames.add(p.unit.trim().toLowerCase());
            }
          }
        }
      }

      // 3. Create/Update Template
      const templateData: Omit<PathologyTestTemplate, "id" | "createdAt" | "updatedAt"> = {
        name: testTypeForm.name.trim(),
        categoryId: finalCategoryId,
        categoryName: finalCategoryName,
        targetType: testTypeForm.targetType,
        parameters: finalParameterIds,
        price: parseFloat(testTypeForm.price) || 0,
        reportDays: parseInt(testTypeForm.reportDays) || 1,
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdBy: currentUser?.uid || "",
        isMicrobiology: testTypeForm.isMicrobiology,
      };

      if (isEditing && testTypeForm.id) {
        const templateRef = doc(db, "pathologyTestTemplates", testTypeForm.id);
        batch.update(templateRef, { ...templateData, updatedAt: new Date() });
      } else {
        const templateRef = doc(collection(db, "pathologyTestTemplates"));
        batch.set(templateRef, { ...templateData, createdAt: new Date(), updatedAt: new Date() });
      }

      await batch.commit();
      addToast({ title: "Success", description: isEditing ? "Test template updated successfully" : "New test template architected successfully", color: "success" });
      testTypeModalState.close();
      reloadAllData();
      resetTestTypeForm();
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", description: "Failed to save test configuration", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleRunMigrations = async () => {
    let rangesFixed = 0;
    let unitsCreated = 0;
    try {
      setLoading(true);

      // 1. Backfill Ranges
      const toUpdate = parameters.filter(p => {
        const r = p.allRange;
        return r && r.description && r.min === undefined && r.max === undefined;
      });

      if (toUpdate.length > 0) {
        const parseRange = (rangeStr: string) => {
          const match = rangeStr?.trim().match(/^([\d.]+)\s*[-\u2013]\s*([\d.]+)$/);
          if (match) return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
          const ltMatch = rangeStr?.trim().match(/^[<]\s*([\d.]+)$/);
          if (ltMatch) return { max: parseFloat(ltMatch[1]) };
          const gtMatch = rangeStr?.trim().match(/^[>]\s*([\d.]+)$/);
          if (gtMatch) return { min: parseFloat(gtMatch[1]) };
          return null;
        };

        // Firestore batches max 500 ops — chunk if needed
        const CHUNK = 400;
        for (let i = 0; i < toUpdate.length; i += CHUNK) {
          const chunk = toUpdate.slice(i, i + CHUNK);
          const batch = writeBatch(db);
          for (const p of chunk) {
            const parsed = parseRange(p.allRange?.description || "");
            if (!parsed) continue;
            const ref = doc(db, "pathologyParameters", p.id);
            const update: any = {
              "allRange.min": parsed.min ?? null,
              "allRange.max": parsed.max ?? null,
              "maleRange.min": parsed.min ?? null,
              "maleRange.max": parsed.max ?? null,
              "femaleRange.min": parsed.min ?? null,
              "femaleRange.max": parsed.max ?? null,
              updatedAt: new Date(),
            };
            // Remove null keys (Firestore doesn't accept undefined)
            Object.keys(update).forEach(k => { if (update[k] === null) delete update[k]; });
            batch.update(ref, update);
            rangesFixed++;
          }
          await batch.commit();
        }
      }

      // 2. Extract Missing Units
      const existingUnitNames = new Set(units.map(u => u.name.toLowerCase()));
      const unitsToCreate = new Set<string>();

      parameters.forEach(p => {
        if (p.unit && p.unit.trim()) {
          const unitLower = p.unit.trim().toLowerCase();
          if (!existingUnitNames.has(unitLower)) {
            unitsToCreate.add(p.unit.trim());
          }
        }
      });

      if (unitsToCreate.size > 0) {
        const unitBatch = writeBatch(db);
        Array.from(unitsToCreate).forEach(unitName => {
          const newUnitRef = doc(collection(db, "pathologyUnits"));
          unitBatch.set(newUnitRef, {
            name: unitName,
            clinicId: clinicId!,
            branchId: branchId!,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: currentUser?.uid || ""
          });
          unitsCreated++;
        });
        await unitBatch.commit();
      }

      await reloadAllData();

      if (rangesFixed === 0 && unitsCreated === 0) {
        addToast({ title: "All Good", description: "No migrations needed.", color: "success" });
      } else {
        addToast({ title: "Migration Complete", description: `${rangesFixed} range(s) fixed. ${unitsCreated} missing unit(s) created.`, color: "success" });
      }
    } catch (e) {
      console.error(e);
      addToast({ title: "Migration Failed", description: "Could not run migrations.", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuickPatient = async () => {
    if (!quickPatientForm.name.trim()) return;
    try {
      setLoading(true);
      const regNumber = await patientService.getNextRegistrationNumber(clinicId!);
      const patientData: any = { ...quickPatientForm, regNumber, clinicId: clinicId!, branchId: branchId!, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: currentUser?.uid || "" };
      const patientId = await patientService.createPatient(patientData);
      setPatients(await patientService.getPatientsByClinic(clinicId!, branchId!));
      setTestForm(prev => ({ ...prev, patientId, patientName: quickPatientForm.name }));
      quickPatientModalState.close();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true);
      if (itemToDelete.type === 'order') await pathologyService.deleteOrder(itemToDelete.id);
      else if (itemToDelete.type === 'testType') await pathologyService.deleteTestTemplate(itemToDelete.id);
      else if (itemToDelete.type === 'parameter') await pathologyService.deleteParameter(itemToDelete.id);
      else if (itemToDelete.type === 'category') await pathologyService.deleteCategory(itemToDelete.id);
      else if (itemToDelete.type === 'unit') await pathologyService.deleteUnit(itemToDelete.id);

      // Refresh all relevant data
      const [ordersData, templatesData, parametersData, categoriesData, unitsData] = await Promise.all([
        pathologyService.getOrdersByClinic(clinicId!, branchId!),
        pathologyService.getTestTemplatesByClinic(clinicId!, branchId!),
        pathologyService.getParametersByClinic(clinicId!, branchId!),
        pathologyService.getCategoriesByClinic(clinicId!, branchId!),
        pathologyService.getUnitsByClinic(clinicId!, branchId!),
      ]);
      setOrders(ordersData);
      setTemplates(templatesData);
      setParameters(parametersData);
      setCategories(categoriesData);
      setUnits(unitsData);
      deleteConfirmModalState.close();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const editCategory = (c: any) => { setCategoryForm({ id: c.id, name: c.name }); setIsEditing(true); categoryModalState.open(); };
  const editUnit = (u: any) => { setUnitForm({ id: u.id, name: u.name }); setIsEditing(true); unitModalState.open(); };
  const addParameterToCategory = (c: any) => { resetParameterForm(); setParameterForm(prev => ({ ...prev, categoryId: c.id })); parameterModalState.open(); };
  const editParameter = (p: any) => {
    setParameterForm({
      id: p.id,
      categoryId: p.categoryId || "",
      name: p.name,
      referenceRange: p.allRange?.description || "",
      unit: p.unit,
      resultType: p.resultType || "numeric",
      isGenderSensitive: p.isGenderSensitive || false,
      tiers: p.allRange?.tiers || []
    });
    setIsEditing(true);
    parameterModalState.open();
  };
  const editTestType = (t: any) => {
    const mappedParameters = t.parameters.map((pid: string) => {
      const p = parameters.find(param => param.id === pid);
      return {
        id: pid,
        name: p?.name || "Unknown Parameter",
        unit: p?.unit || "",
        range: p?.allRange?.description || "",
        resultType: p?.resultType || "numeric",
        tiers: p?.allRange?.tiers || []
      };
    });

    setTestTypeForm({
      id: t.id,
      name: t.name,
      targetType: t.targetType || 'parameter',
      categoryId: t.categoryId,
      newCategoryName: "",
      price: t.price.toString(),
      reportDays: t.reportDays?.toString() || "1",
      isMicrobiology: t.isMicrobiology || false,
      selectedParameters: mappedParameters
    });
    setIsEditing(true);
    testTypeModalState.open();
  };

  const handlePrintTest = async (order: PathologyOrder) => {
    try {
      if (!clinic) return;
      const reportHtml = generatePathologyReportHTML(order as any, clinic, layoutConfig, templates, parameters);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
      }
    } catch (e) {
      console.error(e);
    }
  };

  async function reloadAllData() {
    if (!clinicId || !branchId) return;
    const [
      ordersData, templatesData, categoriesData, unitsData, parametersData, techniciansData, billingsData, patientsData, testsData, signatoriesData
    ] = await Promise.all([
      pathologyService.getOrdersByClinic(clinicId, branchId),
      pathologyService.getTestTemplatesByClinic(clinicId, branchId),
      pathologyService.getCategoriesByClinic(clinicId, branchId),
      pathologyService.getUnitsByClinic(clinicId, branchId),
      pathologyService.getParametersByClinic(clinicId, branchId),
      labTechnicianService.getTechniciansByClinic(clinicId, branchId),
      pathologyBillingService.getBillingByClinic(clinicId, branchId),
      patientService.getPatientsByClinic(clinicId, branchId),
      pathologyService.getTestsByClinic(clinicId, branchId),
      pathologySignatoryService.getSignatoriesByClinic(clinicId, branchId),
    ]);
    setOrders(ordersData);
    setTemplates(templatesData);
    setCategories(categoriesData);
    setUnits(unitsData);
    setParameters(parametersData);
    setLabTechnicians(techniciansData);
    setBillings(billingsData);
    setPatients(patientsData);
    setTests(testsData);
    setPathologySignatories(signatoriesData);
  };

  const handleBulkSeed = async () => {
    if (!clinicId || !branchId || !currentUser || seederSelectedIds.length === 0) return;
    try {
      setLoading(true);
      await pathologyService.seedSelectedTests(seederSelectedIds, clinicId, branchId, currentUser.uid);
      addToast({ title: "Success", description: "Selected Diagnostics deployed successfully!", color: "success" });
      seederModalState.close();
      setSeederSelectedIds([]);
      await reloadAllData();
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", description: "Failed to deploy diagnostics", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateAll = async () => {
    if (!clinicId || !branchId || !currentUser) return;
    if (!confirm("This will migrate all non-migrated legacy tests to the modern Pathology Order system. Do you want to proceed?")) return;

    try {
      setIsMigrating(true);
      const result = await pathologyService.migrateLegacyTests(clinicId, branchId, currentUser.uid);
      addToast({
        title: "Migration Complete",
        description: `Successfully unified ${result.success} records. ${result.failed > 0 ? `${result.failed} failed.` : ""}`,
        color: result.failed > 0 ? "warning" : "success"
      });
      await reloadAllData();
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", description: "Migration failed", color: "danger" });
    } finally {
      setIsMigrating(false);
    }
  };



  const handleBulkDeleteParameters = async (ids: string[]) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} parameters?`)) return;
    try {
      setLoading(true);
      await pathologyService.bulkDeleteParameters(ids);
      addToast({ title: "Success", description: `${ids.length} parameters deleted successfully`, color: "success" });
      await reloadAllData();
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", description: "Failed to delete parameters", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (type: string, id: string, name: string) => {
    setItemToDelete({ type, id, name });
    deleteConfirmModalState.open();
  };

  const buildDailyReportHtml = (reportData: any, date: string, clinic: any, layout: any) => {
    const headerHtml = getPrintHeaderHTML(layout, clinic, false);
    const footerHtml = getPrintFooterHTML(layout);
    const brandingCss = getPrintBrandingCSS(layout);

    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Pathology Report - ${date}</title>
          <style>
            ${brandingCss}
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; line-height: 1.5; }
            .report-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .summary-card { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
            .summary-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
            .summary-value { font-size: 18px; font-weight: 600; color: #0f172a; }
            
            .section-title { font-size: 14px; font-weight: 600; color: #334155; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin: 30px 0 15px 0; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; font-size: 11px; font-weight: 500; color: #64748b; background: #f1f5f9; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
            td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12.5px; color: #334155; }
            
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; }
            .badge-teal { background: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; }
            
            .text-right { text-align: right; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
            
            @media print {
              @page { margin: 15mm; }
              body { -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            ${headerHtml}
            
            <div style="margin-bottom: 25px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px; color: #0f172a;">Daily Operational Summary</h2>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">${formattedDate}</p>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">Total Tests</div>
                <div class="summary-value">${reportData.totalTests}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Patients</div>
                <div class="summary-value">${reportData.totalPatients}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Revenue</div>
                <div class="summary-value">NPR ${reportData.totalRevenue.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Paid</div>
                <div class="summary-value">NPR ${reportData.totalPaid.toLocaleString()}</div>
              </div>
            </div>

            <div class="section-title">Tests Performed</div>
            <table>
              <thead>
                <tr>
                  <th>Lab ID</th>
                  <th>Patient Name</th>
                  <th>Tests</th>
                  <th>Technician</th>
                  <th class="text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.dailyTests.map((order: any) => `
                  <tr>
                    <td class="font-mono">${order.orderNumber}</td>
                    <td><strong>${order.patientName}</strong><br><span style="font-size: 11px; color: #64748b;">${order.patientAge}y • ${order.patientGender}</span></td>
                    <td>${order.testNames?.join(", ")}</td>
                    <td>${order.labTechnicianName || "—"}</td>
                    <td class="text-right">${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="section-title">Financial Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.dailyBillings.map((billing: any) => `
                  <tr>
                    <td class="font-mono">${billing.invoiceNumber}</td>
                    <td>${billing.patientName}</td>
                    <td>${billing.items?.length}</td>
                    <td><span class="badge ${billing.status === 'paid' ? 'badge-teal' : ''}">${billing.status}</span></td>
                    <td class="text-right">NPR ${billing.totalAmount.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${footerHtml}
          </div>
        </body>
      </html>
    `;
  };


  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!clinicId || !branchId) return;

      try {
        setLoading(true);
        const [
          ordersData,
          templatesData,
          categoriesData,
          unitsData,
          parametersData,
          techniciansData,
          billingsData,
          clinicData,
          layoutConfigData,
          patientsData,
          testsData,
          signatoriesData,
        ] = await Promise.all([
          pathologyService.getOrdersByClinic(clinicId, branchId),
          pathologyService.getTestTemplatesByClinic(clinicId, branchId),
          pathologyService.getCategoriesByClinic(clinicId, branchId),
          pathologyService.getUnitsByClinic(clinicId, branchId),
          pathologyService.getParametersByClinic(clinicId, branchId),
          labTechnicianService.getTechniciansByClinic(clinicId, branchId),
          pathologyBillingService.getBillingByClinic(clinicId, branchId),
          clinicService.getClinicById(clinicId),
          clinicService.getPrintLayoutConfig(clinicId),
          patientService.getPatientsByClinic(clinicId, branchId),
          pathologyService.getTestsByClinic(clinicId, branchId),
          pathologySignatoryService.getSignatoriesByClinic(clinicId, branchId),
        ]);


        setOrders(ordersData);
        setTemplates(templatesData);
        setCategories(categoriesData);
        setUnits(unitsData);
        setParameters(parametersData);
        setLabTechnicians(techniciansData);
        setBillings(billingsData);
        setClinic(clinicData);
        setLayoutConfig(layoutConfigData);
        setPatients(patientsData);
        setTests(testsData);
        setPathologySignatories(signatoriesData);

      } catch (error) {
        console.error("Error loading pathology data:", error);
        addToast({
          title: "Error",
          description: "Failed to load pathology data. Please try again.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clinicId, branchId]);

  const editTest = (order: PathologyOrder) => {
    setSelectedOrder(order);
    resultEntryModalState.open();
  };

  const handleAssignStaff = async (orderId: string, technicianIds: string[]) => {
    const order = orders.find(o => o.id === orderId);
    // Prevent redundant updates if the selection hasn't changed
    const currentIds = order?.labTechnicianIds || (order?.labTechnicianId ? [order.labTechnicianId] : []);
    if (JSON.stringify([...currentIds].sort()) === JSON.stringify([...technicianIds].sort())) {
      return;
    }

    const selectedTechnicians = labTechnicians.filter(t => technicianIds.includes(t.id));
    const technicianNames = selectedTechnicians.map(t => t.name);

    try {
      await pathologyService.updateOrder(orderId, {
        labTechnicianIds: technicianIds,
        labTechnicianNames: technicianNames,
        labTechnicianSignatureUrls: selectedTechnicians.map(t => t.signatureUrl || ""),
        // Maintain backward compatibility for single technician field
        labTechnicianId: technicianIds[0] || "",
        labTechnicianName: technicianNames[0] || "",
        updatedAt: new Date(),
      });

      addToast({
        title: "Success",
        description: `${selectedTechnicians.length} staff members assigned successfully`,
        color: "success",
      });

      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        labTechnicianIds: technicianIds,
        labTechnicianNames: technicianNames,
        labTechnicianSignatureUrls: selectedTechnicians.map(t => t.signatureUrl || ""),
        labTechnicianId: technicianIds[0] || "",
        labTechnicianName: technicianNames[0] || ""
      } : o));
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", description: "Failed to assign staff", color: "danger" });
    }
  };

  const handleAssignSignatory = async (orderId: string, signatoryId: string) => {
    const signatory = pathologySignatories.find(s => s.id === signatoryId);
    if (!signatory) return;

    try {
      await pathologyService.updateOrder(orderId, {
        verifiedById: signatory.id,
        verifiedByName: signatory.name,
        verifiedByRegNo: signatory.registrationNumber,
        verifiedByDesignation: signatory.designation,
        verifiedBySignatureUrl: signatory.signatureUrl || "",
        updatedAt: new Date(),
      });

      addToast({
        title: "Success",
        description: `Authorized signatory ${signatory.name} assigned`,
        color: "success",
      });

      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        verifiedById: signatory.id,
        verifiedByName: signatory.name,
        verifiedByRegNo: signatory.registrationNumber,
        verifiedByDesignation: signatory.designation,
        verifiedBySignatureUrl: signatory.signatureUrl || ""
      } : o));
    } catch (e) {
      console.error(e);
      addToast({ title: "Error", description: "Failed to assign signatory", color: "danger" });
    }
  };


  const handleSaveResults = async (
    results: PathologyResult[],
    status: PathologyOrder["status"],
    microData?: {
      organismIsolated?: string;
      colonyCount?: string;
      sensitivities?: any[];
      isMicrobiology?: boolean;
    }
  ) => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      await pathologyService.updateOrder(selectedOrder.id, {
        results,
        status,
        ...microData,
        updatedAt: new Date(),
      });

      addToast({
        title: "Success",
        description: `Lab order ${status === "verified" ? "verified" : "updated"} successfully`,
        color: "success",
      });

      // Reload orders
      const ordersData = await pathologyService.getOrdersByClinic(
        clinicId!,
        branchId!,
      );
      setOrders(ordersData);
      resultEntryModalState.close();
    } catch (error) {
      console.error("Error updating order results:", error);
      addToast({
        title: "Error",
        description: "Failed to update lab results",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner label="Loading pathology data..." size="lg" />
      </div>
    );
  }

  const tabLabels: Record<(typeof TAB_KEYS)[number], string> = {
    worklist: "Lab Worklist",
    billing: "Billing & Invoicing",
    catalog: "Lab Catalog",
    technicians: "Lab Technicians",
    signatories: "Authorized Signatories",
    dailyReport: "Daily Summary",
    legacy: "Legacy Tests",
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title()}>Pathology</h1>
          <p className="text-mountain-500 mt-2 text-[13.5px]">
            Manage pathology tests, categories, units, and parameters
          </p>
        </div>
      </div>
      {/* Main Content */}
      <div className="clarity-card border border-mountain-200 rounded">
        {/* Tab header */}
        <div className="border-b border-mountain-200 overflow-x-auto">
          <div className="inline-flex rounded-t">
            {TAB_KEYS.map((key) => (
              <button
                key={key}
                className={`px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${activeTab === key
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-mountain-600 hover:text-mountain-900 hover:border-mountain-300"
                  }`}
                type="button"
                onClick={() => setActiveTab(key)}
              >
                {tabLabels[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeTab === "worklist" && (
            <PathologyTestsTab
              filteredTests={filteredOrders}
              searchQuery={testsSearchQuery}
              technicians={labTechnicians}
              signatories={pathologySignatories}
              onAssignStaff={handleAssignStaff}
              onAssignSignatory={handleAssignSignatory}
              onAdd={() => {
                resetTestForm();
                testModalState.open();
              }}
              onDelete={(order) =>
                openDeleteModal("order", order.id, order.orderNumber)
              }
              onEdit={editTest}
              onPrint={handlePrintTest}
              onSearchChange={setTestsSearchQuery}
            />
          )}
          {activeTab === "catalog" && (
            <PathologyCatalogTab
              templates={templates}
              parameters={parameters}
              categories={categories}
              units={units}
              searchQuery={testsSearchQuery} // Using same search query state for simplicity or could separate
              onSearchChange={setTestsSearchQuery}
              // Templates
              onAddTemplate={() => {
                resetTestTypeForm();
                testTypeModalState.open();
              }}
              onEditTemplate={editTestType}
              onDeleteTemplate={(t) => openDeleteModal("testType", t.id, t.name)}
              // Parameters
              onAddParameter={() => {
                resetParameterForm();
                parameterModalState.open();
              }}
              onEditParameter={editParameter}
              onDeleteParameter={(p) => openDeleteModal("parameter", p.id, p.name)}
              onBulkDeleteParameter={handleBulkDeleteParameters}
              // Categories
              onAddCategory={() => {
                resetCategoryForm();
                categoryModalState.open();
              }}
              onEditCategory={editCategory}
              onDeleteCategory={(c) => openDeleteModal("category", c.id, c.name)}
              onAddSubCategory={addParameterToCategory}

              // Units
              onAddUnit={() => {
                resetUnitForm();
                unitModalState.open();
              }}
              onEditUnit={editUnit}
              onDeleteUnit={(u) => openDeleteModal("unit", u.id, u.name)}
              onOpenSeeder={seederModalState.open}
              onBackfillRanges={handleRunMigrations}
            />
          )}

          {activeTab === "technicians" && (
            <LabTechnicianManagement
              branchId={branchId!}
              clinicId={clinicId!}
              onRefresh={reloadAllData}
            />
          )}
          {activeTab === "signatories" && (
            <PathologySignatoryManagement
              branchId={branchId!}
              clinicId={clinicId!}
              onRefresh={reloadAllData}
            />
          )}
          {activeTab === "dailyReport" && (
            <PathologyDailyReportTab
              categories={categories}
              dailyReportData={dailyReportData}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onPrintReport={() => {
                const printWindow = window.open(
                  "",
                  "_blank",
                  "width=900,height=1200",
                );

                if (printWindow) {
                  const reportHtml = buildDailyReportHtml(
                    dailyReportData,
                    selectedDate,
                    clinic,
                    layoutConfig,
                  );

                  printWindow.document.write(reportHtml);
                  printWindow.document.close();
                }
              }}
            />
          )}
          {activeTab === "billing" && (
            <PathologyBillingTab
              branchId={branchId!}
              clinicId={clinicId!}
              patients={patients}
              templates={templates}
              onRefresh={reloadAllData}
            />
          )}

          {activeTab === "legacy" && (
            <LegacyTestsTab
              categories={categories}
              patients={patients}
              parameters={parameters}
              technicians={labTechnicians}
              tests={tests}
              onAddTest={() => {
                resetTestForm();
                testModalState.open();
              }}
              onDeleteTest={(id, name) => openDeleteModal('test', id, name)}
              onEditTest={(t) => {
                setTestForm({
                  id: t.id,
                  isWalkIn: false,
                  walkInPhone: "",
                  patientId: t.patientId,
                  patientName: t.patientName,
                  patientAge: "",
                  patientGender: "",
                  selectedTemplates: [] as string[],
                  testType: "",
                  selectedCategories: [],
                  reportDays: "",
                  chargeCategory: "",
                  standardCharge: "",
                  labTechnicianId: t.technicianId || "",
                  verifiedById: (t as any).verifiedById || "",
                  parameters: t.parameters.map((p: any) => ({
                    categoryId: p.categoryId,
                    parameterId: p.parameterId,
                    parameterName: p.parameterName || "",
                    patientResult: p.result,
                    referenceRange: p.referenceRange,
                    unit: p.unit
                  }))
                });
                setIsEditing(true);
                testModalState.open();
              }}
              onPrintTest={handlePrintTest}
              onMigrateAll={handleMigrateAll}
              isMigrating={isMigrating}
            />
          )}


        </div>

      </div>

      {/* Test Form Modal - custom overlay */}
      {
        testModalState.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2">
            <div
              className="absolute inset-0 bg-mountain-900/70 backdrop-blur-2xl"
              onClick={testModalState.close}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-[98vw] h-[98vh] flex flex-col shadow-2xl">
              <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between shrink-0">
                <h2 className="text-[14px] font-semibold text-mountain-900">
                  {isEditing ? "Edit Pathology Test" : "Create Pathology Tests"}
                </h2>
                <button
                  className="text-mountain-400 hover:text-mountain-700"
                  type="button"
                  onClick={testModalState.close}
                >
                  <IoArrowBackOutline className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {/* Test Details Section */}
                  <h3 className="text-lg font-semibold mb-4">Test Details</h3>

                  {/* Walk-in vs Existing Patient Toggle */}
                  <div className="flex bg-mountain-100 p-1 rounded-md w-max mb-4">
                    <button
                      className={`px-4 py-1.5 text-sm rounded ${!testForm.isWalkIn ? "bg-white shadow text-mountain-900 font-medium" : "text-mountain-600 hover:text-mountain-900"}`}
                      type="button"
                      onClick={() =>
                        setTestForm((prev) => ({
                          ...prev,
                          isWalkIn: false,
                          patientId: "",
                          patientName: "",
                          patientAge: "",
                          patientGender: "",
                          walkInPhone: "",
                        }))
                      }
                    >
                      Existing Patient
                    </button>
                    <button
                      className={`px-4 py-1.5 text-sm rounded ${testForm.isWalkIn ? "bg-white shadow text-mountain-900 font-medium" : "text-mountain-600 hover:text-mountain-900"}`}
                      type="button"
                      onClick={() =>
                        setTestForm((prev) => ({
                          ...prev,
                          isWalkIn: true,
                          patientId: "",
                          patientName: "",
                          patientAge: "",
                          patientGender: "",
                          walkInPhone: "",
                        }))
                      }
                    >
                      Walk-In Client
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {!testForm.isWalkIn ? (
                      <PathologySearchSelect
                        required
                        items={patients.map((p) => ({
                          id: p.id,
                          primary: p.name,
                          secondary: `${p.mobile || ""} ${p.age ? `(${p.age}y)` : ""} `,
                        }))}
                        label="Patient Name *"
                        placeholder="Search or enter patient name"
                        value={testForm.patientId}
                        onChange={(id, primary) => {
                          const patient = patients.find((p) => p.id === id);

                          setTestForm((prev) => ({
                            ...prev,
                            patientId: id,
                            patientName: primary,
                            patientAge:
                              patient?.age?.toString() || prev.patientAge,
                            patientGender:
                              patient?.gender || prev.patientGender,
                          }));
                        }}
                        onInputChange={(val) =>
                          setTestForm((prev) => ({
                            ...prev,
                            patientName: val,
                            patientId: "",
                          }))
                        }
                      />
                    ) : (
                      <>
                        <Input
                          isRequired
                          label="Patient Name *"
                          placeholder="Walk-In Name"
                          value={testForm.patientName}
                          onValueChange={(v) =>
                            setTestForm((prev) => ({ ...prev, patientName: v }))
                          }
                        />
                        <Input
                          label="Phone Number"
                          placeholder="Phone Number"
                          value={testForm.walkInPhone}
                          onValueChange={(v) =>
                            setTestForm((prev) => ({ ...prev, walkInPhone: v }))
                          }
                        />
                      </>
                    )}

                    <Input
                      label="Patient Age"
                      placeholder="Enter patient age"
                      type="number"
                      value={testForm.patientAge}
                      onValueChange={(v) =>
                        setTestForm((prev) => ({ ...prev, patientAge: v }))
                      }
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-mountain-700">
                        Patient Gender
                      </label>
                      <select
                        className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                        value={testForm.patientGender}
                        onChange={(e) =>
                          setTestForm((prev) => ({
                            ...prev,
                            patientGender: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>


                    <div className="flex flex-col gap-2">
                      <PathologySearchSelect
                        items={templates.filter(t => !testForm.selectedTemplates.includes(t.name)).map((t) => ({
                          id: t.name,
                          primary: t.name,
                          secondary: `NPR ${t.price.toLocaleString()} `,
                        }))}
                        label="Add Test Template"
                        placeholder="Search to add another test..."
                        value="" // Always empty to act as an "Add" field
                        onChange={(id, primary) => {
                          const template = templates.find((t) => t.name === primary);
                          const patient = patients.find(p => p.id === testForm.patientId);
                          const gender = patient?.gender || testForm.patientGender;

                          if (!template) return;

                          setTestForm((prev) => {
                            const existingParamIds = new Set(prev.parameters.map(p => p.parameterId));

                            // Add a header row for the template itself
                            const headerRow = {
                              categoryId: template.categoryId || "",
                              parameterId: `header_${template.name}`,
                              parameterName: template.name,
                              patientResult: "",
                              referenceRange: "",
                              unit: "",
                              isHeader: true,
                              indentationLevel: 0
                            };

                            // Self-healing: Dynamically fetch parameters if targetType is 'category'
                            const templateParamIds = template.targetType === 'category'
                              ? parameters.filter(p => p.categoryId === template.categoryId).map(p => p.id)
                              : template.parameters;

                            const newParamsFromTemplate = (templateParamIds || [])
                              .filter(paramId => !existingParamIds.has(paramId))
                              .map(paramId => {
                                const p = parameters.find(param => param.id === paramId);
                                let range = formatRange(p?.allRange);
                                if (p?.isGenderSensitive) {
                                  if (gender?.toLowerCase() === 'male') range = formatRange(p.maleRange);
                                  else if (gender?.toLowerCase() === 'female') range = formatRange(p.femaleRange);
                                }
                                const unitObj = units.find(u => u.id === p?.unit);
                                const unitName = unitObj?.name || p?.unit || "";

                                return {
                                  categoryId: p?.categoryId || "",
                                  parameterId: paramId,
                                  parameterName: p?.name || "",
                                  patientResult: "",
                                  referenceRange: range,
                                  unit: unitName,
                                  isHeader: p?.isHeader || false,
                                  indentationLevel: p?.indentationLevel || (p?.isHeader ? 0 : 1)
                                };
                              });

                            const currentParams = prev.parameters.filter(p => p.parameterId !== "");
                            const finalParams = [...currentParams, headerRow, ...newParamsFromTemplate];

                            const updatedTemplates = [...prev.selectedTemplates, primary];
                            const newCharge = parseInt(prev.standardCharge || "0") + template.price;

                            return {
                              ...prev,
                              selectedTemplates: updatedTemplates,
                              testType: updatedTemplates.join(" + "),
                              standardCharge: newCharge.toString(),
                              parameters: finalParams,
                              selectedCategories: template?.categoryId && !prev.selectedCategories.includes(template.categoryId)
                                ? [...prev.selectedCategories, template.categoryId]
                                : prev.selectedCategories
                            };
                          });
                        }}
                      />

                      {testForm.selectedTemplates.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {testForm.selectedTemplates.map((tName) => (
                            <div key={tName} className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 border border-teal-100 rounded text-[12px] font-medium text-teal-700">
                              {tName}
                              <button
                                type="button"
                                onClick={() => {
                                  setTestForm(prev => {
                                    const template = templates.find(t => t.name === tName);
                                    const updatedTemplates = prev.selectedTemplates.filter(t => t !== tName);
                                    const newCharge = parseInt(prev.standardCharge || "0") - (template?.price || 0);

                                    // Optionally remove parameters associated with this template if they aren't in other selected templates
                                    // For simplicity now, we just keep the parameters but remove the chip
                                    return {
                                      ...prev,
                                      selectedTemplates: updatedTemplates,
                                      testType: updatedTemplates.join(" + "),
                                      standardCharge: Math.max(0, newCharge).toString()
                                    };
                                  });
                                }}
                                className="hover:text-teal-900"
                              >
                                <IoCloseOutline className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>


                    <div className="flex flex-col gap-2">
                      <PathologySearchSelect
                        items={categories.map((c) => ({
                          id: c.id,
                          primary: c.name,
                        }))}
                        label="Category Name"
                        placeholder="Search and select category"
                        value="" // Always empty to allow multiple selections
                        onChange={(id) => {
                          if (!id || testForm.selectedCategories.includes(id)) return;

                          const patient = patients.find(p => p.id === testForm.patientId);
                          const gender = patient?.gender || testForm.patientGender;
                          const categoryName = categories.find(c => c.id === id)?.name || "Category";

                          setTestForm((prev) => {
                            const headerRow = {
                              categoryId: id,
                              parameterId: `header_${id}`,
                              parameterName: categoryName,
                              patientResult: "",
                              referenceRange: "",
                              unit: "",
                              isHeader: true,
                              indentationLevel: 0
                            };

                            const categoryParams = parameters
                              .filter(p => p.categoryId === id)
                              .map(p => {
                                let range = formatRange(p?.allRange);
                                if (p?.isGenderSensitive) {
                                  if (gender?.toLowerCase() === 'male') range = formatRange(p.maleRange);
                                  else if (gender?.toLowerCase() === 'female') range = formatRange(p.femaleRange);
                                }
                                const unitObj = units.find(u => u.id === p?.unit);
                                return {
                                  categoryId: id,
                                  parameterId: p.id,
                                  parameterName: p.name,
                                  patientResult: "",
                                  referenceRange: range,
                                  unit: unitObj?.name || p.unit || "",
                                  isHeader: p.isHeader || false,
                                  indentationLevel: p.indentationLevel || (p.isHeader ? 0 : 1)
                                };
                              });

                            const currentParams = prev.parameters.filter(p => p.parameterId !== "");

                            return {
                              ...prev,
                              selectedCategories: [...prev.selectedCategories, id],
                              parameters: [...currentParams, headerRow, ...categoryParams]
                            };
                          });
                        }}
                      />

                      {testForm.selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {testForm.selectedCategories.map((catId) => {
                            const cat = categories.find(c => c.id === catId);
                            if (!cat) return null;
                            return (
                              <div key={catId} className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 border border-teal-100 rounded text-[12px] font-medium text-teal-700">
                                {cat.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTestForm(prev => ({
                                      ...prev,
                                      selectedCategories: prev.selectedCategories.filter(id => id !== catId),
                                      parameters: prev.parameters.filter(p => p.categoryId !== catId)
                                    }));
                                  }}
                                  className="hover:text-teal-900"
                                >
                                  <IoCloseOutline className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>


                    <Input
                      label="Report Days"
                      placeholder="Report Days"
                      type="number"
                      value={testForm.reportDays}
                      onValueChange={(v) =>
                        setTestForm((prev) => ({ ...prev, reportDays: v }))
                      }
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-mountain-700">
                        Charge Category
                      </label>
                      <select
                        className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                        value={testForm.chargeCategory}
                        onChange={(e) =>
                          setTestForm((prev) => ({
                            ...prev,
                            chargeCategory: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select Charge Category</option>
                        <option value="lab">Lab</option>
                        <option value="fee">Fee</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <Input
                      label="Standard Charge (NPR)"
                      placeholder="Standard Charge"
                      type="number"
                      value={testForm.standardCharge}
                      onValueChange={(v) =>
                        setTestForm((prev) => ({ ...prev, standardCharge: v }))
                      }
                    />

                    <PathologySearchSelect
                      items={labTechnicians.map((t) => ({
                        id: t.id,
                        primary: t.name,
                        secondary: t.employeeId
                          ? `(${t.employeeId})`
                          : undefined,
                      }))}
                      label="Lab Technician (Optional)"
                      placeholder="Search and select lab technician"
                      value={testForm.labTechnicianId}
                      onChange={(id) =>
                        setTestForm((prev) => ({
                          ...prev,
                          labTechnicianId: id,
                        }))
                      }
                    />

                    <PathologySearchSelect
                      items={pathologySignatories.map((s) => ({
                        id: s.id,
                        primary: s.name,
                        secondary: s.designation,
                      }))}
                      label="Authorized Signatory (Optional)"
                      placeholder="Search and select pathologist"
                      value={testForm.verifiedById}
                      onChange={(id) =>
                        setTestForm((prev) => ({
                          ...prev,
                          verifiedById: id,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Parameters Section */}
                <div>
                  <h3 className="text-[14px] font-bold mb-4 text-teal-700">
                    Parameter Fields
                  </h3>
                  {testForm.parameters.map((param, index) => {
                    const paramMeta = parameters.find(p => p.id === param.parameterId);
                    const isHeader = paramMeta?.isHeader;
                    const indentationLevel = paramMeta?.indentationLevel || 0;

                    if (isHeader) {
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 mb-4 bg-teal-50/50 p-3 rounded border border-teal-100"
                        >
                          <div className="w-1 h-6 bg-teal-600 rounded-full" />
                          <div className="flex-1">
                            <PathologySearchSelect
                              items={parameters
                                .filter(p => p.isHeader)
                                .map(p => ({ id: p.id, primary: p.name }))}
                              label="Section Header"
                              placeholder="Select header"
                              value={param.parameterId}
                              onChange={(id) => updateTestParameter(index, "parameterId", id)}
                            />
                          </div>
                          <div className="flex items-center gap-1 self-end pb-1">
                            <Button isIconOnly size="sm" variant="light" onClick={() => moveTestParameter(index, "up")} disabled={index === 0}>
                              <IoArrowUpOutline className="text-mountain-400" />
                            </Button>
                            <Button isIconOnly color="danger" size="sm" variant="light" onClick={() => removeTestParameter(index)}>
                              <IoTrashOutline />
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 mb-4 items-end bg-mountain-50/30 p-2 rounded border border-mountain-100 transition-all"
                        style={{ marginLeft: `${indentationLevel * 20}px` }}
                      >
                        <div className="col-span-2">
                          <PathologySearchSelect
                            items={categories.map((c) => ({
                              id: c.id,
                              primary: c.name,
                            }))}
                            label="Category"
                            placeholder="Select category"
                            value={param.categoryId}
                            onChange={(id) => {
                              updateTestParameter(index, "categoryId", id);
                              updateTestParameter(index, "parameterId", "");
                            }}
                          />
                        </div>
                        <div className="col-span-2">
                          <PathologySearchSelect
                            required
                            items={parameters
                              .filter(
                                (p) =>
                                  (!param.categoryId || p.categoryId === param.categoryId) && !p.isHeader,
                              )
                              .map((p) => ({
                                id: p.id,
                                primary: p.name,
                                secondary: p.allRange?.description
                                  ? `Range: ${p.allRange.description} `
                                  : undefined,
                              }))}
                            label="Parameter *"
                            placeholder="Select parameter"
                            value={param.parameterId}
                            onChange={(id) => updateTestParameter(index, "parameterId", id)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            isRequired
                            label="Patient Result *"
                            placeholder="Result"
                            value={param.patientResult}
                            onValueChange={(v) => updateTestParameter(index, "patientResult", v)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            label="Ref. Range"
                            placeholder="Range"
                            value={param.referenceRange}
                            onValueChange={(v) => updateTestParameter(index, "referenceRange", v)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            label="Unit"
                            placeholder="Unit"
                            value={param.unit}
                            onValueChange={(v) => updateTestParameter(index, "unit", v)}
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center h-[32px] gap-1">
                          <Button isIconOnly size="sm" variant="light" onClick={() => moveTestParameter(index, "up")} disabled={index === 0}>
                            <IoArrowUpOutline className="text-mountain-400" />
                          </Button>
                          <Button isIconOnly color="danger" size="sm" variant="light" onClick={() => removeTestParameter(index)}>
                            <IoTrashOutline />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-center mt-4">
                    <Button
                      color="default"
                      startContent={<IoAddOutline />}
                      variant="bordered"
                      onClick={addTestParameter}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2 shrink-0">
                <Button variant="light" onClick={testModalState.close}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleSaveTest}>
                  {isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      }


      {/* Category Form Modal */}
      {
        categoryModalState.isOpen && createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-mountain-900/70 backdrop-blur-2xl"
              onClick={categoryModalState.close}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-md shadow-2xl">
              <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-mountain-900">
                  {isEditing
                    ? "Edit Pathology Category"
                    : "New Pathology Category"}
                </h2>
                <button onClick={categoryModalState.close} className="text-mountain-400 hover:text-mountain-700">
                  <IoCloseOutline className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <Input
                  isRequired
                  label="Name *"
                  placeholder="Category Name"
                  value={categoryForm.name}
                  onValueChange={(v) =>
                    setCategoryForm((prev) => ({ ...prev, name: v }))
                  }
                />
              </div>
              <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2">
                <Button variant="light" size="sm" onClick={categoryModalState.close}>
                  Cancel
                </Button>
                <Button color="primary" size="sm" onClick={handleSaveCategory}>
                  {isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* Unit Form Modal */}
      {
        unitModalState.isOpen && createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-mountain-900/70 backdrop-blur-2xl"
              onClick={unitModalState.close}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-md shadow-2xl">
              <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-mountain-900">
                  {isEditing ? "Edit Pathology Unit" : "New Pathology Unit"}
                </h2>
                <button onClick={unitModalState.close} className="text-mountain-400 hover:text-mountain-700">
                  <IoCloseOutline className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <Input
                  isRequired
                  label="Name *"
                  placeholder="Unit Name"
                  value={unitForm.name}
                  onValueChange={(v) =>
                    setUnitForm((prev) => ({ ...prev, name: v }))
                  }
                />
              </div>
              <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2">
                <Button variant="light" size="sm" onClick={unitModalState.close}>
                  Cancel
                </Button>
                <Button color="primary" size="sm" onClick={handleSaveUnit}>
                  {isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* Parameter Form Modal */}
      {
        parameterModalState.isOpen && createPortal(
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-2">
            <div
              className="absolute inset-0 bg-mountain-900/70 backdrop-blur-2xl"
              onClick={parameterModalState.close}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-[98vw] h-[98vh] shadow-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between shrink-0">
                <h2 className="text-[14px] font-semibold text-mountain-900">
                  {isEditing ? "Edit Parameter Configuration" : "New Parameter Configuration"}
                </h2>
                <button onClick={parameterModalState.close} className="text-mountain-400 hover:text-mountain-700">
                  <IoCloseOutline className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Section 1: Basic Identity */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-mountain-500 uppercase tracking-tight">Category *</label>
                      <select
                        className="h-[32px] border border-mountain-200 rounded px-2 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                        value={parameterForm.categoryId}
                        onChange={(e) => setParameterForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <Input
                      autoFocus
                      isRequired
                      label="Parameter Name"
                      placeholder="e.g. LDL Cholesterol"
                      value={parameterForm.name}
                      onValueChange={(v) => setParameterForm(prev => ({ ...prev, name: v }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-mountain-500 uppercase tracking-tight">Measurement Unit</label>
                      <select
                        className="h-[32px] border border-mountain-200 rounded px-2 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                        value={parameterForm.unit}
                        onChange={(e) => setParameterForm(prev => ({ ...prev, unit: e.target.value }))}
                      >
                        <option value="">No Unit</option>
                        {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-mountain-500 uppercase tracking-tight">Result Type *</label>
                      <select
                        className="h-[32px] border border-mountain-200 rounded px-2 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                        value={parameterForm.resultType}
                        onChange={(e) => setParameterForm(prev => ({ ...prev, resultType: e.target.value as any }))}
                      >
                        <option value="numeric">Numeric (Dynamic Tiers)</option>
                        <option value="text">Text (Observation)</option>
                        <option value="qualitative">Qualitative (Choice)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Clinical Diagnostics */}
                <div className="space-y-4 pt-4 border-t border-mountain-100">
                  <Input
                    label="Display Reference Range (Text Description) *"
                    placeholder="e.g. Optimal: <100, High: >160"
                    value={parameterForm.referenceRange}
                    onValueChange={(v) => setParameterForm(prev => ({ ...prev, referenceRange: v }))}
                  />

                  {parameterForm.resultType === "numeric" && (
                    <div className="bg-mountain-50/50 p-4 rounded border border-mountain-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[13px] font-semibold text-mountain-800">Multi-Tier Flagging (Dynamic)</h3>
                          <p className="text-[11px] text-mountain-500 mt-0.5">Define thresholds for automatic High/Low flagging.</p>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onClick={() => setParameterForm(prev => ({
                            ...prev,
                            tiers: [...prev.tiers, { label: "Normal", min: 0, max: 0, status: "normal" }]
                          }))}
                          startContent={<IoAddOutline />}
                        >
                          Add Tier
                        </Button>
                      </div>

                      {parameterForm.tiers.length > 0 ? (
                        <div className="space-y-2">
                          {parameterForm.tiers.map((tier, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-white p-2 rounded border border-mountain-100 shadow-sm">
                              <div className="col-span-4">
                                <label className="text-[10px] text-mountain-500 uppercase ml-1">Label</label>
                                <input
                                  className="w-full h-8 px-2 text-[12.5px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none"
                                  value={tier.label}
                                  onChange={(e) => {
                                    const updated = [...parameterForm.tiers];
                                    updated[idx].label = e.target.value;
                                    setParameterForm(prev => ({ ...prev, tiers: updated }));
                                  }}
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] text-mountain-500 uppercase ml-1">Min</label>
                                <input
                                  type="number"
                                  className="w-full h-8 px-2 text-[12.5px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none"
                                  value={tier.min}
                                  onChange={(e) => {
                                    const updated = [...parameterForm.tiers];
                                    updated[idx].min = parseFloat(e.target.value);
                                    setParameterForm(prev => ({ ...prev, tiers: updated }));
                                  }}
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] text-mountain-500 uppercase ml-1">Max</label>
                                <input
                                  type="number"
                                  className="w-full h-8 px-2 text-[12.5px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none"
                                  value={tier.max}
                                  onChange={(e) => {
                                    const updated = [...parameterForm.tiers];
                                    updated[idx].max = parseFloat(e.target.value);
                                    setParameterForm(prev => ({ ...prev, tiers: updated }));
                                  }}
                                />
                              </div>
                              <div className="col-span-3">
                                <label className="text-[10px] text-mountain-500 uppercase ml-1">Status</label>
                                <select
                                  className="w-full h-8 px-1 text-[12.5px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none"
                                  value={tier.status}
                                  onChange={(e) => {
                                    const updated = [...parameterForm.tiers];
                                    updated[idx].status = e.target.value as any;
                                    setParameterForm(prev => ({ ...prev, tiers: updated }));
                                  }}
                                >
                                  <option value="normal">Normal</option>
                                  <option value="borderline">Borderline</option>
                                  <option value="critical">Critical</option>
                                </select>
                              </div>
                              <div className="col-span-1 pb-1 flex justify-center">
                                <button
                                  className="text-mountain-400 hover:text-red-500 transition-colors"
                                  onClick={() => {
                                    const updated = parameterForm.tiers.filter((_, i) => i !== idx);
                                    setParameterForm(prev => ({ ...prev, tiers: updated }));
                                  }}
                                >
                                  <IoTrashOutline className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 border-2 border-dashed border-mountain-200 rounded text-mountain-400 text-[12px] italic">
                          No automatic flagging tiers defined.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2 shrink-0">
                <Button variant="light" size="sm" onClick={parameterModalState.close}>Cancel</Button>
                {!isEditing && (
                  <Button
                    variant="bordered"
                    size="sm"
                    color="primary"
                    onClick={() => handleSaveParameter(true)}
                    isLoading={loading}
                  >
                    Save & Add Another
                  </Button>
                )}
                <Button color="primary" size="sm" onClick={() => handleSaveParameter(false)} isLoading={loading}>
                  {isEditing ? "Update Configuration" : "Save Parameter"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* Test Type Form Modal */}
      {
        testTypeModalState.isOpen && createPortal(
          (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-mountain-900/70 backdrop-blur-2xl"
              onClick={testTypeModalState.close}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
              {/* Standard Header */}
              <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <h2 className="text-[14px] font-semibold text-mountain-900">
                    {isEditing ? "Edit Test Configuration" : "Master Test Architect"}
                  </h2>
                </div>
                <button onClick={testTypeModalState.close} className="text-mountain-400 hover:text-mountain-700 transition-colors">
                  <IoCloseOutline className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
                {/* Core Test Info */}
                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-mountain-500 ml-1">Official Test Name</label>
                        <input
                          className="w-full h-10 px-3 bg-white border border-mountain-200 rounded-md focus:outline-none focus:border-teal-500 text-[13.5px] font-medium"
                          placeholder="e.g. Lipid Profile"
                          value={testTypeForm.name}
                          onChange={(e) => setTestTypeForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-mountain-500 ml-1">Category</label>
                        <PathologySearchSelect
                          label=""
                          items={categories.map(c => ({ id: c.id, primary: c.name }))}
                          placeholder="Search or add category..."
                          value={testTypeForm.categoryId}
                          onChange={(id, primary) => setTestTypeForm(prev => ({ ...prev, categoryId: id, newCategoryName: id ? "" : primary }))}
                          onAddNew={(q) => setTestTypeForm(prev => ({ ...prev, categoryId: "", newCategoryName: q }))}
                        />
                        {testTypeForm.newCategoryName && (
                          <div className="flex items-center gap-1.5 mt-1 px-2 py-1 bg-teal-50 border border-teal-200 rounded text-[11px] text-teal-700 font-medium">
                            <IoAddOutline className="w-3 h-3 shrink-0" />
                            New category "{testTypeForm.newCategoryName}" will be created on save
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-mountain-500 ml-1">Price (NPR)</label>
                        <input
                          type="number"
                          className="w-full h-10 px-3 bg-white border border-mountain-200 rounded-md focus:outline-none focus:border-teal-500 text-[13.5px] font-bold"
                          placeholder="0.00"
                          value={testTypeForm.price}
                          onChange={(e) => setTestTypeForm(prev => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-mountain-500 ml-1">TAT (Days)</label>
                        <input
                          type="number"
                          className="w-full h-10 px-3 bg-white border border-mountain-200 rounded-md focus:outline-none focus:border-teal-500 text-[13.5px] font-medium"
                          placeholder="1"
                          value={testTypeForm.reportDays}
                          onChange={(e) => setTestTypeForm(prev => ({ ...prev, reportDays: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-mountain-500 ml-1">Strategy</label>
                        <div className="flex bg-mountain-50 border border-mountain-200 rounded-md p-1 h-10">
                          <button
                            className={`flex-1 px-1 rounded text-[10px] font-bold transition-all ${testTypeForm.targetType === 'category' ? 'bg-white shadow-sm border border-mountain-200 text-teal-600' : 'text-mountain-400 hover:text-mountain-600'}`}
                            onClick={() => setTestTypeForm(prev => ({ ...prev, targetType: 'category' }))}
                          >
                            Auto
                          </button>
                          <button
                            className={`flex-1 px-1 rounded text-[10px] font-bold transition-all ${testTypeForm.targetType === 'parameter' ? 'bg-white shadow-sm border border-mountain-200 text-teal-600' : 'text-mountain-400 hover:text-mountain-600'}`}
                            onClick={() => setTestTypeForm(prev => ({ ...prev, targetType: 'parameter' }))}
                          >
                            Custom
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-mountain-500 ml-1">Microbiology</label>
                        <button
                          className={`w-full h-10 px-2 flex items-center justify-center gap-1.5 rounded-md border transition-all ${testTypeForm.isMicrobiology ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-mountain-200 text-mountain-400 hover:border-mountain-300'}`}
                          onClick={() => setTestTypeForm(prev => ({ ...prev, isMicrobiology: !prev.isMicrobiology }))}
                        >
                          <IoShieldCheckmarkOutline className={testTypeForm.isMicrobiology ? "text-indigo-600 w-3.5 h-3.5" : "text-mountain-300 w-3.5 h-3.5"} />
                          <span className="text-[10px] font-bold uppercase tracking-tight">
                            {testTypeForm.isMicrobiology ? "Enabled" : "Disabled"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 bg-mountain-50/50 rounded-md border border-mountain-100 p-4 flex flex-col justify-center text-center">
                    <IoFlaskOutline className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                    <h3 className="text-[12px] font-bold text-mountain-800">Architect Guide</h3>
                    <p className="text-[11px] text-mountain-500 mt-1 leading-relaxed">
                      {testTypeForm.targetType === 'category' 
                        ? "Test will automatically include all parameters within the selected category."
                        : "Test will only include the specific parameters you manually define below."
                      }
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-mountain-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-mountain-700">Parameter Configuration</h3>
                    {testTypeForm.targetType === 'parameter' && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="h-8 font-bold text-[11px]"
                        startContent={<IoAddOutline />}
                        onClick={() => setTestTypeForm(prev => ({
                          ...prev,
                          selectedParameters: [...prev.selectedParameters, { name: "", unit: "", range: "", resultType: "numeric", tiers: [] }]
                        }))}
                      >
                        Add Row
                      </Button>
                    )}
                  </div>

                  {testTypeForm.targetType === 'category' ? (
                    <div className="bg-mountain-50/50 rounded-md border border-mountain-200 overflow-hidden">
                      {parameters.filter(p => p.categoryId === testTypeForm.categoryId).length > 0 ? (
                        <table className="w-full text-left">
                          <thead className="bg-mountain-100/50 text-[11px] font-semibold text-mountain-600">
                            <tr>
                              <th className="px-4 py-2 border-b border-mountain-200">Parameter</th>
                              <th className="px-4 py-2 border-b border-mountain-200 w-24">Unit</th>
                              <th className="px-4 py-2 border-b border-mountain-200 w-32">Range</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-mountain-100">
                            {parameters.filter(p => p.categoryId === testTypeForm.categoryId).map((p, idx) => (
                              <tr key={idx} className="hover:bg-white/50">
                                <td className="px-4 py-2 text-[12.5px] text-mountain-800 font-medium">
                                  {p.indentationLevel ? <span className="ml-4 text-mountain-400">↳ </span> : null}
                                  {p.name}
                                </td>
                                <td className="px-4 py-2 text-[12px] text-mountain-500">{p.unit || "—"}</td>
                                <td className="px-4 py-2 text-[12px] text-mountain-500">{p.allRange?.description || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center space-y-2">
                          <IoOptionsOutline className="w-8 h-8 text-mountain-300" />
                          <p className="text-[13px] text-mountain-500 font-medium italic">
                            {testTypeForm.categoryId ? "No parameters found in this category." : "Select a category to view parameters."}
                          </p>
                        </div>
                      )}
                      <div className="bg-mountain-100/30 px-4 py-2 border-t border-mountain-200 flex items-center justify-between">
                        <div className="text-[11px] text-mountain-500 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          Parameters are securely locked in Auto-Sync mode.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-mountain-200 rounded-md overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-mountain-50/80 text-[11px] font-semibold text-mountain-500">
                          <tr>
                            <th className="px-4 py-2.5 border-b border-mountain-100">Parameter</th>
                            <th className="px-4 py-2.5 border-b border-mountain-100 w-24">Unit</th>
                            <th className="px-4 py-2.5 border-b border-mountain-100 w-32">Range</th>
                            <th className="px-4 py-2.5 border-b border-mountain-100 w-32">Logic</th>
                            <th className="px-4 py-2.5 border-b border-mountain-100 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-mountain-50">
                          {testTypeForm.selectedParameters.map((p, idx) => (
                            <React.Fragment key={idx}>
                              <tr className="hover:bg-mountain-50/30 transition-colors">
                                <td className="px-2 py-2">
                                  <PathologySearchSelect
                                    label=""
                                    items={parameters
                                      .filter(param => !testTypeForm.categoryId || param.categoryId === testTypeForm.categoryId)
                                      .map(param => ({ id: param.id, primary: param.name, secondary: param.unit }))}
                                    placeholder="Select parameter..."
                                    value={p.id || ""}
                                    defaultDisplay={!p.id ? p.name : undefined}
                                    onChange={(id, primary) => {
                                      const updated = [...testTypeForm.selectedParameters];
                                      const existing = parameters.find(param => param.id === id);
                                      updated[idx] = {
                                        id: id,
                                        name: primary || "",
                                        unit: existing?.unit || "",
                                        range: existing?.allRange?.description || "",
                                        resultType: existing?.resultType || "numeric",
                                        tiers: existing?.allRange?.tiers || [],
                                        showTiers: false
                                      };
                                      setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                    }}
                                    onAddNew={(q) => {
                                      const updated = [...testTypeForm.selectedParameters];
                                      updated[idx] = { ...updated[idx], name: q, id: undefined, tiers: [] };
                                      setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                    }}
                                  />
                                  {!p.id && p.name && (
                                    <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-teal-50 border border-teal-200 rounded text-[10px] text-teal-700 font-medium">
                                      <IoAddOutline className="w-2.5 h-2.5 shrink-0" />
                                      New — will be created on save
                                    </div>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    className="w-full h-9 px-2 text-[12.5px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none"
                                    value={p.unit}
                                    onChange={(e) => {
                                      const updated = [...testTypeForm.selectedParameters];
                                      updated[idx].unit = e.target.value;
                                      setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                    }}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    className="w-full h-9 px-2 text-[12.5px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none"
                                    value={p.range}
                                    onChange={(e) => {
                                      const updated = [...testTypeForm.selectedParameters];
                                      updated[idx].range = e.target.value;
                                      setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                    }}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <button
                                    className={`h-9 w-full rounded text-[11px] font-bold border transition-all ${p.tiers?.length ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-mountain-200 text-mountain-500'}`}
                                    onClick={() => {
                                      const updated = [...testTypeForm.selectedParameters];
                                      updated[idx].showTiers = !updated[idx].showTiers;
                                      setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                    }}
                                  >
                                    {p.tiers?.length ? `${p.tiers.length} Tiers` : "Add Logic"}
                                  </button>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <button
                                    className="text-mountain-300 hover:text-red-500 transition-colors"
                                    onClick={() => {
                                      const updated = testTypeForm.selectedParameters.filter((_, i) => i !== idx);
                                      setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                    }}
                                  >
                                    <IoTrashOutline className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                              {p.showTiers && (
                                <tr className="bg-mountain-50/30">
                                  <td colSpan={5} className="px-4 py-3">
                                    <div className="bg-white border border-mountain-200 rounded p-3 space-y-3">
                                      <div className="flex items-center justify-between border-b border-mountain-100 pb-2">
                                        <span className="text-[10px] font-bold text-mountain-400 uppercase tracking-widest">Clinical Flag Logic</span>
                                        <button
                                          className="text-[10px] font-bold text-teal-600 hover:text-teal-700"
                                          onClick={() => {
                                            const updated = [...testTypeForm.selectedParameters];
                                            updated[idx].tiers = [...(updated[idx].tiers || []), { label: "Normal", min: 0, max: 0, status: "normal" }];
                                            setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                          }}
                                        >
                                          + Add Threshold
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {p.tiers?.map((tier, tidx) => (
                                          <div key={tidx} className="flex gap-2 items-end">
                                            <div className="flex-1 space-y-0.5">
                                              <label className="text-[9px] font-bold text-mountain-400 uppercase ml-1">Label</label>
                                              <input
                                                className="w-full h-8 px-2 text-[12px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none"
                                                value={tier.label}
                                                onChange={(e) => {
                                                  const updated = [...testTypeForm.selectedParameters];
                                                  updated[idx].tiers![tidx].label = e.target.value;
                                                  setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                                }}
                                              />
                                            </div>
                                            <div className="w-16 space-y-0.5">
                                              <label className="text-[9px] font-bold text-mountain-400 uppercase ml-1">Min</label>
                                              <input
                                                type="number"
                                                className="w-full h-8 px-2 text-[12px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none"
                                                value={tier.min}
                                                onChange={(e) => {
                                                  const updated = [...testTypeForm.selectedParameters];
                                                  updated[idx].tiers![tidx].min = parseFloat(e.target.value);
                                                  setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                                }}
                                              />
                                            </div>
                                            <div className="w-16 space-y-0.5">
                                              <label className="text-[9px] font-bold text-mountain-400 uppercase ml-1">Max</label>
                                              <input
                                                type="number"
                                                className="w-full h-8 px-2 text-[12px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none"
                                                value={tier.max}
                                                onChange={(e) => {
                                                  const updated = [...testTypeForm.selectedParameters];
                                                  updated[idx].tiers![tidx].max = parseFloat(e.target.value);
                                                  setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                                }}
                                              />
                                            </div>
                                            <div className="w-24 space-y-0.5">
                                              <label className="text-[9px] font-bold text-mountain-400 uppercase ml-1">Status</label>
                                              <select
                                                className="w-full h-8 px-2 text-[12px] border border-mountain-200 rounded focus:border-teal-500 focus:outline-none bg-white"
                                                value={tier.status}
                                                onChange={(e) => {
                                                  const updated = [...testTypeForm.selectedParameters];
                                                  updated[idx].tiers![tidx].status = e.target.value as any;
                                                  setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                                }}
                                              >
                                                <option value="normal">Normal</option>
                                                <option value="borderline">Amber</option>
                                                <option value="critical">Red</option>
                                              </select>
                                            </div>
                                            <button
                                              className="mb-1 p-1.5 text-mountain-300 hover:text-red-500 transition-colors"
                                              onClick={() => {
                                                const updated = [...testTypeForm.selectedParameters];
                                                updated[idx].tiers = updated[idx].tiers!.filter((_, i) => i !== tidx);
                                                setTestTypeForm(prev => ({ ...prev, selectedParameters: updated }));
                                              }}
                                            >
                                              <IoTrashOutline className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                          {testTypeForm.selectedParameters.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-12 text-center space-y-2">
                                <IoOptionsOutline className="w-10 h-10 text-mountain-200 mx-auto" />
                                <p className="text-mountain-400 text-[13px] font-medium italic">Empty configuration matrix. Add your first parameter to begin.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Standard Footer */}
              <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2 shrink-0">
                <Button variant="light" size="sm" onClick={testTypeModalState.close}>
                  Discard
                </Button>
                <Button color="primary" size="sm" onClick={handleSaveTestType} isLoading={loading}>
                  {isEditing ? "Update Configuration" : "Finalize Architect"}
                </Button>
              </div>
            </div>
          </div>
        ),
        document.body
      )
    }

      {/* Delete Confirmation Modal */}
      {
        deleteConfirmModalState.isOpen && createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-mountain-900/70 backdrop-blur-2xl"
              onClick={deleteConfirmModalState.close}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-md shadow-2xl">
              <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-mountain-900">
                  Confirm Delete
                </h2>
                <button onClick={deleteConfirmModalState.close} className="text-mountain-400 hover:text-mountain-700">
                  <IoCloseOutline className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-[13.5px] text-mountain-800 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-red-600">{itemToDelete?.name}</span>? This action cannot be undone and may affect clinical reporting history.
                </p>
              </div>
              <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2">
                <Button variant="light" size="sm" onClick={deleteConfirmModalState.close}>
                  Cancel
                </Button>
                <Button color="danger" size="sm" onClick={handleDelete}>
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
      {/* Quick Patient Creation Modal */}
      {
        quickPatientModalState.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-mountain-900/70 backdrop-blur-2xl"
              onClick={quickPatientModalState.close}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-mountain-900 leading-none">
                    Quick Create Patient
                  </h2>
                  <p className="text-[11px] text-mountain-500 mt-1">
                    Register a new patient to continue with the test
                  </p>
                </div>
                <button
                  className="p-1 rounded-full hover:bg-mountain-100 text-mountain-400 hover:text-mountain-700 transition-colors"
                  type="button"
                  onClick={quickPatientModalState.close}
                >
                  <IoCloseOutline className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <Input
                  className="text-[14px]"
                  label="Full Name *"
                  placeholder="e.g. John Doe"
                  value={quickPatientForm.name}
                  onValueChange={(v) =>
                    setQuickPatientForm((prev) => ({ ...prev, name: v }))
                  }
                />
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="Age"
                    placeholder="e.g. 25"
                    type="number"
                    value={quickPatientForm.age}
                    onValueChange={(v) =>
                      setQuickPatientForm((prev) => ({ ...prev, age: v }))
                    }
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-mountain-700">
                      Gender
                    </label>
                    <select
                      className="h-9 border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100 transition-all shadow-sm"
                      value={quickPatientForm.gender}
                      onChange={(e) =>
                        setQuickPatientForm((prev) => ({
                          ...prev,
                          gender: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <Input
                  label="Mobile Number"
                  placeholder="e.g. +977 98XXXXXXXX"
                  value={quickPatientForm.mobile}
                  onValueChange={(v) =>
                    setQuickPatientForm((prev) => ({ ...prev, mobile: v }))
                  }
                />
              </div>
              <div className="px-6 py-4 border-t border-mountain-100 bg-mountain-50/50 flex justify-end gap-3">
                <Button variant="flat" onClick={quickPatientModalState.close}>
                  Cancel
                </Button>
                <Button
                  className="px-8 font-medium"
                  color="primary"
                  onClick={handleSaveQuickPatient}
                >
                  Create Patient
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      }
      {/* Result Entry Modal */}
      {resultEntryModalState.isOpen && selectedOrder && (
        <PathologyResultEntryModal
          order={selectedOrder}
          parameters={parameters}
          templates={templates}
          categories={categories}
          onClose={resultEntryModalState.close}
          onSave={handleSaveResults}
        />
      )}

      {/* Seeder Architect Modal */}
      {seederModalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-mountain-900/70 backdrop-blur-2xl" onClick={seederModalState.close} />
          <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-teal-100 flex items-center justify-center border border-teal-200">
                  <IoMedkitOutline className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-mountain-900">Master Diagnostic Seeder</h2>
                  <p className="text-[12px] text-mountain-500">Deploy hospital-grade pathology templates instantly.</p>
                </div>
              </div>
              <button onClick={seederModalState.close} className="text-mountain-400 hover:text-mountain-700 transition-colors">
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-mountain-50/50 p-6">
              <div className="grid grid-cols-2 gap-6">
                {Array.from(new Set(pathologySeederData.map(t => t.categoryName))).map(categoryName => (
                  <div key={categoryName} className="bg-white rounded border border-mountain-200 p-4 shadow-sm">
                    <h3 className="text-[13px] font-bold text-mountain-800 uppercase tracking-tight mb-3 border-b border-mountain-100 pb-2">{categoryName}</h3>
                    <div className="space-y-2">
                      {pathologySeederData.filter(t => t.categoryName === categoryName).map(test => (
                        <label key={test.id} className="flex items-start gap-3 cursor-pointer group hover:bg-mountain-50 p-2 rounded transition-colors">
                          <input 
                            type="checkbox" 
                            className="mt-0.5 rounded border-mountain-300 text-teal-600 focus:ring-teal-500"
                            checked={seederSelectedIds.includes(test.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSeederSelectedIds(prev => [...prev, test.id]);
                              else setSeederSelectedIds(prev => prev.filter(id => id !== test.id));
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-[13.5px] font-semibold text-mountain-900 group-hover:text-teal-700">{test.name}</span>
                            <span className="text-[11.5px] text-mountain-500">{test.parameters.length} Clinical Parameters</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-mountain-100 bg-white flex justify-between items-center shrink-0">
              <div className="flex gap-2">
                <Button variant="flat" size="sm" onClick={() => setSeederSelectedIds(pathologySeederData.map(t => t.id))}>Select All</Button>
                <Button variant="flat" size="sm" color="danger" onClick={() => setSeederSelectedIds([])}>Clear</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="flat" color="secondary" onClick={seederModalState.close}>Cancel</Button>
                <Button 
                  color="primary" 
                  onClick={handleBulkSeed} 
                  isDisabled={seederSelectedIds.length === 0 || loading}
                >
                  {loading ? "Deploying..." : `Deploy ${seederSelectedIds.length} Tests`}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div >

  );
}

