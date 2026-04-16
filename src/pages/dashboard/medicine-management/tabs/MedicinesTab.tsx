import type { QueryDocumentSnapshot } from "firebase/firestore";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  IoAddOutline,
  IoSearchOutline,
  IoCreateOutline,
  IoMedkitOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoAddCircleOutline,
  IoCloseOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";

import { addToast } from "@/components/ui/toast";
import { useAuthContext } from "@/context/AuthContext";
import { useModalState } from "@/hooks/useModalState";
import { medicineService } from "@/services/medicineService";
import {
  Medicine,
  MedicineBrand,
  MedicineCategory,
  ClinicSettings,
  Supplier,
} from "@/types/models";

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = "lg",
  disabled,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  size?: "md" | "lg" | "xl" | "3xl";
  disabled?: boolean;
}) {
  const widthMap: Record<"md" | "lg" | "xl" | "3xl", string> = {
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "3xl": "max-w-4xl",
  };

  React.useEffect(() => {
    const el = (document.getElementById("dashboard-scroll-container") ??
      document.body) as HTMLElement;
    const prev = el.style.overflow;

    el.style.overflow = "hidden";

    return () => {
      el.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 overflow-hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !disabled) onClose();
      }}
    >
      <div
        className={`bg-white border border-mountain-200 rounded w-full ${widthMap[size]} flex flex-col max-h-[90vh]`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 py-3 border-b border-mountain-100 shrink-0">
          <div>
            <h3 className="text-[14px] font-semibold text-mountain-900">
              {title}
            </h3>
            {subtitle && <div className="mt-1">{subtitle}</div>}
          </div>
          {!disabled && (
            <button
              className="text-mountain-400 hover:text-mountain-700 mt-0.5"
              type="button"
              onClick={onClose}
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-mountain-100 shrink-0">
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface MedicinesTabProps {
  clinicSettings: ClinicSettings | null;
  onStatsChange: () => void;
  filterType?:
  | "lowStock"
  | "expiring"
  | "medicines"
  | "brands"
  | "categories"
  | null;
  /**
   * Effective branch scope for this view.
   * For branch users this matches their fixed branchId.
   * For clinic admins this is the branch selected on the parent page.
   */
  effectiveBranchId?: string | null;
}

export default function MedicinesTab({
  clinicSettings,
  onStatsChange,
  filterType,
  effectiveBranchId,
}: MedicinesTabProps) {
  const { userData, clinicId } = useAuthContext();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineStocks, setMedicineStocks] = useState<Record<string, number>>(
    {},
  );
  const [medicineSchemeStocks, setMedicineSchemeStocks] = useState<
    Record<string, number>
  >({});
  const [medicineExpiryDates, setMedicineExpiryDates] = useState<
    Record<string, Date>
  >({});
  const [brands, setBrands] = useState<MedicineBrand[]>([]);
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const modalState = useModalState(false);
  const refillModalState = useModalState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMedicine, setCurrentMedicine] = useState<Medicine | null>(null);
  const [medicineForRefill, setMedicineForRefill] = useState<Medicine | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [cursorByPage, setCursorByPage] = useState<
    Record<number, QueryDocumentSnapshot | null>
  >({});

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    brandId: "",
    categoryId: "",
    type: "tablet" as Medicine["type"],
    strength: "",
    unit: "tablet" as Medicine["unit"],
    description: "",
    supplierId: "",
    batchNumber: "",
    expiryDate: "",
    price: "",
    costPrice: "",
    barcode: "",
    currentStock: "",
  });

  const [refillFormData, setRefillFormData] = useState({
    regularQuantity: "",
    schemeQuantity: "",
    regularSalePrice: "",
    regularCostPrice: "",
    schemePrice: "",
    schemeCostPrice: "",
    expiryDate: "",
    batchNumber: "",
    unitPrice: "",
    invoiceNumber: "",
    supplierId: "",
    transactionType: "add" as "add" | "sub",
  });

  const useServerPagination =
    filterType !== "lowStock" && filterType !== "expiring";

  const branchScopeId = effectiveBranchId ?? userData?.branchId ?? null;

  const fetchMedicinesPaginated = useCallback(
    async (
      targetPage: number,
      cursor?: QueryDocumentSnapshot | null,
      searchPrefix?: string,
    ) => {
      if (!clinicId) return;
      setIsLoading(true);
      try {
        const prefix = searchPrefix ?? (searchQuery.trim() || undefined);
        const startAfterDoc =
          targetPage === 1 ? undefined : (cursor ?? undefined);
        const { medicines: pageMedicines, lastDoc: nextLastDoc } =
          await medicineService.getMedicinesByClinicPaginated(clinicId, {
            pageSize: rowsPerPage,
            lastDoc: startAfterDoc ?? undefined,
            searchPrefix: prefix,
            branchId: branchScopeId || undefined,
          });

        setMedicines(pageMedicines);
        setLastDoc(nextLastDoc);
        if (targetPage === 1) {
          const count = await medicineService.getMedicinesCountByClinic(
            clinicId,
            prefix,
            branchScopeId || undefined,
          );

          setTotalCount(count);
        }
        setCursorByPage((prev) => ({
          ...prev,
          [targetPage + 1]: nextLastDoc,
        }));
        const ids = pageMedicines.map((m) => m.id);
        const stockList = await medicineService.getStockByMedicineIds(
          clinicId,
          ids,
          branchScopeId || undefined,
        );
        const stockMap: Record<string, number> = {};
        const schemeStockMap: Record<string, number> = {};

        stockList.forEach((s) => {
          stockMap[s.medicineId] = s.currentStock;
          schemeStockMap[s.medicineId] = s.schemeStock;
        });
        setMedicineStocks(stockMap);
        setMedicineSchemeStocks(schemeStockMap);
        const expiryMap =
          await medicineService.getExpiryDatesForMedicineIds(ids);

        setMedicineExpiryDates(expiryMap);
      } catch (error) {
        console.error("Error fetching medicines (paginated):", error);
        addToast({
          title: "Error",
          description: "Failed to load medicines",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [clinicId, searchQuery, rowsPerPage, branchScopeId],
  );

  useEffect(() => {
    if (!clinicId) return;
    setPage(1);
    setCursorByPage({});
    if (useServerPagination) {
      fetchMedicinesPaginated(1, undefined, searchQuery.trim() || undefined);
    } else {
      fetchMedicines();
    }
    fetchBrands();
    fetchCategories();
    fetchSuppliers();
  }, [
    clinicId,
    filterType,
    searchQuery,
    useServerPagination,
    fetchMedicinesPaginated,
    branchScopeId,
  ]);

  const fetchSuppliers = async () => {
    if (!clinicId) return;

    try {
      const data = await medicineService.getSuppliersByClinic(
        clinicId,
        branchScopeId || undefined,
      );

      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchMedicines = async () => {
    if (!clinicId) return;

    setIsLoading(true);
    try {
      const data = await medicineService.getMedicinesByClinic(
        clinicId,
        undefined,
        branchScopeId || undefined,
      );

      setMedicines(data);

      // Fetch stock information for each medicine - use batch approach for better performance
      const stockMap: Record<string, number> = {};
      const schemeStockMap: Record<string, number> = {};
      const expiryMap: Record<string, Date> = {};

      try {
        // Use the existing getStockByClinic method which handles permissions properly
        const stockData = await medicineService.getStockByClinic(
          clinicId,
          branchScopeId || undefined,
        );

        // Map medicine IDs to stock quantities (both regular and scheme)
        stockData.forEach((stock) => {
          stockMap[stock.medicineId] = stock.currentStock;
          schemeStockMap[stock.medicineId] = stock.schemeStock || 0;
        });
      } catch (stockError) {
        console.warn("Could not fetch stock data:", stockError);
        // Continue without stock data if there are permission issues
      }

      // Fetch expiry dates from stock transactions for each medicine
      try {
        await Promise.all(
          data.map(async (medicine) => {
            try {
              // Get the latest stock transaction with expiry date
              const transactions = await medicineService.getStockTransactions(
                medicine.id,
                50,
                branchScopeId || undefined,
              );
              // Find the most recent transaction with an expiry date
              const transactionWithExpiry = transactions
                .filter((t) => t.expiryDate)
                .sort((a, b) => {
                  // Sort by createdAt descending to get the most recent
                  const dateA = a.createdAt?.getTime() || 0;
                  const dateB = b.createdAt?.getTime() || 0;

                  return dateB - dateA;
                })[0];

              if (transactionWithExpiry?.expiryDate) {
                expiryMap[medicine.id] = transactionWithExpiry.expiryDate;
              }
            } catch (error) {
              console.warn(
                `Could not fetch transactions for medicine ${medicine.id}:`,
                error,
              );
              // Continue without expiry date for this medicine
            }
          }),
        );
      } catch (expiryError) {
        console.warn(
          "Could not fetch expiry dates from transactions:",
          expiryError,
        );
        // Continue without expiry dates if there are permission issues
      }

      setMedicineStocks(stockMap);
      setMedicineSchemeStocks(schemeStockMap);
      setMedicineExpiryDates(expiryMap);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      addToast({
        title: "Error",
        description: "Failed to load medicines",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    if (!clinicId) return;

    try {
      const data = await medicineService.getMedicineBrandsByClinic(clinicId);

      setBrands(data.filter((brand) => brand.isActive));
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchCategories = async () => {
    if (!clinicId) return;

    try {
      const data =
        await medicineService.getMedicineCategoriesByClinic(clinicId);

      setCategories(data.filter((category) => category.isActive));
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    // Prevent modal from closing due to select events
    modalState.handleDropdownInteraction();
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }, 0);
  };

  const openAddModal = () => {
    setCurrentMedicine(null);
    setFormData({
      name: "",
      genericName: "",
      brandId: "",
      categoryId: "",
      type: "tablet",
      strength: "",
      unit: "tablet",
      description: "",
      supplierId: "",
      batchNumber: "",
      expiryDate: "",
      price: "",
      costPrice: "",
      barcode: "",
      currentStock: "",
    });
    modalState.open();
  };

  const openEditModal = async (medicine: Medicine) => {
    setCurrentMedicine(medicine);

    // Get current stock from our existing state first, then try to fetch if not available
    let currentStockValue = "";
    const existingStock = medicineStocks[medicine.id];

    if (existingStock !== undefined) {
      currentStockValue = existingStock.toString();
    } else {
      // Try to fetch individual stock if not in our state
      try {
        const stock = await medicineService.getMedicineStock(
          medicine.id,
          clinicId,
        );

        currentStockValue = stock ? stock.currentStock.toString() : "";
      } catch (error) {
        console.warn("Could not fetch stock for medicine:", medicine.id, error);
        // Continue without stock value if there are permission issues
        currentStockValue = "";
      }
    }

    setFormData({
      name: medicine.name,
      genericName: medicine.genericName || "",
      brandId: medicine.brandId || "",
      categoryId: medicine.categoryId || "",
      type: medicine.type,
      strength: medicine.strength || "",
      unit: medicine.unit,
      description: medicine.description || "",
      supplierId: medicine.supplierId || "",
      batchNumber: medicine.batchNumber || "",
      expiryDate: medicine.expiryDate
        ? medicine.expiryDate.toISOString().split("T")[0]
        : "",
      price: medicine.price?.toString() || "",
      costPrice: medicine.costPrice?.toString() || "",
      barcode: medicine.barcode || "",
      currentStock: currentStockValue,
    });
    modalState.open();
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      addToast({
        title: "Validation Error",
        description: "Medicine name is required",
      });

      return;
    }

    // Validate price fields if medicine sales are enabled
    if (clinicSettings?.sellsMedicines) {
      if (!formData.price.trim()) {
        addToast({
          title: "Validation Error",
          description: "Sale price is required when medicine sales are enabled",
        });

        return;
      }
      if (isNaN(parseFloat(formData.price))) {
        addToast({
          title: "Validation Error",
          description: "Please enter a valid price",
        });

        return;
      }
      if (formData.costPrice && isNaN(parseFloat(formData.costPrice))) {
        addToast({
          title: "Validation Error",
          description: "Please enter a valid cost price",
        });

        return;
      }
    }

    // Validate stock field
    if (formData.currentStock && isNaN(parseFloat(formData.currentStock))) {
      addToast({
        title: "Validation Error",
        description: "Please enter a valid stock quantity",
      });

      return;
    }

    // Check if medicine name already exists (for new medicines)
    if (
      !currentMedicine &&
      medicines.some(
        (medicine) =>
          medicine.name.toLowerCase() === formData.name.trim().toLowerCase(),
      )
    ) {
      addToast({
        title: "Validation Error",
        description: "A medicine with this name already exists",
      });

      return;
    }

    if (!clinicId || !userData?.id) {
      addToast({
        title: "Error",
        description: "Missing required information. Please try again.",
      });

      return;
    }

    setIsLoading(true);
    try {
      const medicineData: any = {
        name: formData.name.trim(),
        type: formData.type,
        unit: formData.unit,
        isActive: true,
        clinicId,
        branchId: branchScopeId || "",
        createdBy: userData.id,
      };

      // Only include optional fields if they have values
      if (formData.genericName.trim()) {
        medicineData.genericName = formData.genericName.trim();
      }
      if (formData.brandId) {
        medicineData.brandId = formData.brandId;
      }
      if (formData.categoryId) {
        medicineData.categoryId = formData.categoryId;
      }
      if (formData.strength.trim()) {
        medicineData.strength = formData.strength.trim();
      }
      if (formData.description.trim()) {
        medicineData.description = formData.description.trim();
      }
      if (formData.supplierId) {
        medicineData.supplierId = formData.supplierId;
      }
      if (formData.batchNumber.trim()) {
        medicineData.batchNumber = formData.batchNumber.trim();
      }
      if (formData.expiryDate) {
        medicineData.expiryDate = new Date(formData.expiryDate);
      }
      if (formData.price) {
        medicineData.price = parseFloat(formData.price);
      }
      if (formData.costPrice) {
        medicineData.costPrice = parseFloat(formData.costPrice);
      }
      if (formData.barcode.trim()) {
        medicineData.barcode = formData.barcode.trim();
      }

      if (currentMedicine) {
        await medicineService.updateMedicine(currentMedicine.id, medicineData);

        // Update stock if provided
        if (formData.currentStock) {
          try {
            const existingStock = await medicineService.getMedicineStock(
              currentMedicine.id,
              clinicId,
            );

            if (existingStock) {
              await medicineService.updateMedicineStock(existingStock.id, {
                currentStock: parseFloat(formData.currentStock),
                updatedBy: userData.id,
              });
            } else {
              // Create new stock record
              const initialStock = parseFloat(formData.currentStock);

              await medicineService.createMedicineStock({
                medicineId: currentMedicine.id,
                currentStock: initialStock,
                schemeStock: 0,
                minimumStock: 10,
                reorderLevel: 20,
                clinicId,
                branchId: branchScopeId || "",
                updatedBy: userData.id,
              });

              // Create stock transaction for initial stock entry
              try {
                await medicineService.createStockTransaction({
                  medicineId: currentMedicine.id,
                  type: "adjustment",
                  quantity: initialStock,
                  previousStock: 0,
                  newStock: initialStock,
                  reason: "Initial stock entry",
                  clinicId,
                  branchId: branchScopeId || "",
                  createdBy: userData.id,
                });
              } catch (transactionError) {
                console.warn(
                  "Could not create stock transaction:",
                  transactionError,
                );
                // Don't fail the whole operation if transaction creation fails
              }
            }
          } catch (stockError) {
            console.warn("Could not update stock:", stockError);
            // Show a specific warning about stock update failure
            addToast({
              title: "Warning",
              description: "Medicine saved but stock data could not be updated",
            });
          }
        }

        addToast({
          title: "Success",
          description: "Medicine updated successfully",
        });
      } else {
        const medicineId = await medicineService.createMedicine(medicineData);

        // Create stock record if provided
        if (formData.currentStock) {
          try {
            const initialStock = parseFloat(formData.currentStock);

            await medicineService.createMedicineStock({
              medicineId,
              currentStock: initialStock,
              schemeStock: 0,
              minimumStock: 10,
              reorderLevel: 20,
              clinicId,
              branchId: branchScopeId || "",
              updatedBy: userData.id,
            });

            // Create stock transaction for initial stock entry
            try {
              await medicineService.createStockTransaction({
                medicineId,
                type: "adjustment",
                quantity: initialStock,
                previousStock: 0,
                newStock: initialStock,
                reason: "Initial stock entry",
                clinicId,
                branchId: branchScopeId || "",
                createdBy: userData.id,
              });
            } catch (transactionError) {
              console.warn(
                "Could not create stock transaction:",
                transactionError,
              );
              // Don't fail the whole operation if transaction creation fails
            }
          } catch (stockError) {
            console.warn("Could not create stock record:", stockError);
            // Show a specific warning about stock creation failure
            addToast({
              title: "Warning",
              description:
                "Medicine created but stock record could not be created",
            });
          }
        }

        addToast({
          title: "Success",
          description: "Medicine created successfully",
        });
      }

      modalState.forceClose();
      if (useServerPagination) {
        fetchMedicinesPaginated(
          page,
          page === 1 ? undefined : (cursorByPage[page] ?? null),
        );
      } else {
        fetchMedicines();
      }
      onStatsChange();
    } catch (error) {
      console.error("Error saving medicine:", error);
      addToast({
        title: "Error",
        description: "Failed to save medicine",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (medicine: Medicine) => {
    setIsLoading(true);
    try {
      await medicineService.updateMedicine(medicine.id, {
        isActive: !medicine.isActive,
      });
      addToast({
        title: "Success",
        description: `Medicine ${medicine.isActive ? "deactivated" : "activated"} successfully`,
      });
      if (useServerPagination) {
        fetchMedicinesPaginated(
          page,
          page === 1 ? undefined : (cursorByPage[page] ?? null),
        );
      } else {
        fetchMedicines();
      }
      onStatsChange();
    } catch (error) {
      console.error("Error toggling medicine status:", error);
      addToast({
        title: "Error",
        description: "Failed to update medicine status",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefillStock = async () => {
    // Validate that at least one quantity is provided
    const regularQty = parseInt(refillFormData.regularQuantity) || 0;
    const schemeQty = parseInt(refillFormData.schemeQuantity) || 0;

    if (!medicineForRefill || (regularQty === 0 && schemeQty === 0)) {
      addToast({
        title: "Validation Error",
        description: "Please fill in at least one quantity (regular or scheme)",
        color: "danger",
      });

      return;
    }

    if (!refillFormData.expiryDate) {
      addToast({
        title: "Validation Error",
        description: "Please fill in expiry date",
        color: "danger",
      });

      return;
    }

    if (!clinicId || !userData?.id) return;

    setIsLoading(true);
    try {
      // Get current stock (both regular and scheme)
      const existingStock = await medicineService.getMedicineStock(
        medicineForRefill.id,
        clinicId,
      );
      const currentRegularStock = existingStock?.currentStock || 0;
      const currentSchemeStock = existingStock?.schemeStock || 0;

      const isAdd = refillFormData.transactionType === "add";
      const newRegularStock = isAdd
        ? currentRegularStock + regularQty
        : currentRegularStock - regularQty;
      const newSchemeStock = isAdd
        ? currentSchemeStock + schemeQty
        : currentSchemeStock - schemeQty;

      // Create stock transaction for regular stock if quantity !== 0
      if (regularQty !== 0) {
        const regularTransactionData: any = {
          medicineId: medicineForRefill.id,
          type: isAdd ? ("purchase" as const) : ("adjustment" as const),
          quantity: isAdd ? regularQty : -regularQty,
          previousStock: currentRegularStock,
          newStock: newRegularStock,
          expiryDate: new Date(refillFormData.expiryDate),
          isSchemeStock: false,
          clinicId,
          branchId: branchScopeId || "",
          createdBy: userData.id,
        };

        // Add price fields if provided
        if (refillFormData.regularSalePrice) {
          regularTransactionData.salePrice = parseFloat(
            refillFormData.regularSalePrice,
          );
        }
        if (refillFormData.regularCostPrice) {
          regularTransactionData.costPrice = parseFloat(
            refillFormData.regularCostPrice,
          );
        }
        // Legacy unitPrice for backward compatibility
        if (refillFormData.unitPrice) {
          regularTransactionData.unitPrice = parseFloat(
            refillFormData.unitPrice,
          );
          regularTransactionData.totalAmount =
            parseFloat(refillFormData.unitPrice) * regularQty;
        } else if (refillFormData.regularSalePrice) {
          regularTransactionData.totalAmount =
            parseFloat(refillFormData.regularSalePrice) * regularQty;
        }

        if (refillFormData.batchNumber) {
          regularTransactionData.batchNumber = refillFormData.batchNumber;
        }
        if (refillFormData.invoiceNumber) {
          regularTransactionData.invoiceNumber = refillFormData.invoiceNumber;
        }
        if (refillFormData.supplierId) {
          regularTransactionData.supplierId = refillFormData.supplierId;
        }

        await medicineService.createStockTransaction(regularTransactionData);
      }

      // Create stock transaction for scheme stock if quantity !== 0
      if (schemeQty !== 0) {
        const schemeTransactionData: any = {
          medicineId: medicineForRefill.id,
          type: isAdd ? ("purchase" as const) : ("adjustment" as const),
          quantity: isAdd ? schemeQty : -schemeQty,
          previousStock: currentSchemeStock,
          newStock: newSchemeStock,
          expiryDate: new Date(refillFormData.expiryDate),
          isSchemeStock: true,
          clinicId,
          branchId: branchScopeId || "",
          createdBy: userData.id,
        };

        // Add scheme price if provided
        if (refillFormData.schemePrice) {
          schemeTransactionData.schemePrice = parseFloat(
            refillFormData.schemePrice,
          );
          schemeTransactionData.salePrice = parseFloat(
            refillFormData.schemePrice,
          );
          schemeTransactionData.totalAmount =
            parseFloat(refillFormData.schemePrice) * schemeQty;
        }

        // Add scheme cost price if provided
        if (refillFormData.schemeCostPrice) {
          schemeTransactionData.costPrice = parseFloat(
            refillFormData.schemeCostPrice,
          );
        }

        if (refillFormData.batchNumber) {
          schemeTransactionData.batchNumber = refillFormData.batchNumber;
        }
        if (refillFormData.invoiceNumber) {
          schemeTransactionData.invoiceNumber = refillFormData.invoiceNumber;
        }
        if (refillFormData.supplierId) {
          schemeTransactionData.supplierId = refillFormData.supplierId;
        }

        await medicineService.createStockTransaction(schemeTransactionData);
      }

      // Update or create stock record
      if (existingStock) {
        await medicineService.updateMedicineStock(existingStock.id, {
          currentStock: newRegularStock,
          schemeStock: newSchemeStock,
          lastRestocked: new Date(),
          updatedBy: userData.id,
        });
      } else {
        await medicineService.createMedicineStock({
          medicineId: medicineForRefill.id,
          currentStock: newRegularStock,
          schemeStock: newSchemeStock,
          minimumStock: 10,
          reorderLevel: 20,
          clinicId,
          branchId: branchScopeId || "",
          updatedBy: userData.id,
        });
      }

      addToast({
        title: "Success",
        description: `Stock refilled successfully. Regular: ${newRegularStock}, Scheme: ${newSchemeStock}`,
        color: "success",
      });

      refillModalState.close();
      setMedicineForRefill(null);
      setRefillFormData({
        regularQuantity: "",
        schemeQuantity: "",
        regularSalePrice: "",
        regularCostPrice: "",
        schemePrice: "",
        schemeCostPrice: "",
        expiryDate: "",
        batchNumber: "",
        unitPrice: "",
        invoiceNumber: "",
        supplierId: "",
        transactionType: "add",
      });
      if (useServerPagination) {
        fetchMedicinesPaginated(
          page,
          page === 1 ? undefined : (cursorByPage[page] ?? null),
        );
      } else {
        fetchMedicines();
      }
      onStatsChange();
    } catch (error) {
      console.error("Error refilling stock:", error);
      addToast({
        title: "Error",
        description: "Failed to refill stock",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for filtering
  const isLowStock = (medicine: Medicine) => {
    const regularStock = medicineStocks[medicine.id] || 0;
    const schemeStock = medicineSchemeStocks[medicine.id] || 0;
    const totalStock = regularStock + schemeStock;
    const threshold = clinicSettings?.lowStockThreshold || 10;

    return totalStock <= threshold;
  };

  const isExpiring = (medicine: Medicine) => {
    const expiryDate = medicineExpiryDates[medicine.id] || medicine.expiryDate;

    if (!expiryDate) return false;
    const expiryDays = clinicSettings?.expiryAlertDays || 30;
    const alertDate = new Date();

    alertDate.setDate(alertDate.getDate() + expiryDays);

    return expiryDate <= alertDate;
  };

  // Helper function to get supplier/manufacturer display text
  const getSupplierOrManufacturer = (
    medicine: Medicine,
  ): string | undefined => {
    if (medicine.supplierId) {
      const supplier = suppliers.find((s) => s.id === medicine.supplierId);

      return supplier?.name;
    }

    return medicine.manufacturer;
  };

  const filteredMedicines = useServerPagination
    ? medicines
    : medicines.filter((medicine) => {
      const supplierOrManufacturer = getSupplierOrManufacturer(medicine);
      const matchesSearch =
        medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medicine.genericName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        supplierOrManufacturer
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (!filterType) return true;
      switch (filterType) {
        case "lowStock":
          return isLowStock(medicine);
        case "expiring":
          return isExpiring(medicine);
        default:
          return true;
      }
    });

  const totalPages = useServerPagination
    ? Math.ceil((totalCount ?? 0) / rowsPerPage)
    : Math.ceil(filteredMedicines.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentMedicines = useServerPagination
    ? medicines
    : filteredMedicines.slice(startIndex, endIndex);

  const getBrandName = (brandId?: string) => {
    if (!brandId) return "No Brand";
    const brand = brands.find((b) => b.id === brandId);

    return brand ? brand.name : "Unknown Brand";
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "No Category";
    const category = categories.find((c) => c.id === categoryId);

    return category ? category.name : "Unknown Category";
  };

  const medicineTypes = [
    { key: "tablet", label: "Tablet" },
    { key: "capsule", label: "Capsule" },
    { key: "syrup", label: "Syrup" },
    { key: "injection", label: "Injection" },
    { key: "cream", label: "Cream" },
    { key: "drops", label: "Drops" },
    { key: "inhaler", label: "Inhaler" },
    { key: "other", label: "Other" },
  ];

  const medicineUnits = [
    { key: "tablet", label: "Tablet" },
    { key: "capsule", label: "Capsule" },
    { key: "ml", label: "ML" },
    { key: "bottle", label: "Bottle" },
    { key: "vial", label: "Vial" },
    { key: "tube", label: "Tube" },
    { key: "piece", label: "Piece" },
  ];

  if (isLoading && medicines.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-2 text-mountain-500 text-[12.5px]">
          <div className="h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading medicines...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:max-w-md">
          <div className="relative flex items-center">
            <IoSearchOutline className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-mountain-400 w-4 h-4" />
            <input
              className="clarity-input with-left-icon h-8 w-full pr-2 text-[13px]"
              placeholder="Search medicines..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
            />
          </div>
        </div>
        <button
          className="clarity-btn clarity-btn-primary inline-flex items-center gap-1.5"
          type="button"
          onClick={openAddModal}
        >
          <IoAddOutline className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Filter status */}
      {filterType && (
        <div className="flex items-center gap-2">
          <span
            className={`clarity-badge inline-flex items-center px-2 py-0.5 text-[11px] rounded ${filterType === "lowStock"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : filterType === "expiring"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-teal-50 text-teal-700 border border-teal-200"
              }`}
          >
            {filterType === "lowStock"
              ? "Low Stock Medicines"
              : filterType === "expiring"
                ? "Expiring Soon Medicines"
                : "All Medicines"}
          </span>
          <span className="text-sm text-default-500">
            Showing{" "}
            {useServerPagination ? (totalCount ?? 0) : filteredMedicines.length}{" "}
            medicines
          </span>
        </div>
      )}

      {/* Medicines table */}
      <div className="bg-white border border-mountain-200 rounded shadow-sm">
        {/* Table controls bar */}
        <div className="p-4 border-b border-mountain-100 bg-mountain-50/50 flex items-center justify-between gap-3">
          <span className="text-[13px] text-mountain-500">
            {useServerPagination ? (totalCount ?? 0) : filteredMedicines.length}{" "}
            medicine
            {(useServerPagination
              ? (totalCount ?? 0)
              : filteredMedicines.length) !== 1
              ? "s"
              : ""}
            {filterType && (
              <span
                className={`ml-2 inline-flex px-2 py-0.5 rounded text-[11.5px] font-medium ${filterType === "lowStock"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : filterType === "expiring"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-teal-50 text-teal-700 border border-teal-200"
                  }`}
              >
                {filterType === "lowStock"
                  ? "Low Stock"
                  : filterType === "expiring"
                    ? "Expiring Soon"
                    : "All"}
              </span>
            )}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="flex flex-col items-center gap-2 text-mountain-500 text-[12.5px]">
                <div className="h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading medicines...</span>
              </div>
            </div>
          ) : currentMedicines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-mountain-50 flex items-center justify-center border border-mountain-100">
                <IoMedkitOutline className="w-5 h-5 text-mountain-400" />
              </div>
              <p className="text-[13.5px] font-medium text-mountain-700">
                No medicines found
              </p>
              <p className="text-[12.5px] text-mountain-400">
                Add a medicine or adjust your search.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-mountain-50/50 border-b border-mountain-200">
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    MEDICINE
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    BRAND / CATEGORY
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    TYPE & STRENGTH
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    STOCK
                  </th>
                  {clinicSettings?.sellsMedicines && (
                    <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                      PRICE
                    </th>
                  )}
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    EXPIRY
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    STATUS
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600 w-36">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mountain-100">
                {currentMedicines.map((medicine) => {
                  const regularStock = medicineStocks[medicine.id] ?? 0;
                  const schemeStock = medicineSchemeStocks[medicine.id] ?? 0;
                  const totalStock = regularStock + schemeStock;
                  const hasStockData =
                    medicineStocks[medicine.id] !== undefined ||
                    medicineSchemeStocks[medicine.id] !== undefined;
                  const expiryDate =
                    medicineExpiryDates[medicine.id] || medicine.expiryDate;
                  const isExpired = expiryDate && expiryDate < new Date();
                  const isLowStock =
                    hasStockData && totalStock > 0 && totalStock <= 10;
                  const supplierOrManufacturer =
                    getSupplierOrManufacturer(medicine);

                  return (
                    <tr
                      key={medicine.id}
                      className="hover:bg-mountain-50/30 transition-colors"
                    >
                      {/* Medicine */}
                      <td className="px-5 py-3">
                        <p className="text-[13.5px] font-semibold text-mountain-900">
                          {medicine.name}
                        </p>
                        {medicine.genericName && (
                          <p className="text-[12px] text-mountain-500 mt-0.5">
                            {medicine.genericName}
                          </p>
                        )}
                        {supplierOrManufacturer && (
                          <p className="text-[11.5px] text-mountain-400 mt-0.5">
                            by {supplierOrManufacturer}
                          </p>
                        )}
                      </td>

                      {/* Brand / Category */}
                      <td className="px-5 py-3">
                        <p className="text-[13px] text-mountain-800">
                          {getBrandName(medicine.brandId)}
                        </p>
                        <p className="text-[12px] text-mountain-500 mt-0.5">
                          {getCategoryName(medicine.categoryId)}
                        </p>
                      </td>

                      {/* Type & Strength */}
                      <td className="px-5 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11.5px] font-medium bg-mountain-100 text-mountain-700 border border-mountain-200 capitalize">
                          {medicine.type}
                        </span>
                        {medicine.strength && (
                          <p className="text-[12px] text-mountain-500 mt-1">
                            {medicine.strength}
                          </p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-3">
                        {!hasStockData ? (
                          <span className="text-[12.5px] text-mountain-400">
                            No tracking
                          </span>
                        ) : (
                          <div>
                            <p className="text-[13px] font-medium text-mountain-800">
                              {totalStock > 0 ? (
                                <>
                                  <span>
                                    {regularStock} {medicine.unit}
                                  </span>
                                  {schemeStock > 0 && (
                                    <span className="text-mountain-500">
                                      {" "}
                                      +{schemeStock} scheme
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-red-600 font-semibold">
                                  Out of stock
                                </span>
                              )}
                            </p>
                            {isLowStock && (
                              <span className="inline-flex mt-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                Low Stock
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Price (conditional) */}
                      {clinicSettings?.sellsMedicines && (
                        <td className="px-5 py-3">
                          {medicine.price ? (
                            <div>
                              <p className="text-[13px] font-semibold text-mountain-900">
                                NPR {medicine.price}
                              </p>
                              {medicine.costPrice && (
                                <p className="text-[12px] text-mountain-500">
                                  Cost: NPR {medicine.costPrice}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12.5px] text-mountain-400">
                              —
                            </span>
                          )}
                        </td>
                      )}

                      {/* Expiry */}
                      <td className="px-5 py-3">
                        {expiryDate ? (
                          <div>
                            <p className="text-[13px] text-mountain-700">
                              {expiryDate.toLocaleDateString()}
                            </p>
                            {isExpired && (
                              <span className="inline-flex mt-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                                Expired
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-[12.5px] text-mountain-400">
                              No expiry
                            </span>
                            {clinicSettings?.sellsMedicines && (
                              <span className="inline-flex ml-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                Required
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11.5px] font-medium ${medicine.isActive
                            ? "bg-teal-50 text-teal-700 border border-teal-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                        >
                          {medicine.isActive ? (
                            <IoCheckmarkCircleOutline className="w-3 h-3" />
                          ) : (
                            <IoCloseCircleOutline className="w-3 h-3" />
                          )}
                          {medicine.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-medium bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
                            onClick={() => {
                              setMedicineForRefill(medicine);
                              setRefillFormData({
                                regularQuantity: "",
                                schemeQuantity: "",
                                regularSalePrice: "",
                                regularCostPrice: "",
                                schemePrice: "",
                                schemeCostPrice: "",
                                expiryDate: "",
                                batchNumber: "",
                                unitPrice: "",
                                invoiceNumber: "",
                                supplierId: "",
                                transactionType: "add",
                              });
                              refillModalState.open();
                            }}
                          >
                            <IoAddCircleOutline className="w-3.5 h-3.5" />{" "}
                            Refill
                          </button>
                          <button
                            className="inline-flex items-center justify-center w-7 h-7 rounded border border-mountain-200 text-mountain-500 hover:text-nepal-700 hover:border-nepal-300 hover:bg-nepal-50 transition-colors"
                            title="Edit"
                            onClick={() => openEditModal(medicine)}
                          >
                            <IoCreateOutline className="w-4 h-4" />
                          </button>
                          <button
                            className={`inline-flex items-center justify-center w-7 h-7 rounded border transition-colors ${medicine.isActive
                              ? "border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600"
                              : "border-teal-200 text-teal-400 hover:bg-teal-50 hover:text-teal-600"
                              }`}
                            title={
                              medicine.isActive ? "Deactivate" : "Activate"
                            }
                            onClick={() => handleToggleStatus(medicine)}
                          >
                            {medicine.isActive ? (
                              <IoCloseCircleOutline className="w-4 h-4" />
                            ) : (
                              <IoCheckmarkCircleOutline className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/30 flex items-center justify-between">
            <p className="text-[12.5px] text-mountain-500">
              Showing{" "}
              <span className="font-medium text-mountain-900">
                {(page - 1) * rowsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-mountain-900">
                {Math.min(
                  page * rowsPerPage,
                  useServerPagination
                    ? (totalCount ?? 0)
                    : filteredMedicines.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-mountain-900">
                {useServerPagination
                  ? (totalCount ?? 0)
                  : filteredMedicines.length}
              </span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                aria-label="Previous page"
                className="w-8 h-8 flex items-center justify-center rounded border border-mountain-300 text-mountain-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-teal-400 hover:text-teal-700 hover:bg-mountain-50 transition-all font-medium"
                disabled={page === 1}
                type="button"
                onClick={() => {
                  if (useServerPagination && page > 1) {
                    const prevPage = page - 1;

                    setPage(prevPage);
                    fetchMedicinesPaginated(
                      prevPage,
                      cursorByPage[prevPage] ?? null,
                    );
                  } else {
                    setPage((prev) => Math.max(1, prev - 1));
                  }
                }}
              >
                <IoChevronBackOutline className="w-4 h-4" />
              </button>
              <span className="text-[12.5px] text-mountain-600 px-2 min-w-[90px] text-center">
                Page{" "}
                <span className="font-semibold text-mountain-900">{page}</span>{" "}
                of{" "}
                <span className="font-semibold text-mountain-900">
                  {totalPages}
                </span>
              </span>
              <button
                aria-label="Next page"
                className="w-8 h-8 flex items-center justify-center rounded border border-mountain-300 text-mountain-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-teal-400 hover:text-teal-700 hover:bg-mountain-50 transition-all font-medium"
                disabled={page === totalPages}
                type="button"
                onClick={() => {
                  if (useServerPagination && page < totalPages) {
                    const nextPage = page + 1;

                    setPage(nextPage);
                    fetchMedicinesPaginated(nextPage, lastDoc);
                  } else {
                    setPage((prev) => Math.min(totalPages, prev + 1));
                  }
                }}
              >
                <IoChevronForwardOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalState.isOpen && (
        <ModalShell
          disabled={isLoading}
          footer={
            <>
              <button
                className="clarity-btn clarity-btn-ghost"
                disabled={isLoading}
                type="button"
                onClick={modalState.forceClose}
              >
                Cancel
              </button>
              <button
                className="clarity-btn clarity-btn-primary"
                disabled={isLoading}
                type="button"
                onClick={handleSave}
              >
                {isLoading ? "Saving..." : "Save Medicine"}
              </button>
            </>
          }
          size="xl"
          subtitle={
            <p className="text-[11.5px] text-mountain-400">
              Manage core details, pricing, and inventory metadata.
            </p>
          }
          title={currentMedicine ? "Edit Medicine" : "Add Medicine"}
          onClose={modalState.forceClose}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Medicine Name <span className="text-danger">*</span>
              </label>
              <input
                required
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="name"
                placeholder="Enter medicine name"
                value={formData.name}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Generic Name
              </label>
              <input
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="genericName"
                placeholder="Enter generic name"
                value={formData.genericName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Brand
              </label>
              <select
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="brandId"
                value={formData.brandId}
                onChange={(e) => handleSelectChange("brandId", e.target.value)}
              >
                <option value="">No Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Category
              </label>
              <select
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="categoryId"
                value={formData.categoryId}
                onChange={(e) =>
                  handleSelectChange("categoryId", e.target.value)
                }
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Type
              </label>
              <select
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="type"
                value={formData.type}
                onChange={(e) => handleSelectChange("type", e.target.value)}
              >
                {medicineTypes.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Strength
              </label>
              <input
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="strength"
                placeholder="e.g., 500mg, 10ml"
                value={formData.strength}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Unit
              </label>
              <select
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="unit"
                value={formData.unit}
                onChange={(e) => handleSelectChange("unit", e.target.value)}
              >
                {medicineUnits.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Supplier
              </label>
              <select
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="supplierId"
                value={formData.supplierId}
                onChange={(e) =>
                  handleSelectChange("supplierId", e.target.value)
                }
              >
                <option value="">No Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                    {supplier.contactPerson
                      ? ` (${supplier.contactPerson})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Details */}
            <div className="md:col-span-2 mt-2">
              <h3 className="text-[12px] font-semibold text-mountain-700 tracking-[0.08em] uppercase mb-2">
                Additional Details
              </h3>
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Batch Number
              </label>
              <input
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="batchNumber"
                placeholder="Enter batch number"
                value={formData.batchNumber}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            {clinicSettings?.sellsMedicines && (
              <>
                <div>
                  <label className="text-sm font-medium text-default-700 mb-1.5 block">
                    Sale Price (NPR) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-default-400 text-[11px]">
                      NPR
                    </span>
                    <input
                      required
                      className="clarity-input with-prefix h-8 w-full text-[13px] pr-2"
                      name="price"
                      placeholder="Enter sale price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-default-700 mb-1.5 block">
                    Cost Price (NPR)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-default-400 text-[11px]">
                      NPR
                    </span>
                    <input
                      className="clarity-input with-prefix h-8 w-full text-[13px] pr-2"
                      name="costPrice"
                      placeholder="Enter cost price"
                      type="number"
                      value={formData.costPrice}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Barcode
              </label>
              <input
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="barcode"
                placeholder="Enter barcode"
                value={formData.barcode}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Description
              </label>
              <textarea
                className="clarity-input w-full text-[13px] px-2 py-2 min-h-[80px]"
                name="description"
                placeholder="Enter medicine description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </ModalShell>
      )}

      {/* Refill Stock Modal */}
      {refillModalState.isOpen && (
        <ModalShell
          disabled={isLoading}
          footer={
            <>
              <button
                className="clarity-btn clarity-btn-ghost"
                disabled={isLoading}
                type="button"
                onClick={refillModalState.close}
              >
                Cancel
              </button>
              <button
                className="clarity-btn clarity-btn-primary"
                disabled={
                  isLoading ||
                  (!refillFormData.regularQuantity &&
                    !refillFormData.schemeQuantity) ||
                  !refillFormData.expiryDate
                }
                type="button"
                onClick={handleRefillStock}
              >
                {isLoading ? "Refilling..." : "Refill Stock"}
              </button>
            </>
          }
          size="lg"
          subtitle={
            <div className="text-[11.5px] text-mountain-500">
              <span className="font-medium text-mountain-700">Medicine:</span>{" "}
              {medicineForRefill?.name}
            </div>
          }
          title="Refill Stock"
          onClose={refillModalState.close}
        >
          <div className="space-y-6">
            {/* Transaction Type Toggle */}
            <div className="flex bg-mountain-100 p-1 rounded-md w-full mb-4">
              <button
                className={`flex-1 py-1.5 text-xs rounded transition-all ${refillFormData.transactionType === "add" ? "bg-white shadow text-teal-700 font-semibold" : "text-mountain-500 hover:text-mountain-800"}`}
                type="button"
                onClick={() =>
                  setRefillFormData((prev) => ({
                    ...prev,
                    transactionType: "add",
                  }))
                }
              >
                <div className="flex items-center justify-center gap-1.5">
                  <IoAddCircleOutline className="w-4 h-4" />
                  Add to Stock
                </div>
              </button>
              <button
                className={`flex-1 py-1.5 text-xs rounded transition-all ${refillFormData.transactionType === "sub" ? "bg-white shadow text-red-600 font-semibold" : "text-mountain-500 hover:text-mountain-800"}`}
                type="button"
                onClick={() =>
                  setRefillFormData((prev) => ({
                    ...prev,
                    transactionType: "sub",
                  }))
                }
              >
                <div className="flex items-center justify-center gap-1.5">
                  <IoCloseCircleOutline className="w-4 h-4" />
                  Subtract from Stock
                </div>
              </button>
            </div>

            {/* Regular Stock Section */}
            <div>
              <h4 className="text-md font-semibold text-default-700 mb-3">
                Regular Stock
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-default-700 mb-1.5 block">
                    Regular Quantity
                  </label>
                  <input
                    className="clarity-input h-8 w-full text-[13px] px-2"
                    min={0}
                    name="regularQuantity"
                    placeholder="Enter regular stock quantity"
                    type="number"
                    value={refillFormData.regularQuantity}
                    onChange={(e) =>
                      setRefillFormData((prev) => ({
                        ...prev,
                        regularQuantity: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-default-700 mb-1.5 block">
                      Regular Sale Price (NPR)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-default-400 text-[11px]">
                        NPR
                      </span>
                      <input
                        className="clarity-input with-prefix h-8 w-full text-[13px] pr-2"
                        min={0}
                        name="regularSalePrice"
                        placeholder="Enter sale price"
                        step="any"
                        type="number"
                        value={refillFormData.regularSalePrice}
                        onChange={(e) =>
                          setRefillFormData((prev) => ({
                            ...prev,
                            regularSalePrice: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-default-700 mb-1.5 block">
                      Regular Cost Price (NPR)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-default-400 text-[11px]">
                        NPR
                      </span>
                      <input
                        className="clarity-input with-prefix h-8 w-full text-[13px] pr-2"
                        min={0}
                        name="regularCostPrice"
                        placeholder="Enter cost price"
                        step="any"
                        type="number"
                        value={refillFormData.regularCostPrice}
                        onChange={(e) =>
                          setRefillFormData((prev) => ({
                            ...prev,
                            regularCostPrice: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheme Stock Section */}
            <div className="pt-4 border-t border-default-200">
              <h4 className="text-md font-semibold text-default-700 mb-3">
                Scheme Stock
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-default-700 mb-1.5 block">
                    Scheme Quantity
                  </label>
                  <input
                    className="clarity-input h-8 w-full text-[13px] px-2"
                    min={0}
                    name="schemeQuantity"
                    placeholder="Enter scheme stock quantity"
                    type="number"
                    value={refillFormData.schemeQuantity}
                    onChange={(e) =>
                      setRefillFormData((prev) => ({
                        ...prev,
                        schemeQuantity: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-default-700 mb-1.5 block">
                    Scheme Price (NPR)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-default-400 text-[11px]">
                      NPR
                    </span>
                    <input
                      className="clarity-input with-prefix h-8 w-full text-[13px] pr-2"
                      min={0}
                      name="schemePrice"
                      placeholder="Enter scheme stock sale price"
                      step="any"
                      type="number"
                      value={refillFormData.schemePrice}
                      onChange={(e) =>
                        setRefillFormData((prev) => ({
                          ...prev,
                          schemePrice: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-default-700 mb-1.5 block">
                    Scheme Cost Price (NPR)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-default-400 text-[11px]">
                      NPR
                    </span>
                    <input
                      className="clarity-input with-prefix h-8 w-full text-[13px] pr-2"
                      min={0}
                      name="schemeCostPrice"
                      placeholder="Enter cost price"
                      step="any"
                      type="number"
                      value={refillFormData.schemeCostPrice}
                      onChange={(e) =>
                        setRefillFormData((prev) => ({
                          ...prev,
                          schemeCostPrice: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Common Fields */}
            <div className="pt-4 border-t border-default-200">
              <h4 className="text-[12px] font-semibold text-default-700 tracking-[0.08em] uppercase mb-3">
                Additional Information
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-default-700 mb-1.5 block">
                    Expiry Date <span className="text-danger">*</span>
                  </label>
                  <input
                    required
                    className="clarity-input h-8 w-full text-[13px] px-2"
                    name="expiryDate"
                    type="date"
                    value={refillFormData.expiryDate}
                    onChange={(e) =>
                      setRefillFormData((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-default-700 mb-1.5 block">
                    Batch Number
                  </label>
                  <input
                    className="clarity-input h-8 w-full text-[13px] px-2"
                    name="batchNumber"
                    placeholder="Enter batch number"
                    value={refillFormData.batchNumber}
                    onChange={(e) =>
                      setRefillFormData((prev) => ({
                        ...prev,
                        batchNumber: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-default-700 mb-1.5 block">
                    Unit Price (NPR) - Legacy
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-default-400 text-[11px]">
                      NPR
                    </span>
                    <input
                      className="clarity-input with-prefix h-8 w-full text-[13px] pr-2"
                      min={0}
                      name="unitPrice"
                      placeholder="Enter unit price (if sale price not provided)"
                      step="any"
                      type="number"
                      value={refillFormData.unitPrice}
                      onChange={(e) =>
                        setRefillFormData((prev) => ({
                          ...prev,
                          unitPrice: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-default-700 mb-1.5 block">
                      Invoice Number
                    </label>
                    <input
                      className="clarity-input h-8 w-full text-[13px] px-2"
                      name="invoiceNumber"
                      placeholder="Enter invoice number"
                      value={refillFormData.invoiceNumber}
                      onChange={(e) =>
                        setRefillFormData((prev) => ({
                          ...prev,
                          invoiceNumber: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-default-700 mb-1.5 block">
                      Supplier
                    </label>
                    <select
                      className="clarity-input h-8 w-full text-[13px] px-2"
                      name="refillSupplierId"
                      value={refillFormData.supplierId}
                      onChange={(e) =>
                        setRefillFormData((prev) => ({
                          ...prev,
                          supplierId: e.target.value,
                        }))
                      }
                    >
                      <option value="">No Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                          {supplier.contactPerson
                            ? ` (${supplier.contactPerson})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
