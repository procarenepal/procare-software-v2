import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import {
  IoAddOutline,
  IoSearchOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoArrowBackOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoPrintOutline,
  IoCloseOutline,
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
import { pathologyBillingService } from "@/services/pathologyBillingService";
import { clinicService } from "@/services/clinicService";
import LabTechnicianManagement from "@/components/pathology/LabTechnicianManagement";
import PathologyBillingTab from "@/components/pathology/PathologyBillingTab";
import PathologyTestsTab from "@/components/pathology/PathologyTestsTab";
import PathologyCategoriesTab from "@/components/pathology/PathologyCategoriesTab";
import PathologyUnitsTab from "@/components/pathology/PathologyUnitsTab";
import PathologyParametersTab from "@/components/pathology/PathologyParametersTab";
import PathologyTestTypesTab from "@/components/pathology/PathologyTestTypesTab";
import PathologyDailyReportTab from "@/components/pathology/PathologyDailyReportTab";
import {
  PathologyTest,
  PathologyCategory,
  PathologyUnit,
  PathologyParameter,
  PathologyTestParameter,
  PathologyTestType,
  LabTechnician,
  PathologyBilling,
  Patient,
} from "@/types/models";
import { PrintLayoutConfig } from "@/types/printLayout";

const TAB_KEYS = [
  "tests",
  "category",
  "units",
  "parameters",
  "testPrices",
  "technicians",
  "billing",
  "dailyReport",
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
}: {
  label: string;
  items: { id: string; primary: string; secondary?: string }[];
  value: string;
  onChange: (id: string, primary: string) => void;
  onInputChange?: (value: string) => void;
  onAddNew?: (q: string) => void;
  required?: boolean;
  placeholder?: string;
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
          placeholder={selected && !open ? selected.primary : placeholder || "Search…"}
          value={open ? q : selected ? selected.primary : ""}
          onChange={(e) => {
            const val = e.target.value;
            setQ(val);
            setOpen(true);
            if (onInputChange) onInputChange(val);
          }}
          onFocus={() => setOpen(true)}
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
                  onClick={(e) => {
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
  const [activeTab, setActiveTab] = useState("tests");

  // Loading state
  const [loading, setLoading] = useState(true);

  // Data states
  const [tests, setTests] = useState<PathologyTest[]>([]);
  const [categories, setCategories] = useState<PathologyCategory[]>([]);
  const [units, setUnits] = useState<PathologyUnit[]>([]);
  const [parameters, setParameters] = useState<PathologyParameter[]>([]);
  const [testTypes, setTestTypes] = useState<PathologyTestType[]>([]);
  const [labTechnicians, setLabTechnicians] = useState<LabTechnician[]>([]);
  const [billings, setBillings] = useState<PathologyBilling[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinic, setClinic] = useState<any>(null);
  const [layoutConfig, setLayoutConfig] = useState<PrintLayoutConfig | null>(
    null,
  );

  // Daily Report state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Search states
  const [testsSearchQuery, setTestsSearchQuery] = useState("");
  const [categoriesSearchQuery, setCategoriesSearchQuery] = useState("");
  const [unitsSearchQuery, setUnitsSearchQuery] = useState("");
  const [parametersSearchQuery, setParametersSearchQuery] = useState("");
  const [testTypesSearchQuery, setTestTypesSearchQuery] = useState("");

  // Modal states
  const testModalState = useModalState(false);
  const categoryModalState = useModalState(false);
  const unitModalState = useModalState(false);
  const parameterModalState = useModalState(false);
  const testTypeModalState = useModalState(false);
  const quickPatientModalState = useModalState(false);
  const deleteConfirmModalState = useModalState(false);

  // Form states
  const [testForm, setTestForm] = useState({
    id: "",
    isWalkIn: false,
    walkInPhone: "",
    patientId: "",
    patientName: "",
    patientAge: "",
    patientGender: "",
    shortName: "",
    testType: "",
    categoryId: "",
    unit: "",
    subCategory: "",
    method: "",
    reportDays: "",
    chargeCategory: "",
    standardCharge: "",
    labTechnicianId: "",
    parameters: [
      {
        categoryId: "",
        parameterId: "",
        parameterName: "",
        patientResult: "",
        referenceRange: "",
        unit: "",
      },
    ],
  });
  const [quickPatientForm, setQuickPatientForm] = useState({
    name: "",
    age: "",
    gender: "",
    mobile: "",
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
  });

  const [testTypeForm, setTestTypeForm] = useState({
    id: "",
    targetType: "category" as "category" | "parameter",
    categoryId: "",
    parameterId: "",
    price: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!clinicId || !branchId) return;

      try {
        setLoading(true);
        const [
          testsData,
          categoriesData,
          unitsData,
          parametersData,
          testTypesData,
          techniciansData,
          billingsData,
          clinicData,
          layoutConfigData,
          patientsData,
        ] = await Promise.all([
          pathologyService.getTestsByClinic(clinicId, branchId),
          pathologyService.getCategoriesByClinic(clinicId, branchId),
          pathologyService.getUnitsByClinic(clinicId, branchId),
          pathologyService.getParametersByClinic(clinicId, branchId),
          pathologyService.getTestTypesByClinic(clinicId, branchId),
          labTechnicianService.getTechniciansByClinic(clinicId, branchId),
          pathologyBillingService.getBillingByClinic(clinicId, branchId),
          clinicService.getClinicById(clinicId),
          clinicService.getPrintLayoutConfig(clinicId),
          patientService.getPatientsByClinic(clinicId, branchId),
        ]);

        setTests(testsData);
        setCategories(categoriesData);
        setUnits(unitsData);
        setParameters(parametersData);
        setTestTypes(testTypesData);
        setLabTechnicians(techniciansData);
        setBillings(billingsData);
        setClinic(clinicData);
        setLayoutConfig(layoutConfigData);
        setPatients(patientsData);
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

  // Filtered data
  const filteredTests = useMemo(() => {
    if (!testsSearchQuery.trim()) return tests;
    const query = testsSearchQuery.toLowerCase();

    return tests.filter(
      (test) =>
        test.testName.toLowerCase().includes(query) ||
        (test.shortName && test.shortName.toLowerCase().includes(query)) ||
        test.patientName.toLowerCase().includes(query) ||
        test.categoryName.toLowerCase().includes(query) ||
        (test.labTechnicianName &&
          test.labTechnicianName.toLowerCase().includes(query)),
    );
  }, [tests, testsSearchQuery]);

  const filteredCategories = useMemo(() => {
    if (!categoriesSearchQuery.trim()) return categories;
    const query = categoriesSearchQuery.toLowerCase();

    return categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categories, categoriesSearchQuery]);

  const filteredUnits = useMemo(() => {
    if (!unitsSearchQuery.trim()) return units;
    const query = unitsSearchQuery.toLowerCase();

    return units.filter((unit) => unit.name.toLowerCase().includes(query));
  }, [units, unitsSearchQuery]);

  const filteredParameters = useMemo(() => {
    if (!parametersSearchQuery.trim()) return parameters;
    const query = parametersSearchQuery.toLowerCase();

    return parameters.filter(
      (param) =>
        param.name.toLowerCase().includes(query) ||
        param.referenceRange.toLowerCase().includes(query),
    );
  }, [parameters, parametersSearchQuery]);

  const filteredTestTypes = useMemo(() => {
    if (!testTypesSearchQuery.trim()) return testTypes;
    const query = testTypesSearchQuery.toLowerCase();

    return testTypes.filter(
      (testType) =>
        testType.name && testType.name.toLowerCase().includes(query),
    );
  }, [testTypes, testTypesSearchQuery]);

  // Daily Report filtered data
  const dailyReportData = useMemo(() => {
    const selectedDateObj = new Date(selectedDate);
    const startOfDay = new Date(selectedDateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDateObj.setHours(23, 59, 59, 999));

    // Filter tests by date
    const dailyTests = tests.filter((test) => {
      const testDate = new Date(test.createdAt);

      return testDate >= startOfDay && testDate <= endOfDay;
    });

    // Filter billings by invoice date
    const dailyBillings = billings.filter((billing) => {
      const invoiceDate = new Date(billing.invoiceDate);

      return invoiceDate >= startOfDay && invoiceDate <= endOfDay;
    });

    // Calculate statistics
    const totalTests = dailyTests.length;
    const totalBillings = dailyBillings.length;
    const totalRevenue = dailyBillings.reduce(
      (sum, billing) => sum + (billing.totalAmount || 0),
      0,
    );
    const totalPaid = dailyBillings
      .filter((b) => b.status === "paid")
      .reduce((sum, billing) => sum + (billing.totalAmount || 0), 0);
    const totalPending = dailyBillings
      .filter((b) => b.status === "draft" || b.status === "finalized")
      .reduce((sum, billing) => sum + (billing.totalAmount || 0), 0);

    // Test types breakdown
    const testTypeBreakdown: Record<string, number> = {};

    dailyTests.forEach((test) => {
      const type = test.testType || "Unknown";

      testTypeBreakdown[type] = (testTypeBreakdown[type] || 0) + 1;
    });

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};

    dailyTests.forEach((test) => {
      const category = test.categoryName || "Unknown";

      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    // Lab technician breakdown
    const technicianBreakdown: Record<string, number> = {};

    dailyTests.forEach((test) => {
      const technician = test.labTechnicianName || "Unassigned";

      technicianBreakdown[technician] =
        (technicianBreakdown[technician] || 0) + 1;
    });

    // Patient statistics
    const uniquePatients = new Set(dailyTests.map((test) => test.patientName));
    const totalPatients = uniquePatients.size;

    return {
      dailyTests,
      dailyBillings,
      totalTests,
      totalBillings,
      totalRevenue,
      totalPaid,
      totalPending,
      testTypeBreakdown,
      categoryBreakdown,
      technicianBreakdown,
      totalPatients,
    };
  }, [tests, billings, selectedDate]);

  // Test form handlers
  const resetTestForm = () => {
    setTestForm({
      id: "",
      isWalkIn: false,
      walkInPhone: "",
      patientId: "",
      patientName: "",
      patientAge: "",
      patientGender: "",
      shortName: "",
      testType: "",
      categoryId: "",
      unit: "",
      subCategory: "",
      method: "",
      reportDays: "",
      chargeCategory: "",
      standardCharge: "",
      labTechnicianId: "",
      parameters: [
        {
          categoryId: "",
          parameterId: "",
          parameterName: "",
          patientResult: "",
          referenceRange: "",
          unit: "",
        },
      ],
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

  const updateTestParameter = (
    index: number,
    field: keyof PathologyTestParameter,
    value: string,
  ) => {
    setTestForm((prev) => {
      const updated = [...prev.parameters];

      updated[index] = { ...updated[index], [field]: value };

      // If parameter is selected, populate name and reference range
      if (field === "parameterId") {
        const selectedParam = parameters.find((p) => p.id === value);

        if (selectedParam) {
          updated[index].parameterName = selectedParam.name;
          updated[index].referenceRange = selectedParam.referenceRange;
          // Find unit name
          const unitObj = units.find((u) => u.id === selectedParam.unit);

          updated[index].unit = unitObj?.name || "";
        }
      }

      return { ...prev, parameters: updated };
    });
  };

  const moveTestParameter = (index: number, direction: "up" | "down") => {
    setTestForm((prev) => {
      const updated = [...prev.parameters];

      if (direction === "up" && index > 0) {
        [updated[index - 1], updated[index]] = [
          updated[index],
          updated[index - 1],
        ];
      } else if (direction === "down" && index < updated.length - 1) {
        [updated[index], updated[index + 1]] = [
          updated[index + 1],
          updated[index],
        ];
      }

      return { ...prev, parameters: updated };
    });
  };

  const handleSaveQuickPatient = async () => {
    if (!quickPatientForm.name.trim()) {
      addToast({
        title: "Error",
        description: "Please enter patient name",
        color: "danger",
      });

      return;
    }
    setLoading(true);
    try {
      const regNumber = await patientService.getNextRegistrationNumber(
        clinicId!,
      );
      const patientData: any = {
        regNumber,
        name: quickPatientForm.name.trim(),
        mobile: quickPatientForm.mobile.trim() || "N/A",
        gender: quickPatientForm.gender || "other",
        clinicId: clinicId!,
        branchId: branchId || clinicId!,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || "",
      };

      if (quickPatientForm.age)
        patientData.age = parseInt(quickPatientForm.age);

      const patientId = await patientService.createPatient(patientData);

      // Update local patients list
      const updatedPatients = await patientService.getPatientsByClinic(
        clinicId!,
        branchId!,
      );

      setPatients(updatedPatients);

      // Select the new patient
      setTestForm((prev) => ({
        ...prev,
        patientId: patientId,
        patientName: quickPatientForm.name,
        patientAge: quickPatientForm.age || prev.patientAge,
        patientGender: quickPatientForm.gender || prev.patientGender,
      }));

      addToast({
        title: "Success",
        description: "Patient created successfully",
        color: "success",
      });
      quickPatientModalState.close();
      setQuickPatientForm({ name: "", age: "", gender: "", mobile: "" });
    } catch (error) {
      console.error("Error creating quick patient:", error);
      addToast({
        title: "Error",
        description: "Failed to create patient",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTest = async () => {
    // Create walk-in patient if needed
    let finalPatientId = testForm.patientId;
    let finalPatientName = testForm.patientName;

    if (testForm.isWalkIn) {
      if (!testForm.patientName) {
        addToast({
          title: "Error",
          description: "Walk-in patient name is required",
          color: "danger",
        });

        return;
      }
      try {
        const patientData = {
          name: testForm.patientName,
          mobile: testForm.walkInPhone || "N/A",
          age: parseInt(testForm.patientAge) || undefined,
          gender: (testForm.patientGender as "male" | "female" | "other") || "other",
          clinicId: clinicId!,
          branchId: branchId!,
        };
        const newPatientId = await patientService.createPatient(patientData);

        finalPatientId = newPatientId;
        finalPatientName = testForm.patientName;
        // Optionally update local patients list
        const updatedPatients = await patientService.getPatientsByClinic(
          clinicId!,
          branchId!,
        );
        setPatients(updatedPatients);
      } catch (err) {
        console.error("Failed to create walk-in patient", err);
        addToast({
          title: "Error",
          description: "Could not create walk-in patient",
          color: "danger",
        });

        return;
      }
    } else if (!finalPatientId) {
      addToast({
        title: "Error",
        description: "Please select an existing patient",
        color: "danger",
      });

      return;
    }

    try {
      const testData: Omit<PathologyTest, "id" | "createdAt" | "updatedAt"> = {
        patientId: finalPatientId,
        patientName: finalPatientName,
        patientAge: testForm.patientAge ? parseInt(testForm.patientAge) : undefined,
        patientGender: (testForm.patientGender as "male" | "female" | "other") || "other",
        testName: testForm.testType || testForm.shortName || "Unknown Test",
        categoryName: categories.find((c) => c.id === testForm.categoryId)?.name || "Unknown Category",
        shortName: testForm.shortName,
        testType: testForm.testType,
        categoryId: testForm.categoryId,
        unit: testForm.unit,
        subCategory: testForm.subCategory,
        method: testForm.method,
        reportDays: testForm.reportDays
          ? parseInt(testForm.reportDays)
          : undefined,
        chargeCategory: testForm.chargeCategory,
        standardCharge: testForm.standardCharge
          ? parseFloat(testForm.standardCharge)
          : 0,
        labTechnicianId: testForm.labTechnicianId,
        parameters: testForm.parameters
          .filter((p) => p.parameterId)
          .map((p) => ({
            parameterId: p.parameterId,
            parameterName:
              parameters.find((param) => param.id === p.parameterId)?.name ||
              "",
            categoryId: p.categoryId,
            patientResult: p.patientResult,
            referenceRange: p.referenceRange,
            unit: p.unit,
          })),
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdBy: currentUser?.uid || "",
      };

      if (isEditing) {
        await pathologyService.updateTest(testForm.id, testData);
        addToast({
          title: "Success",
          description: "Pathology test updated successfully",
          color: "success",
        });
      } else {
        await pathologyService.createTest(testData);
        addToast({
          title: "Success",
          description: "Pathology test created successfully",
          color: "success",
        });
      }

      // Reload data
      const [testsData, techniciansData] = await Promise.all([
        pathologyService.getTestsByClinic(clinicId!, branchId!),
        labTechnicianService.getTechniciansByClinic(clinicId!, branchId!),
      ]);

      setTests(testsData);
      setLabTechnicians(techniciansData);

      testModalState.forceClose();
      resetTestForm();
    } catch (error) {
      console.error("Error saving test:", error);
      addToast({
        title: "Error",
        description: "Failed to save pathology test",
        color: "danger",
      });
    }
  };

  const editTest = (test: PathologyTest) => {
    setTestForm({
      id: test.id,
      isWalkIn: false,
      walkInPhone: "",
      patientId: test.patientId || "",
      patientName: test.patientName || "",
      patientAge: test.patientAge?.toString() || "",
      patientGender: test.patientGender || "",
      shortName: test.shortName || "",
      testType: test.testType || "",
      categoryId: test.categoryId,
      unit: test.unit || "",
      subCategory: test.subCategory || "",
      method: test.method || "",
      reportDays: test.reportDays?.toString() || "",
      chargeCategory: test.chargeCategory || "",
      standardCharge: test.standardCharge?.toString() || "",
      labTechnicianId: test.labTechnicianId || "",
      parameters: test.parameters ? test.parameters.map(p => {
        // If unit is an ID, try to resolve it to a name
        let displayUnit = p.unit;
        if (p.unit && units.find(u => u.id === p.unit)) {
          displayUnit = units.find(u => u.id === p.unit)?.name || p.unit;
        }

        return { ...p, unit: displayUnit, categoryId: p.categoryId || "" };
      }) : [],
    });
    setIsEditing(true);
    testModalState.open();
  };

  // Category handlers
  const resetCategoryForm = () => {
    setCategoryForm({ id: "", name: "" });
    setIsEditing(false);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      addToast({
        title: "Error",
        description: "Please enter category name",
        color: "danger",
      });

      return;
    }

    try {
      const categoryData: Omit<
        PathologyCategory,
        "id" | "createdAt" | "updatedAt"
      > = {
        name: categoryForm.name.trim(),
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdBy: currentUser?.uid || "",
      };

      if (isEditing) {
        await pathologyService.updateCategory(categoryForm.id, categoryData);
        addToast({
          title: "Success",
          description: "Category updated successfully",
          color: "success",
        });
      } else {
        await pathologyService.createCategory(categoryData);
        addToast({
          title: "Success",
          description: "Category created successfully",
          color: "success",
        });
      }

      const categoriesData = await pathologyService.getCategoriesByClinic(
        clinicId!,
        branchId!,
      );

      setCategories(categoriesData);

      categoryModalState.forceClose();
      resetCategoryForm();
    } catch (error) {
      console.error("Error saving category:", error);
      addToast({
        title: "Error",
        description: "Failed to save category",
        color: "danger",
      });
    }
  };

  const editCategory = (category: PathologyCategory) => {
    setCategoryForm({ id: category.id, name: category.name });
    setIsEditing(true);
    categoryModalState.open();
  };

  // Unit handlers
  const resetUnitForm = () => {
    setUnitForm({ id: "", name: "" });
    setIsEditing(false);
  };

  const handleSaveUnit = async () => {
    if (!unitForm.name.trim()) {
      addToast({
        title: "Error",
        description: "Please enter unit name",
        color: "danger",
      });

      return;
    }

    try {
      const unitData: Omit<PathologyUnit, "id" | "createdAt" | "updatedAt"> = {
        name: unitForm.name.trim(),
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdBy: currentUser?.uid || "",
      };

      if (isEditing) {
        await pathologyService.updateUnit(unitForm.id, unitData);
        addToast({
          title: "Success",
          description: "Unit updated successfully",
          color: "success",
        });
      } else {
        await pathologyService.createUnit(unitData);
        addToast({
          title: "Success",
          description: "Unit created successfully",
          color: "success",
        });
      }

      const unitsData = await pathologyService.getUnitsByClinic(
        clinicId!,
        branchId!,
      );

      setUnits(unitsData);

      unitModalState.forceClose();
      resetUnitForm();
    } catch (error) {
      console.error("Error saving unit:", error);
      addToast({
        title: "Error",
        description: "Failed to save unit",
        color: "danger",
      });
    }
  };

  const editUnit = (unit: PathologyUnit) => {
    setUnitForm({ id: unit.id, name: unit.name });
    setIsEditing(true);
    unitModalState.open();
  };

  // Parameter handlers
  const resetParameterForm = () => {
    setParameterForm({
      id: "",
      categoryId: "",
      name: "",
      referenceRange: "",
      unit: "",
    });
    setIsEditing(false);
  };

  const handleSaveParameter = async () => {
    if (
      !parameterForm.name.trim() ||
      !parameterForm.referenceRange.trim()
    ) {
      addToast({
        title: "Error",
        description: "Please fill in all required fields",
        color: "danger",
      });

      return;
    }

    try {
      const parameterData: Omit<
        PathologyParameter,
        "id" | "createdAt" | "updatedAt"
      > = {
        name: parameterForm.name.trim(),
        categoryId: parameterForm.categoryId || undefined,
        referenceRange: parameterForm.referenceRange.trim(),
        unit: parameterForm.unit,
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdBy: currentUser?.uid || "",
      };

      if (isEditing) {
        await pathologyService.updateParameter(parameterForm.id, parameterData);
        addToast({
          title: "Success",
          description: "Parameter updated successfully",
          color: "success",
        });
      } else {
        await pathologyService.createParameter(parameterData);
        addToast({
          title: "Success",
          description: "Parameter created successfully",
          color: "success",
        });
      }

      const parametersData = await pathologyService.getParametersByClinic(
        clinicId!,
        branchId!,
      );

      setParameters(parametersData);

      parameterModalState.forceClose();
      resetParameterForm();
    } catch (error) {
      console.error("Error saving parameter:", error);
      addToast({
        title: "Error",
        description: "Failed to save parameter",
        color: "danger",
      });
    }
  };

  const editParameter = (parameter: PathologyParameter) => {
    setParameterForm({
      id: parameter.id,
      categoryId: parameter.categoryId || "",
      name: parameter.name,
      referenceRange: parameter.referenceRange,
      unit: parameter.unit,
    });
    setIsEditing(true);
    parameterModalState.open();
  };

  // Test Type handlers
  const resetTestTypeForm = () => {
    setTestTypeForm({
      id: "",
      targetType: "category",
      categoryId: "",
      parameterId: "",
      price: "",
    });
    setIsEditing(false);
  };

  const handleSaveTestType = async () => {
    if (!testTypeForm.price.trim()) {
      addToast({
        title: "Error",
        description: "Please enter a price",
        color: "danger",
      });

      return;
    }

    if (testTypeForm.targetType === "category" && !testTypeForm.categoryId) {
      addToast({
        title: "Error",
        description: "Please select a category",
        color: "danger",
      });

      return;
    }

    if (testTypeForm.targetType === "parameter" && !testTypeForm.parameterId) {
      addToast({
        title: "Error",
        description: "Please select a parameter",
        color: "danger",
      });

      return;
    }

    const priceValue = parseFloat(testTypeForm.price);

    if (isNaN(priceValue) || priceValue < 0) {
      addToast({
        title: "Error",
        description: "Please enter a valid price",
        color: "danger",
      });

      return;
    }

    let targetName = "Unknown";
    let targetId = "";

    if (testTypeForm.targetType === "category") {
      targetName =
        categories.find((c) => c.id === testTypeForm.categoryId)?.name ||
        "Unknown";
      targetId = testTypeForm.categoryId;
    } else {
      targetName =
        parameters.find((p) => p.id === testTypeForm.parameterId)?.name ||
        "Unknown";
      targetId = testTypeForm.parameterId;
    }

    try {
      const testTypeData: Omit<
        PathologyTestType,
        "id" | "createdAt" | "updatedAt"
      > = {
        name: targetName,
        targetId: targetId,
        targetType: testTypeForm.targetType,
        price: priceValue,
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdBy: currentUser?.uid || "",
      };

      if (isEditing) {
        await pathologyService.updateTestType(testTypeForm.id, testTypeData);
        addToast({
          title: "Success",
          description: "Test type updated successfully",
          color: "success",
        });
      } else {
        await pathologyService.createTestType(testTypeData);
        addToast({
          title: "Success",
          description: "Test type created successfully",
          color: "success",
        });
      }

      const testTypesData = await pathologyService.getTestTypesByClinic(
        clinicId!,
        branchId!,
      );

      setTestTypes(testTypesData);

      testTypeModalState.forceClose();
      resetTestTypeForm();
    } catch (error) {
      console.error("Error saving test type:", error);
      addToast({
        title: "Error",
        description: "Failed to save test type",
        color: "danger",
      });
    }
  };

  const editTestType = (testType: PathologyTestType) => {
    const isCategory = testType.targetType === "category";

    setTestTypeForm({
      id: testType.id,
      targetType:
        (testType.targetType as "category" | "parameter") || "category",
      categoryId: isCategory ? testType.targetId || "" : "",
      parameterId: !isCategory ? testType.targetId || "" : "",
      price: testType.price.toString(),
    });
    setIsEditing(true);
    testTypeModalState.open();
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      switch (itemToDelete.type) {
        case "test":
          await pathologyService.deleteTest(itemToDelete.id);
          const testsData = await pathologyService.getTestsByClinic(
            clinicId!,
            branchId!,
          );

          setTests(testsData);
          break;
        case "category":
          await pathologyService.deleteCategory(itemToDelete.id);
          const categoriesData = await pathologyService.getCategoriesByClinic(
            clinicId!,
            branchId!,
          );

          setCategories(categoriesData);
          break;
        case "unit":
          await pathologyService.deleteUnit(itemToDelete.id);
          const unitsData = await pathologyService.getUnitsByClinic(
            clinicId!,
            branchId!,
          );

          setUnits(unitsData);
          break;
        case "parameter":
          await pathologyService.deleteParameter(itemToDelete.id);
          const parametersData = await pathologyService.getParametersByClinic(
            clinicId!,
            branchId!,
          );

          setParameters(parametersData);
          break;
        case "testType":
          await pathologyService.deleteTestType(itemToDelete.id);
          const testTypesData = await pathologyService.getTestTypesByClinic(
            clinicId!,
            branchId!,
          );

          setTestTypes(testTypesData);
          break;
      }

      addToast({
        title: "Success",
        description: "Item deleted successfully",
        color: "success",
      });

      deleteConfirmModalState.forceClose();
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      addToast({
        title: "Error",
        description: "Failed to delete item",
        color: "danger",
      });
    }
  };

  const openDeleteModal = (type: string, id: string, name: string) => {
    setItemToDelete({ type, id, name });
    deleteConfirmModalState.open();
  };

  const buildPathologyReportHtml = (
    test: PathologyTest,
    clinic?: any,
    layoutConfig?: PrintLayoutConfig | null,
    options?: { hideLetterhead?: boolean },
  ) => {
    const hideLetterhead = options?.hideLetterhead ?? false;

    const configuredTopMargin =
      layoutConfig?.contentTopMarginWithoutLetterheadMm;
    const topMarginMm = hideLetterhead
      ? typeof configuredTopMargin === "number" &&
        !Number.isNaN(configuredTopMargin)
        ? configuredTopMargin
        : 20
      : 10;

    const parametersRows =
      test.parameters && test.parameters.length > 0
        ? test.parameters
          .map(
            (param) => `
            <tr>
              <td>${param.parameterName}</td>
              <td>${param.patientResult}</td>
              <td>${param.referenceRange}</td>
              <td>${param.unit}</td>
            </tr>
          `,
          )
          .join("")
        : `
        <tr>
          <td colspan="4" style="text-align:center; padding:12px;">
            No parameter data provided.
          </td>
        </tr>
      `;

    const headerHtml = hideLetterhead
      ? ""
      : `
        <div class="header">
          <div class="header-content">
            <div class="header-left">
              ${layoutConfig?.logoUrl
        ? `
                <img src="${layoutConfig.logoUrl}" alt="Logo" class="logo" />
              `
        : ""
      }
              <div class="clinic-info">
                <h1 class="clinic-name">${clinic?.name || layoutConfig?.clinicName || "Clinic Name"}</h1>
                ${layoutConfig?.tagline
        ? `
                  <p class="tagline">${layoutConfig.tagline}</p>
                `
        : ""
      }
                <div class="clinic-details">
                  <p>${layoutConfig?.address || clinic?.address || ""}</p>
                  <p>${layoutConfig?.city || clinic?.city || ""}${layoutConfig?.state ? `, ${layoutConfig.state}` : ""} ${layoutConfig?.zipCode || ""}</p>
                  ${layoutConfig?.website ? `<p>Website: ${layoutConfig.website}</p>` : ""}
                </div>
              </div>
            </div>
            <div class="header-right">
              <p><strong>Phone:</strong> ${layoutConfig?.phone || clinic?.phone || ""}</p>
              <p><strong>Email:</strong> ${layoutConfig?.email || clinic?.email || ""}</p>
            </div>
          </div>
        </div>
  `;

    const footerHtml = hideLetterhead
      ? ""
      : `
        <div class="footer">
          <p>Thank you for choosing us</p>
        </div>
  `;

    return `<!DOCTYPE html>
  <html>
    <head>
      <title>Pathology Report - ${test.patientName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
          color: #333;
        }
        .print-container {
          max-width: 100%;
          margin: 0;
          background: white;
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: ${topMarginMm}mm 10mm 10mm 10mm;
          box-sizing: border-box;
        }
        .header {
          border-bottom: 2px solid #333;
          padding-bottom: ${layoutConfig?.headerHeight === "compact"
        ? "10px"
        : layoutConfig?.headerHeight === "expanded"
          ? "20px"
          : "15px"
      };
          margin-bottom: ${layoutConfig?.headerHeight === "compact"
        ? "10px"
        : layoutConfig?.headerHeight === "expanded"
          ? "20px"
          : "15px"
      };
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
          ${layoutConfig?.logoPosition === "center"
        ? "justify-content: center; text-align: center;"
        : layoutConfig?.logoPosition === "right"
          ? "justify-content: flex-end; text-align: right;"
          : "justify-content: flex-start; text-align: left;"
      }
        }
        .header-right {
          text-align: right;
          font-size: ${layoutConfig?.fontSize === "small"
        ? "11px"
        : layoutConfig?.fontSize === "large"
          ? "14px"
          : "12px"
      };
          color: #333;
          line-height: 1.4;
        }
        .logo {
          ${layoutConfig?.logoSize === "small"
        ? "height: 40px;"
        : layoutConfig?.logoSize === "large"
          ? "height: 80px;"
          : "height: 60px;"
      }
          width: auto;
          object-fit: contain;
        }
        .clinic-info {
          ${layoutConfig?.logoPosition === "center" ? "text-align: center;" : ""}
        }
        .clinic-name {
          font-weight: bold;
          color: ${layoutConfig?.primaryColor || "#2563eb"};
          margin: 0;
          font-size: ${layoutConfig?.fontSize === "small"
        ? "20px"
        : layoutConfig?.fontSize === "large"
          ? "30px"
          : "26px"
      };
        }
        .tagline {
          font-size: ${layoutConfig?.fontSize === "small"
        ? "12px"
        : layoutConfig?.fontSize === "large"
          ? "16px"
          : "14px"
      };
          color: #666;
          margin: 5px 0;
        }
        .clinic-details {
          margin-top: 10px;
          color: #333;
          font-size: ${layoutConfig?.fontSize === "small"
        ? "11px"
        : layoutConfig?.fontSize === "large"
          ? "14px"
          : "12px"
      };
        }
        .document-title {
          text-align: center;
          margin: 20px 0;
        }
        .document-title h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
        }
        .document-subtitle {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }
        .content {
          flex: 1;
          padding: 10px 0;
          min-height: 0;
        }
        .section {
          margin-bottom: 24px;
        }
        .section h2 {
          font-size: 16px;
          margin-bottom: 8px;
          color: #111827;
          text-transform: uppercase;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .info-table td {
          padding: 8px 4px;
          border: none;
          font-size: 14px;
        }
        .info-table td.label {
          background: #f9fafb;
          font-weight: 600;
          width: 20%;
          padding-right: 8px;
        }
        .info-table td:not(.label) {
          padding-left: 4px;
          padding-right: 16px;
        }
        .parameters-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        .parameters-table th,
        .parameters-table td {
          border: 1px solid #333;
          padding: 10px;
          text-align: left;
          font-size: 12px;
        }
        .parameters-table th {
          background: #f5f5f5;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.05em;
          text-align: center;
        }
        .parameters-table td {
          text-align: left;
        }
        @media print {
          body {
            padding: 0;
            margin: 0;
          }
          .print-container {
            height: 100vh;
            padding: ${topMarginMm}mm 10mm 10mm 10mm;
            max-width: 100%;
            box-sizing: border-box;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${headerHtml}
        
        <div class="document-title">
          <h2>Pathology Report</h2>
        </div>
        
        <div class="content">

      <div class="section">
        <h2>Investigation Report</h2>
        <table class="info-table">
          <tr>
            <td class="label">Name</td>
            <td>${test.patientName}${test.patientEmail ? `<br/><span style="font-size: 12px; color: #666;">${test.patientEmail}</span>` : ""}</td>
            <td class="label">Test Name</td>
            <td colspan="2">${test.testName}</td>
          </tr>
          <tr>
            <td class="label">Age</td>
            <td>${test.patientAge ? test.patientAge + " years" : "—"}</td>
            <td class="label">Gender</td>
            <td>${test.patientGender ? test.patientGender.charAt(0).toUpperCase() + test.patientGender.slice(1) : "—"}</td>
            <td class="label">Category</td>
            <td>${test.categoryName}</td>
          </tr>
          <tr>
            <td class="label">Generated On</td>
            <td>${new Date().toLocaleString()}</td>
            <td class="label">Test Type</td>
            <td>${test.testType || "—"}</td>
            <td class="label">Collected on</td>
            <td>${new Date().toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Parameters</h2>
        <table class="parameters-table">
          <thead>
            <tr>
              <th>Parameter Name</th>
              <th>Patient Result</th>
              <th>Reference Range</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            ${parametersRows}
          </tbody>
        </table>
      </div>

      <div class="section" style="margin-top: 40px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="text-align: right; min-width: 250px;">
            ${test.labTechnicianName
        ? `
              <p style="margin: 5px 0; font-size: 12px; color: #666;">Lab Technician: ${test.labTechnicianName}</p>
            `
        : ""
      }
            <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 5px; width: 200px; margin-left: auto;">
              <p style="margin: 0; font-size: 12px; color: #666;">Lab Technician Sign</p>
            </div>
          </div>
        </div>
      </div>

      </div>
        
        ${footerHtml}
      </div>

      <script>
        window.addEventListener('load', function() {
          setTimeout(function() {
            window.print();
          }, 500);
        });
        window.addEventListener('afterprint', function() {
          window.close();
        });
        window.addEventListener('beforeunload', function() {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage('printComplete', '*');
          }
        });
      </script>
    </body>
  </html>`;
  };

  const buildDailyReportHtml = (
    reportData: {
      dailyTests: PathologyTest[];
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
    },
    date: string,
    clinic?: any,
    layoutConfig?: PrintLayoutConfig | null,
  ) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `<!DOCTYPE html>
<html>
<head>
  <title>Pathology Daily Report - ${date}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      border: 1px solid #ddd;
      padding: 15px;
      text-align: center;
      border-radius: 5px;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
    }
    .summary-card p {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
    }
    @media print {
      body { margin: 0; padding: 10px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${clinic?.name || layoutConfig?.clinicName || "Clinic Name"}</h1>
    <p>Pathology Daily Report</p>
    <p>${formattedDate}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Tests</h3>
      <p>${reportData.totalTests}</p>
    </div>
    <div class="summary-card">
      <h3>Total Patients</h3>
      <p>${reportData.totalPatients}</p>
    </div>
    <div class="summary-card">
      <h3>Total Revenue</h3>
      <p>NPR ${reportData.totalRevenue.toLocaleString()}</p>
    </div>
    <div class="summary-card">
      <h3>Total Invoices</h3>
      <p>${reportData.totalBillings}</p>
    </div>
  </div>

  <h2>Tests Performed</h2>
  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th>Patient</th>
        <th>Test Type</th>
        <th>Category</th>
        <th>Lab Technician</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      ${reportData.dailyTests
        .map(
          (test) => `
        <tr>
          <td>${test.testName}</td>
          <td>${test.patientName}${test.patientAge ? ` (${test.patientAge}${test.patientGender ? `, ${test.patientGender}` : ""})` : ""}</td>
          <td>${test.testType || "—"}</td>
          <td>${test.categoryName}</td>
          <td>${test.labTechnicianName || "—"}</td>
          <td>${new Date(test.createdAt).toLocaleTimeString()}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <h2>Invoices</h2>
  <table>
    <thead>
      <tr>
        <th>Invoice No</th>
        <th>Patient</th>
        <th>Items</th>
        <th>Amount</th>
        <th>Status</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      ${reportData.dailyBillings
        .map(
          (billing) => `
        <tr>
          <td>${billing.invoiceNumber}</td>
          <td>${billing.patientName}</td>
          <td>${billing.items.length}</td>
          <td>NPR ${billing.totalAmount.toLocaleString()}</td>
          <td>${billing.status.toUpperCase()}</td>
          <td>${new Date(billing.invoiceDate).toLocaleTimeString()}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
    </body>
  </html>`;
  };

  const handlePrintTest = (
    test: PathologyTest,
    options?: { hideLetterhead?: boolean },
  ) => {
    const defaultHide =
      layoutConfig?.defaultPathologyPrintWithoutLetterhead ?? false;
    const hideLetterhead = options?.hideLetterhead ?? defaultHide;

    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      addToast({
        title: "Error",
        description:
          "Unable to open print window. Please allow popups and try again.",
        color: "danger",
      });

      return;
    }

    const reportHtml = buildPathologyReportHtml(test, clinic, layoutConfig, {
      hideLetterhead,
    });

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner label="Loading pathology data..." size="lg" />
      </div>
    );
  }

  const tabLabels: Record<string, string> = {
    tests: "Pathology Tests",
    category: "Pathology Category",
    units: "Pathology Units",
    parameters: "Pathology Parameters",
    testPrices: "Test Prices",
    technicians: "Lab Technicians",
    billing: "Billing",
    dailyReport: "Daily Report",
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
          {activeTab === "tests" && (
            <PathologyTestsTab
              filteredTests={filteredTests}
              searchQuery={testsSearchQuery}
              onAdd={() => { resetTestForm(); testModalState.open(); }}
              onDelete={(test) => openDeleteModal("test", test.id, test.testName)}
              onEdit={editTest}
              onPrint={handlePrintTest}
              onSearchChange={setTestsSearchQuery}
            />
          )}
          {activeTab === "category" && (
            <PathologyCategoriesTab
              filteredCategories={filteredCategories}
              searchQuery={categoriesSearchQuery}
              onAdd={() => { resetCategoryForm(); categoryModalState.open(); }}
              onAddSubCategory={(cat) => {
                resetParameterForm();
                setParameterForm(prev => ({ ...prev, categoryId: cat.id }));
                parameterModalState.open();
              }}
              onDelete={(cat) => openDeleteModal("category", cat.id, cat.name)}
              onEdit={editCategory}
              onSearchChange={setCategoriesSearchQuery}
            />
          )}
          {activeTab === "units" && (
            <PathologyUnitsTab
              filteredUnits={filteredUnits}
              searchQuery={unitsSearchQuery}
              onAdd={() => { resetUnitForm(); unitModalState.open(); }}
              onDelete={(u) => openDeleteModal("unit", u.id, u.name)}
              onEdit={editUnit}
              onSearchChange={setUnitsSearchQuery}
            />
          )}
          {activeTab === "parameters" && (
            <PathologyParametersTab
              filteredParameters={filteredParameters}
              searchQuery={parametersSearchQuery}
              units={units}
              onAdd={() => { resetParameterForm(); parameterModalState.open(); }}
              onDelete={(p) => openDeleteModal("parameter", p.id, p.name)}
              onEdit={editParameter}
              onSearchChange={setParametersSearchQuery}
            />
          )}
          {activeTab === "testPrices" && (
            <PathologyTestTypesTab
              filteredTestTypes={filteredTestTypes}
              searchQuery={testTypesSearchQuery}
              onAdd={() => { resetTestTypeForm(); testTypeModalState.open(); }}
              onDelete={(tt) => openDeleteModal("testType", tt.id, tt.name || "Price Configuration")}
              onEdit={editTestType}
              onSearchChange={setTestTypesSearchQuery}
            />
          )}
          {activeTab === "technicians" && (
            <LabTechnicianManagement
              clinicId={clinicId!}
              branchId={branchId!}
            />
          )}
          {activeTab === "dailyReport" && (
            <PathologyDailyReportTab
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
            <PathologyBillingTab branchId={branchId!} clinicId={clinicId!} />
          )}
        </div>
      </div>

      {/* Test Form Modal - custom overlay */}
      {testModalState.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-mountain-900/40 backdrop-blur-sm"
              onClick={testModalState.close}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-lg w-full max-w-6xl mx-4 max-h-[92vh] flex flex-col shadow-2xl">
              <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between shrink-0">
                <h2 className="text-[14px] font-semibold text-mountain-900">
                  {isEditing ? "Edit Pathology Test" : "Create Pathology Tests"}
                </h2>
                <button
                  type="button"
                  onClick={testModalState.close}
                  className="text-mountain-400 hover:text-mountain-700"
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
                      className={`px-4 py-1.5 text-sm rounded ${!testForm.isWalkIn ? 'bg-white shadow text-mountain-900 font-medium' : 'text-mountain-600 hover:text-mountain-900'}`}
                      type="button"
                      onClick={() => setTestForm(prev => ({ ...prev, isWalkIn: false, patientId: '', patientName: '', patientAge: '', patientGender: '', walkInPhone: '' }))}
                    >
                      Existing Patient
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-1.5 text-sm rounded ${testForm.isWalkIn ? "bg-white shadow text-mountain-900 font-medium" : "text-mountain-600 hover:text-mountain-900"}`}
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
                          secondary: `${p.mobile || ''} ${p.age ? `(${p.age}y)` : ''}`
                        }))}
                        label="Patient Name *"
                        placeholder="Search or enter patient name"
                        value={testForm.patientId}
                        onChange={(id, primary) => {
                          const patient = patients.find(p => p.id === id);
                          setTestForm((prev) => ({
                            ...prev,
                            patientId: id,
                            patientName: primary,
                            patientAge: patient?.age?.toString() || prev.patientAge,
                            patientGender: patient?.gender || prev.patientGender
                          }));
                        }}
                        onInputChange={(val) => setTestForm((prev) => ({ ...prev, patientName: val, patientId: "" }))}
                      />
                    ) : (
                      <>
                        <Input
                          label="Patient Name *"
                          placeholder="Walk-In Name"
                          value={testForm.patientName}
                          onValueChange={(v) =>
                            setTestForm((prev) => ({ ...prev, patientName: v }))
                          }
                          isRequired
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
                        onChange={(e) => setTestForm((prev) => ({ ...prev, patientGender: e.target.value }))}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <Input
                      label="Short Name"
                      placeholder="Short Name"
                      value={testForm.shortName}
                      onValueChange={(v) =>
                        setTestForm((prev) => ({ ...prev, shortName: v }))
                      }
                    />

                    <PathologySearchSelect
                      label="Test Type"
                      placeholder="Search and select test type"
                      items={testTypes.map((tt) => ({
                        id: tt.name,
                        primary: tt.name,
                        secondary: `NPR ${tt.price.toFixed(2)}`,
                      }))}
                      value={testForm.testType}
                      onChange={(id, primary) => {
                        const tt = testTypes.find((t) => t.name === primary);

                        setTestForm((prev) => ({
                          ...prev,
                          testType: primary,
                          standardCharge: tt
                            ? tt.price.toString()
                            : prev.standardCharge,
                        }));
                      }}
                    />

                    <PathologySearchSelect
                      label="Category Name"
                      placeholder="Search and select category"
                      items={categories.map((c) => ({
                        id: c.id,
                        primary: c.name,
                      }))}
                      value={testForm.categoryId}
                      onChange={(id) =>
                        setTestForm((prev) => ({ ...prev, categoryId: id }))
                      }
                    />

                    <Input
                      label="Unit"
                      placeholder="Unit"
                      value={testForm.unit}
                      onValueChange={(v) =>
                        setTestForm((prev) => ({ ...prev, unit: v }))
                      }
                    />

                    <Input
                      label="Sub Category"
                      placeholder="Sub Category"
                      value={testForm.subCategory}
                      onValueChange={(v) =>
                        setTestForm((prev) => ({ ...prev, subCategory: v }))
                      }
                    />

                    <Input
                      label="Method"
                      placeholder="Method"
                      value={testForm.method}
                      onValueChange={(v) =>
                        setTestForm((prev) => ({ ...prev, method: v }))
                      }
                    />

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
                        onChange={(e) => setTestForm((prev) => ({ ...prev, chargeCategory: e.target.value }))}
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
                        secondary: t.employeeId ? `(${t.employeeId})` : undefined,
                      }))}
                      label="Lab Technician (Optional)"
                      placeholder="Search and select lab technician"
                      value={testForm.labTechnicianId}
                      onChange={(id) => setTestForm((prev) => ({ ...prev, labTechnicianId: id }))}
                    />
                  </div>
                </div>

                {/* Parameters Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Parameter Fields
                  </h3>
                  {testForm.parameters.map((param, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 mb-4 items-end bg-mountain-50/30 p-2 rounded border border-mountain-100"
                    >
                      <div className="col-span-2">
                        <PathologySearchSelect
                          label="Category"
                          placeholder="Select category"
                          items={categories.map((c) => ({
                            id: c.id,
                            primary: c.name,
                          }))}
                          value={param.categoryId}
                          onChange={(id) => {
                            updateTestParameter(index, "categoryId", id);
                            updateTestParameter(index, "parameterId", ""); // Reset parameter when category changes
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <PathologySearchSelect
                          label="Parameter *"
                          required
                          placeholder="Select sub-category"
                          items={parameters
                            .filter(
                              (p) =>
                                !param.categoryId ||
                                p.categoryId === param.categoryId,
                            )
                            .map((p) => ({
                              id: p.id,
                              primary: p.name,
                              secondary: p.referenceRange
                                ? `Range: ${p.referenceRange}`
                                : undefined,
                            }))}
                          value={param.parameterId}
                          onChange={(id) => updateTestParameter(index, "parameterId", id)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          isRequired
                          label="Patient Result *"
                          placeholder="Result (e.g. 10.5 or Text)"
                          value={param.patientResult}
                          onValueChange={(v) => updateTestParameter(index, "patientResult", v)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Ref. Range"
                          placeholder="Range"
                          value={param.referenceRange}
                          onValueChange={(v) =>
                            updateTestParameter(index, "referenceRange", v)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Unit"
                          placeholder="Unit"
                          value={param.unit}
                          onValueChange={(v) =>
                            updateTestParameter(index, "unit", v)
                          }
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center h-[32px] gap-1">
                        <Button
                          size="sm"
                          variant="light"
                          color="default"
                          isIconOnly
                          disabled={index === 0}
                          onClick={() => moveTestParameter(index, "up")}
                        >
                          <IoArrowUpOutline className="text-mountain-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onClick={() => removeTestParameter(index)}
                        >
                          <IoTrashOutline />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-center mt-4">
                    <Button
                      color="default"
                      variant="bordered"
                      startContent={<IoAddOutline />}
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
        )}

      {/* Category Form Modal */}
      {categoryModalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-mountain-900/40 backdrop-blur-sm"
            onClick={categoryModalState.close}
          />
          <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-md mx-4">
            <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60">
              <h2 className="text-[14px] font-semibold text-mountain-900">
                {isEditing
                  ? "Edit Pathology Category"
                  : "New Pathology Category"}
              </h2>
            </div>
            <div className="p-5">
              <Input
                isRequired
                label="Name *"
                placeholder="Category Name"
                value={categoryForm.name}
                onValueChange={(v) => setCategoryForm((prev) => ({ ...prev, name: v }))}
              />
            </div>
            <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2">
              <Button variant="light" onClick={categoryModalState.close}>
                Cancel
              </Button>
              <Button color="primary" onClick={handleSaveCategory}>
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Form Modal */}
      {unitModalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-mountain-900/40 backdrop-blur-sm"
            onClick={unitModalState.close}
          />
          <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-md mx-4">
            <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60">
              <h2 className="text-[14px] font-semibold text-mountain-900">
                {isEditing ? "Edit Pathology Unit" : "New Pathology Unit"}
              </h2>
            </div>
            <div className="p-5">
              <Input
                label="Name *"
                placeholder="Unit Name"
                value={unitForm.name}
                onValueChange={(v) =>
                  setUnitForm((prev) => ({ ...prev, name: v }))
                }
                isRequired
              />
            </div>
            <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2">
              <Button variant="light" onClick={unitModalState.close}>
                Cancel
              </Button>
              <Button color="primary" onClick={handleSaveUnit}>
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Parameter Form Modal */}
      {parameterModalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-mountain-900/40 backdrop-blur-sm"
            onClick={parameterModalState.close}
          />
          <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-md mx-4">
            <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60">
              <h2 className="text-[14px] font-semibold text-mountain-900">
                {isEditing
                  ? "Edit Pathology Parameter"
                  : "New Pathology Parameter"}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-mountain-700">
                  Category Name
                </label>
                <select
                  value={parameterForm.categoryId}
                  onChange={(e) =>
                    setParameterForm((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                >
                  <option value="">No Category Selected</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                isRequired
                label="Name *"
                placeholder="Parameter Name"
                value={parameterForm.name}
                onValueChange={(v) => setParameterForm((prev) => ({ ...prev, name: v }))}
              />
              <Input
                isRequired
                label="Reference Range *"
                placeholder="Reference Range"
                value={parameterForm.referenceRange}
                onValueChange={(v) => setParameterForm((prev) => ({ ...prev, referenceRange: v }))}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-mountain-700">
                  Unit
                </label>
                <select
                  className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                  value={parameterForm.unit}
                  onChange={(e) => setParameterForm((prev) => ({ ...prev, unit: e.target.value }))}
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2">
              <Button variant="light" onClick={parameterModalState.close}>
                Cancel
              </Button>
              <Button color="primary" onClick={handleSaveParameter}>
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Type Form Modal */}
      {testTypeModalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-mountain-900/40 backdrop-blur-sm"
            onClick={testTypeModalState.close}
          />
          <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-md mx-4 overflow-visible">
            <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60">
              <h2 className="text-[14px] font-semibold text-mountain-900">
                {isEditing
                  ? "Edit Price Configuration"
                  : "New Price Configuration"}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-mountain-700">
                  Setting Price For *
                </label>
                <select
                  className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                  value={testTypeForm.targetType}
                  onChange={(e) => setTestTypeForm((prev) => ({ ...prev, targetType: e.target.value as "category" | "parameter", categoryId: "", parameterId: "" }))}
                >
                  <option value="category">Full Category Package</option>
                  <option value="parameter">
                    Individual Sub-Category (Parameter)
                  </option>
                </select>
              </div>

              {testTypeForm.targetType === "category" ? (
                <div className="z-50 relative">
                  <PathologySearchSelect
                    required
                    items={categories.map((c) => ({ id: c.id, primary: c.name }))}
                    label="Category (e.g. CBC) *"
                    placeholder="Search and select category"
                    value={testTypeForm.categoryId}
                    onChange={(id) => setTestTypeForm((prev) => ({ ...prev, categoryId: id }))}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="z-40 relative">
                    <PathologySearchSelect
                      label="Category (Optional)"
                      placeholder="Filter parameters by category"
                      items={categories.map((c) => ({
                        id: c.id,
                        primary: c.name,
                      }))}
                      value={testTypeForm.categoryId}
                      onChange={(id) =>
                        setTestTypeForm((prev) => ({
                          ...prev,
                          categoryId: id,
                          parameterId: "",
                        }))
                      }
                    />
                  </div>
                  <div className="z-50 relative">
                    <PathologySearchSelect
                      required
                      items={parameters.filter(p => !testTypeForm.categoryId || p.categoryId === testTypeForm.categoryId).map((p) => ({ id: p.id, primary: p.name, secondary: p.referenceRange ? `Range: ${p.referenceRange}` : undefined }))}
                      label="Sub Category (Parameter) *"
                      placeholder="Search and select sub category"
                      value={testTypeForm.parameterId}
                      onChange={(id) => setTestTypeForm((prev) => ({ ...prev, parameterId: id }))}
                    />
                  </div>
                </div>
              )}

              <Input
                isRequired
                label="Price (NPR) *"
                placeholder="0.00"
                type="number"
                value={testTypeForm.price}
                onValueChange={(v) => setTestTypeForm((prev) => ({ ...prev, price: v }))}
              />
            </div>
            <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2">
              <Button variant="light" onClick={testTypeModalState.close}>
                Cancel
              </Button>
              <Button color="primary" onClick={handleSaveTestType}>
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-mountain-900/40 backdrop-blur-sm"
            onClick={deleteConfirmModalState.close}
          />
          <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-md mx-4">
            <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60">
              <h2 className="text-[14px] font-semibold text-mountain-900">
                Confirm Delete
              </h2>
            </div>
            <div className="p-5">
              <p className="text-[13.5px] text-mountain-800">
                Are you sure you want to delete{" "}
                <strong>{itemToDelete?.name}</strong>? This action cannot be
                undone.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/60 flex justify-end gap-2">
              <Button variant="light" onClick={deleteConfirmModalState.close}>
                Cancel
              </Button>
              <Button color="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Quick Patient Creation Modal */}
      {quickPatientModalState.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-mountain-900/40 backdrop-blur-sm"
              onClick={quickPatientModalState.close}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-lg w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-mountain-100 bg-mountain-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-bold text-mountain-900">
                    Quick Create Patient
                  </h2>
                  <p className="text-[12px] text-mountain-500">
                    Register a new patient to continue with the test
                  </p>
                </div>
                <button
                  type="button"
                  onClick={quickPatientModalState.close}
                  className="p-1.5 rounded-full hover:bg-mountain-100 text-mountain-400 hover:text-mountain-700 transition-colors"
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
                  onValueChange={(v) => setQuickPatientForm(prev => ({ ...prev, name: v }))}
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
                      onChange={(e) => setQuickPatientForm(prev => ({ ...prev, gender: e.target.value }))}
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
                  color="primary"
                  onClick={handleSaveQuickPatient}
                  className="px-8 font-medium"
                >
                  Create Patient
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
