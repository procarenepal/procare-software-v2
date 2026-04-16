import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  IoAddOutline,
  IoSearchOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoFlaskOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoCloseOutline,
} from "react-icons/io5";

import { addToast } from "@/components/ui/toast";
import { useAuthContext } from "@/context/AuthContext";
import { medicineService } from "@/services/medicineService";
import { MedicineCategory } from "@/types/models";

interface CategoriesTabProps {
  onStatsChange: () => void;
  /**
   * Effective branch scope for this view.
   * For branch users this matches their fixed branchId.
   * For clinic admins this is the branch selected on the parent page.
   */
  effectiveBranchId?: string | null;
}

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
  size?: "md" | "lg" | "xl";
  disabled?: boolean;
}) {
  const widthMap: Record<NonNullable<typeof size>, string> = {
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
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
              aria-label="Close modal"
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

export default function CategoriesTab({
  onStatsChange,
  effectiveBranchId,
}: CategoriesTabProps) {
  const { userData, clinicId } = useAuthContext();
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCategory, setCurrentCategory] =
    useState<MedicineCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<MedicineCategory | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const branchScopeId = effectiveBranchId ?? userData?.branchId ?? null;

  useEffect(() => {
    if (clinicId) {
      fetchCategories();
    }
  }, [clinicId, branchScopeId]);

  const fetchCategories = async () => {
    if (!clinicId) return;

    setIsLoading(true);
    try {
      const data = await medicineService.getMedicineCategoriesByClinic(
        clinicId,
        branchScopeId || undefined,
      );

      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      addToast({
        title: "Error",
        description: "Failed to load categories",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setCurrentCategory(null);
    setFormData({
      name: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: MedicineCategory) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      addToast({
        title: "Validation Error",
        description: "Category name is required",
      });

      return;
    }

    if (
      !currentCategory &&
      categories.some(
        (category) =>
          category.name.toLowerCase() === formData.name.trim().toLowerCase(),
      )
    ) {
      addToast({
        title: "Validation Error",
        description: "A category with this name already exists",
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
      const categoryData: any = {
        name: formData.name.trim(),
        isActive: true,
        clinicId,
        branchId: branchScopeId || "",
        createdBy: userData.id,
      };

      if (formData.description.trim()) {
        categoryData.description = formData.description.trim();
      }

      if (currentCategory) {
        await medicineService.updateMedicineCategory(
          currentCategory.id,
          categoryData,
        );
        addToast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await medicineService.createMedicineCategory(categoryData);
        addToast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      setIsModalOpen(false);
      fetchCategories();
      onStatsChange();
    } catch (error) {
      console.error("Error saving category:", error);
      addToast({
        title: "Error",
        description: "Failed to save category",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (category: MedicineCategory) => {
    setIsLoading(true);
    try {
      await medicineService.updateMedicineCategory(category.id, {
        isActive: !category.isActive,
      });
      addToast({
        title: "Success",
        description: `Category ${category.isActive ? "deactivated" : "activated"} successfully`,
      });
      fetchCategories();
      onStatsChange();
    } catch (error) {
      console.error("Error toggling category status:", error);
      addToast({
        title: "Error",
        description: "Failed to update category status",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (category: MedicineCategory) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setIsLoading(true);
    try {
      await medicineService.deleteMedicineCategory(categoryToDelete.id);
      addToast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
      onStatsChange();
    } catch (error) {
      console.error("Error deleting category:", error);
      addToast({
        title: "Error",
        description: "Failed to delete category",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-2 text-mountain-500 text-[12.5px]">
          <div className="h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading categories...</span>
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
              placeholder="Search categories..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          className="clarity-btn clarity-btn-primary inline-flex items-center gap-1.5"
          type="button"
          onClick={openAddModal}
        >
          <IoAddOutline className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories table */}
      <div className="bg-white border border-mountain-200 rounded">
        <div className="p-4 border-b border-mountain-100 bg-mountain-50/50 flex items-center justify-between">
          <span className="text-[13px] text-mountain-500">
            {filteredCategories.length} categor
            {filteredCategories.length !== 1 ? "ies" : "y"}
          </span>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="flex flex-col items-center gap-2 text-mountain-500 text-[12.5px]">
                <div className="h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading categories...</span>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-mountain-50 flex items-center justify-center border border-mountain-100">
                <IoFlaskOutline className="w-5 h-5 text-mountain-400" />
              </div>
              <p className="text-[13.5px] font-medium text-mountain-700">
                No categories found
              </p>
              <p className="text-[12.5px] text-mountain-400">
                Add a category or adjust your search.
              </p>
            </div>
          ) : (
            <table className="clarity-table w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-mountain-50/50 border-b border-mountain-200">
                  <th className="px-5 py-3 text-[11px] font-semibold text-mountain-600 tracking-[0.06em] uppercase">
                    Category Name
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-mountain-600 tracking-[0.06em] uppercase">
                    Description
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-mountain-600 tracking-[0.06em] uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-mountain-600 tracking-[0.06em] uppercase">
                    Created
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-mountain-600 tracking-[0.06em] uppercase w-36">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mountain-100">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-mountain-50/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <IoFlaskOutline className="text-teal-700 w-4 h-4" />
                        <span className="text-[13.5px] font-semibold text-mountain-900">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {category.description ? (
                        <span className="text-[13px] text-mountain-700">
                          {category.description}
                        </span>
                      ) : (
                        <span className="text-[12.5px] text-mountain-400">
                          No description
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`clarity-badge inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11.5px] font-medium border ${
                          category.isActive
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {category.isActive ? (
                          <IoCheckmarkCircleOutline className="w-3 h-3" />
                        ) : (
                          <IoCloseCircleOutline className="w-3 h-3" />
                        )}
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[13px] text-mountain-700">
                        {category.createdAt
                          ? category.createdAt.toLocaleDateString()
                          : "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          aria-label="Edit category"
                          className="inline-flex items-center justify-center w-7 h-7 rounded border border-mountain-200 text-mountain-500 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                          title="Edit"
                          type="button"
                          onClick={() => openEditModal(category)}
                        >
                          <IoCreateOutline className="w-4 h-4" />
                        </button>
                        <button
                          aria-label={
                            category.isActive
                              ? "Deactivate category"
                              : "Activate category"
                          }
                          className={`inline-flex items-center justify-center w-7 h-7 rounded border transition-colors ${
                            category.isActive
                              ? "border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600"
                              : "border-teal-200 text-teal-400 hover:bg-teal-50 hover:text-teal-600"
                          }`}
                          title={category.isActive ? "Deactivate" : "Activate"}
                          type="button"
                          onClick={() => handleToggleStatus(category)}
                        >
                          {category.isActive ? (
                            <IoCloseCircleOutline className="w-4 h-4" />
                          ) : (
                            <IoCheckmarkCircleOutline className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          aria-label="Delete category"
                          className="inline-flex items-center justify-center w-7 h-7 rounded border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                          type="button"
                          onClick={() => openDeleteModal(category)}
                        >
                          <IoTrashOutline className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <ModalShell
          disabled={isLoading}
          footer={
            <>
              <button
                className="clarity-btn clarity-btn-ghost"
                disabled={isLoading}
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="clarity-btn clarity-btn-primary"
                disabled={isLoading}
                type="button"
                onClick={handleSave}
              >
                {isLoading ? "Saving..." : "Save Category"}
              </button>
            </>
          }
          size="lg"
          subtitle={
            <p className="text-[11.5px] text-mountain-400">
              Category metadata for medicine grouping.
            </p>
          }
          title={currentCategory ? "Edit Category" : "Add Category"}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Category Name <span className="text-danger">*</span>
              </label>
              <input
                required
                className="clarity-input h-8 w-full text-[13px] px-2"
                name="name"
                placeholder="Enter category name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-default-700 mb-1.5 block">
                Description
              </label>
              <textarea
                className="clarity-input w-full text-[13px] px-2 py-2 min-h-[80px]"
                name="description"
                placeholder="Enter category description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ModalShell
          disabled={isLoading}
          footer={
            <>
              <button
                className="clarity-btn clarity-btn-ghost"
                disabled={isLoading}
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="clarity-btn clarity-btn-primary bg-rose-600 hover:bg-rose-700 border-rose-600"
                disabled={isLoading}
                type="button"
                onClick={handleDelete}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IoTrashOutline className="w-4 h-4" />
                  {isLoading ? "Deleting..." : "Delete Category"}
                </span>
              </button>
            </>
          }
          size="md"
          subtitle={
            <p className="text-[11.5px] text-mountain-500">
              You are about to delete{" "}
              <span className="font-semibold text-mountain-800">
                "{categoryToDelete?.name}"
              </span>
              .
            </p>
          }
          title="Confirm Delete"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-start gap-2">
                <IoWarningOutline className="text-red-600 mt-0.5 flex-shrink-0 w-4 h-4" />
                <div className="text-[12.5px] text-red-700">
                  <p className="font-semibold mb-1">
                    This action cannot be undone.
                  </p>
                  <p>
                    The category will be permanently removed. Medicines
                    associated with this category may lose their category
                    information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
