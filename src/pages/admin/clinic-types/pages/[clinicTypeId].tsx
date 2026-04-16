// src/pages/admin/clinic-types/pages/[clinicTypeId].tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { addToast } from "@heroui/toast";
import {
  IoSaveOutline,
  IoArrowBackOutline,
  IoSearchOutline,
  IoFilterOutline,
} from "react-icons/io5";

import { title } from "@/components/primitives";
import { clinicTypeService } from "@/services/clinicTypeService";
import { pageService } from "@/services/pageService";
import { ClinicType, Page } from "@/types/models";

export default function ManageClinicTypePages() {
  const { clinicTypeId } = useParams<{ clinicTypeId: string }>();
  const navigate = useNavigate();

  const [clinicType, setClinicType] = useState<ClinicType | null>(null);
  const [allPages, setAllPages] = useState<Page[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all"); // all, assigned, unassigned
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [autoAssignFilter, setAutoAssignFilter] = useState("all"); // all, auto, manual

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (!clinicTypeId) return;

        // Load clinic type, all pages, and assigned pages
        const [clinicTypeData, pages, assignments] = await Promise.all([
          clinicTypeService.getClinicTypeById(clinicTypeId),
          pageService.getAllPages(),
          pageService.getClinicTypePageAssignments(clinicTypeId),
        ]);

        setClinicType(clinicTypeData);
        setAllPages(pages);

        // Extract page IDs from assignments
        const assignedPageIds = assignments
          .filter((a) => a.isEnabled)
          .map((a) => a.pageId);

        console.log("Debug - All assignments:", assignments);
        console.log(
          "Debug - Enabled assignments:",
          assignments.filter((a) => a.isEnabled),
        );
        console.log("Debug - Assigned page IDs:", assignedPageIds);
        console.log(
          "Debug - Auto-assign pages:",
          pages.filter((p) => p.autoAssign),
        );

        setSelectedPageIds(assignedPageIds);
      } catch (error) {
        console.error("Error loading data:", error);
        addToast({
          title: "Error",
          description: "Failed to load page data",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clinicTypeId]);

  // Filter and search logic
  const filteredPages = allPages.filter((page) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.path.toLowerCase().includes(searchQuery.toLowerCase());

    // Assignment filter
    const isAssigned = selectedPageIds.includes(page.id);
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" && isAssigned) ||
      (assignmentFilter === "unassigned" && !isAssigned);

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && page.isActive) ||
      (statusFilter === "inactive" && !page.isActive);

    // Auto-assign filter
    const matchesAutoAssign =
      autoAssignFilter === "all" ||
      (autoAssignFilter === "auto" && page.autoAssign) ||
      (autoAssignFilter === "manual" && !page.autoAssign);

    return (
      matchesSearch && matchesAssignment && matchesStatus && matchesAutoAssign
    );
  });

  const handlePageToggle = (pageId: string) => {
    setSelectedPageIds((prevSelected) => {
      if (prevSelected.includes(pageId)) {
        return prevSelected.filter((id) => id !== pageId);
      } else {
        return [...prevSelected, pageId];
      }
    });
  };

  // Helper functions
  const clearAllFilters = () => {
    setSearchQuery("");
    setAssignmentFilter("all");
    setStatusFilter("all");
    setAutoAssignFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    assignmentFilter !== "all" ||
    statusFilter !== "all" ||
    autoAssignFilter !== "all";

  // Statistics
  const totalPages = allPages.length;
  const assignedCount = selectedPageIds.length;
  const filteredCount = filteredPages.length;

  const handleSave = async () => {
    if (!clinicTypeId) return;

    try {
      setSaving(true);
      await pageService.assignPagesToClinicType(clinicTypeId, selectedPageIds);

      addToast({
        title: "Success",
        description: "Pages assigned successfully",
        color: "success",
      });
    } catch (error) {
      console.error("Error saving page assignments:", error);
      addToast({
        title: "Error",
        description: "Failed to save page assignments",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner label="Loading page data..." size="lg" />
      </div>
    );
  }

  if (!clinicType) {
    return (
      <Card className="max-w-lg mx-auto my-12 shadow-md">
        <CardHeader>
          <p className="text-xl font-semibold text-default-700">
            Clinic Type Not Found
          </p>
        </CardHeader>
        <CardBody>
          <div className="text-center py-6">
            <p className="text-default-500 mb-6">
              The requested clinic type could not be found.
            </p>
            <Button
              color="primary"
              size="lg"
              onClick={() => navigate("/admin/clinic-types")}
            >
              Back to Clinic Types
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className={title({ size: "sm" })}>
            Manage Pages for {clinicType.name}
          </h1>
          <p className="text-default-600 mt-1">
            Select which pages will be available for this clinic type
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            color="default"
            startContent={<IoArrowBackOutline />}
            variant="flat"
            onClick={() => navigate("/admin/clinic-types")}
          >
            Back
          </Button>
          <Button
            color="primary"
            isLoading={saving}
            startContent={!saving && <IoSaveOutline />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="shadow-sm border-none">
        <CardHeader className="bg-default-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Available Pages</p>
              <Chip color="primary" size="sm" variant="flat">
                {filteredCount} of {totalPages}
              </Chip>
              {assignedCount > 0 && (
                <Chip color="success" size="sm" variant="flat">
                  {assignedCount} assigned
                </Chip>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                color="default"
                size="sm"
                variant="flat"
                onClick={clearAllFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="p-6">
          {/* Search and Filter Row */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                isClearable
                className="w-full"
                placeholder="Search pages by name, description, or path..."
                startContent={<IoSearchOutline className="text-default-400" />}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              <Select
                className="w-40"
                label="Assignment"
                placeholder="All pages"
                selectedKeys={[assignmentFilter]}
                size="sm"
                startContent={<IoFilterOutline className="text-default-400" />}
                onSelectionChange={(keys) =>
                  setAssignmentFilter(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="all">All Pages</SelectItem>
                <SelectItem key="assigned">Assigned Only</SelectItem>
                <SelectItem key="unassigned">Unassigned Only</SelectItem>
              </Select>

              <Select
                className="w-40"
                label="Status"
                placeholder="All statuses"
                selectedKeys={[statusFilter]}
                size="sm"
                onSelectionChange={(keys) =>
                  setStatusFilter(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="all">All Statuses</SelectItem>
                <SelectItem key="active">Active Only</SelectItem>
                <SelectItem key="inactive">Inactive Only</SelectItem>
              </Select>

              <Select
                className="w-40"
                label="Auto-Assign"
                placeholder="All types"
                selectedKeys={[autoAssignFilter]}
                size="sm"
                onSelectionChange={(keys) =>
                  setAutoAssignFilter(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="auto">Auto-Assign</SelectItem>
                <SelectItem key="manual">Manual Assign</SelectItem>
              </Select>
            </div>
          </div>
          {/* Pages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.map((page) => (
              <Card
                key={page.id}
                className="shadow-none border border-default-200"
              >
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      isSelected={selectedPageIds.includes(page.id)}
                      onValueChange={() => handlePageToggle(page.id)}
                    />
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-sm text-default-500">
                        {page.description}
                      </p>
                      <p className="text-xs text-default-400 mt-1">
                        Path: {page.path}
                      </p>
                      {page.autoAssign && (
                        <p className="text-xs text-primary mt-1 font-medium">
                          (Auto-assigned)
                        </p>
                      )}
                      {!page.isActive && (
                        <p className="text-xs text-danger mt-1">(Inactive)</p>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}

            {/* Empty States */}
            {allPages.length === 0 && (
              <div className="col-span-full p-12 text-center">
                <p className="text-default-500">
                  No pages available. Please create pages first.
                </p>
              </div>
            )}

            {allPages.length > 0 && filteredPages.length === 0 && (
              <div className="col-span-full p-12 text-center">
                <p className="text-default-500 mb-4">
                  No pages match your current filters.
                </p>
                <Button
                  color="primary"
                  size="sm"
                  variant="flat"
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
