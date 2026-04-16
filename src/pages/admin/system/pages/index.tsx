// src/pages/admin/system/pages/index.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  IoAddOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoSearch,
  IoFilter,
} from "react-icons/io5";
import * as Icons from "react-icons/io5";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem } from "@/components/ui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Chip } from "@/components/ui/chip";
import { title } from "@/components/primitives";
import { addToast } from "@/components/ui/toast";
import { pageService } from "@/services/pageService";
import { Page } from "@/types/models";

// Popular icons for pages
const ICON_OPTIONS = [
  { value: "IoHomeOutline", label: "Home", icon: Icons.IoHomeOutline },
  { value: "IoPeopleOutline", label: "People", icon: Icons.IoPeopleOutline },
  {
    value: "IoCalendarOutline",
    label: "Calendar",
    icon: Icons.IoCalendarOutline,
  },
  { value: "IoPersonOutline", label: "Person", icon: Icons.IoPersonOutline },
  { value: "IoMedicalOutline", label: "Medical", icon: Icons.IoMedicalOutline },
  { value: "IoHeartOutline", label: "Heart", icon: Icons.IoHeartOutline },
  { value: "IoEyeOutline", label: "Eye", icon: Icons.IoEyeOutline },
  { value: "IoBodyOutline", label: "Body", icon: Icons.IoBodyOutline },
  {
    value: "IoThermometerOutline",
    label: "Thermometer",
    icon: Icons.IoThermometerOutline,
  },
  { value: "IoFlaskOutline", label: "Lab", icon: Icons.IoFlaskOutline },
  { value: "IoPulseOutline", label: "Pulse", icon: Icons.IoPulseOutline },
  {
    value: "IoMedkitOutline",
    label: "Medical Kit",
    icon: Icons.IoMedkitOutline,
  },
  { value: "IoFitnessOutline", label: "Fitness", icon: Icons.IoFitnessOutline },
  {
    value: "IoAccessibilityOutline",
    label: "Accessibility",
    icon: Icons.IoAccessibilityOutline,
  },
  { value: "IoBandageOutline", label: "Bandage", icon: Icons.IoBandageOutline },
  { value: "IoBarbell", label: "Exercise", icon: Icons.IoBarbell },
  { value: "IoBed", label: "Bed", icon: Icons.IoBed },
  {
    value: "IoPersonAddOutline",
    label: "Add Doctor",
    icon: Icons.IoPersonAddOutline,
  },
  {
    value: "IoPersonCircleOutline",
    label: "Doctor Profile",
    icon: Icons.IoPersonCircleOutline,
  },
  {
    value: "IoPeopleCircleOutline",
    label: "Medical Team",
    icon: Icons.IoPeopleCircleOutline,
  },
  { value: "IoIdCardOutline", label: "ID Card", icon: Icons.IoIdCardOutline },
  {
    value: "IoStarOutline",
    label: "Specialization",
    icon: Icons.IoStarOutline,
  },
  { value: "IoMedalOutline", label: "Awards", icon: Icons.IoMedalOutline },
  {
    value: "IoGlassesOutline",
    label: "Specialist",
    icon: Icons.IoGlassesOutline,
  },
  {
    value: "IoDocumentTextOutline",
    label: "Document",
    icon: Icons.IoDocumentTextOutline,
  },
  {
    value: "IoSettingsOutline",
    label: "Settings",
    icon: Icons.IoSettingsOutline,
  },
  {
    value: "IoStatsChartOutline",
    label: "Charts",
    icon: Icons.IoStatsChartOutline,
  },
  {
    value: "IoBusinessOutline",
    label: "Business",
    icon: Icons.IoBusinessOutline,
  },
  {
    value: "IoLocationOutline",
    label: "Location",
    icon: Icons.IoLocationOutline,
  },
  { value: "IoCallOutline", label: "Call", icon: Icons.IoCallOutline },
  { value: "IoMailOutline", label: "Mail", icon: Icons.IoMailOutline },
  { value: "IoTimeOutline", label: "Time", icon: Icons.IoTimeOutline },
  { value: "IoBagOutline", label: "Bag", icon: Icons.IoBagOutline },
  { value: "IoCardOutline", label: "Card", icon: Icons.IoCardOutline },
  {
    value: "IoClipboardOutline",
    label: "Clipboard",
    icon: Icons.IoClipboardOutline,
  },
  { value: "IoCogOutline", label: "Cog", icon: Icons.IoCogOutline },
  { value: "IoFolderOutline", label: "Folder", icon: Icons.IoFolderOutline },
  { value: "IoGiftOutline", label: "Gift", icon: Icons.IoGiftOutline },
  { value: "IoHeartOutline", label: "Heart", icon: Icons.IoHeartOutline },
  {
    value: "IoHelpCircleOutline",
    label: "Help",
    icon: Icons.IoHelpCircleOutline,
  },
  { value: "IoLibraryOutline", label: "Library", icon: Icons.IoLibraryOutline },
  {
    value: "IoNewspaperOutline",
    label: "News",
    icon: Icons.IoNewspaperOutline,
  },
  { value: "IoRibbonOutline", label: "Ribbon", icon: Icons.IoRibbonOutline },
  { value: "IoSchoolOutline", label: "School", icon: Icons.IoSchoolOutline },
  { value: "IoShieldOutline", label: "Shield", icon: Icons.IoShieldOutline },
  {
    value: "IoStorefrontOutline",
    label: "Store",
    icon: Icons.IoStorefrontOutline,
  },
  {
    value: "IoTrendingUpOutline",
    label: "Trending",
    icon: Icons.IoTrendingUpOutline,
  },
  { value: "IoWalletOutline", label: "Wallet", icon: Icons.IoWalletOutline },
];

export default function SystemPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [parentFilter, setParentFilter] = useState<string>("all");
  const [autoAssignFilter, setAutoAssignFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    description: "",
    icon: "",
    order: 0,
    isActive: true,
    autoAssign: false,
    showInSidebar: true,
    parentId: "",
  });

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    let filtered = pages;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (page) =>
          page.name.toLowerCase().includes(query) ||
          page.path.toLowerCase().includes(query) ||
          (page.description && page.description.toLowerCase().includes(query)),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((page) =>
        statusFilter === "active" ? page.isActive : !page.isActive,
      );
    }

    if (parentFilter !== "all") {
      if (parentFilter === "root") {
        filtered = filtered.filter((page) => !page.parentId);
      } else if (parentFilter === "sub") {
        filtered = filtered.filter((page) => !!page.parentId);
      }
    }

    if (autoAssignFilter !== "all") {
      filtered = filtered.filter((page) =>
        autoAssignFilter === "yes" ? page.autoAssign : !page.autoAssign,
      );
    }

    setFilteredPages(filtered);
    setPage(1);
  }, [pages, searchQuery, statusFilter, parentFilter, autoAssignFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / rowsPerPage));
  const paginatedPages = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filteredPages.slice(start, start + rowsPerPage);
  }, [filteredPages, page, rowsPerPage]);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const pagesData = await pageService.getAllPages();

      setPages(pagesData);
    } catch (error) {
      console.error("Error fetching pages:", error);
      addToast({
        title: "Error",
        description: "Failed to load pages",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setParentFilter("all");
    setAutoAssignFilter("all");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) : value,
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const openAddModal = () => {
    setCurrentPage(null);
    const rootPages = pages.filter((p) => !p.parentId);
    const nextRootOrder =
      rootPages.length > 0 ? Math.max(...rootPages.map((p) => p.order)) + 1 : 1;

    setFormData({
      name: "",
      path: "",
      description: "",
      icon: "",
      order: nextRootOrder,
      isActive: true,
      autoAssign: false,
      showInSidebar: true,
      parentId: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (page: Page) => {
    setCurrentPage(page);
    setFormData({
      name: page.name,
      path: page.path,
      description: page.description || "",
      icon: page.icon || "",
      order: page.order,
      isActive: page.isActive,
      autoAssign: page.autoAssign || false,
      showInSidebar:
        page.showInSidebar !== undefined ? page.showInSidebar : true,
      parentId: page.parentId || "",
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (page: Page) => {
    setCurrentPage(page);
    setIsDeleteModalOpen(true);
  };

  const adjustPageOrders = async (
    newOrder: number,
    parentId: string | null,
    excludePageId?: string,
  ) => {
    if (parentId !== null) return;

    const pagesToAdjust = pages.filter((page) => {
      const isRootPage = !page.parentId;
      const notCurrentPage = !excludePageId || page.id !== excludePageId;
      const needsAdjustment = page.order >= newOrder;

      return isRootPage && notCurrentPage && needsAdjustment;
    });

    if (pagesToAdjust.length > 0) {
      for (const page of pagesToAdjust) {
        await pageService.updatePage(page.id, { order: page.order + 1 });
      }

      addToast({
        title: "Order Adjusted",
        description: `${pagesToAdjust.length} existing page(s) were automatically re-ordered to make space.`,
        color: "primary",
      });
    }
  };

  const movePageToNewOrder = async (
    pageId: string,
    currentOrder: number,
    newOrder: number,
    parentId: string | null,
  ) => {
    if (parentId !== null) return;

    if (currentOrder === newOrder) return;

    const rootPages = pages.filter(
      (page) => !page.parentId && page.id !== pageId,
    );

    if (newOrder < currentOrder) {
      const pagesToIncrement = rootPages.filter(
        (page) => page.order >= newOrder && page.order < currentOrder,
      );

      for (const page of pagesToIncrement) {
        await pageService.updatePage(page.id, { order: page.order + 1 });
      }

      if (pagesToIncrement.length > 0) {
        addToast({
          title: "Order Adjusted",
          description: `${pagesToIncrement.length} page(s) were moved down to make space.`,
          color: "primary",
        });
      }
    } else {
      const pagesToDecrement = rootPages.filter(
        (page) => page.order > currentOrder && page.order <= newOrder,
      );

      for (const page of pagesToDecrement) {
        await pageService.updatePage(page.id, { order: page.order - 1 });
      }

      if (pagesToDecrement.length > 0) {
        addToast({
          title: "Order Adjusted",
          description: `${pagesToDecrement.length} page(s) were moved up to fill the gap.`,
          color: "primary",
        });
      }
    }
  };

  const compactPageOrders = async (
    deletedPageOrder: number,
    parentId: string | null,
  ) => {
    if (parentId !== null) return;

    const pagesToCompact = pages.filter((page) => {
      const isRootPage = !page.parentId;
      const needsCompaction = page.order > deletedPageOrder;

      return isRootPage && needsCompaction;
    });

    if (pagesToCompact.length > 0) {
      for (const page of pagesToCompact) {
        await pageService.updatePage(page.id, { order: page.order - 1 });
      }

      addToast({
        title: "Orders Compacted",
        description: `${pagesToCompact.length} page(s) were moved up to fill the gap.`,
        color: "primary",
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.path) {
      addToast({
        title: "Validation Error",
        description: "Name and path are required",
        color: "danger",
      });

      return;
    }

    if (formData.parentId && currentPage) {
      const wouldCreateCircularReference = (
        parentId: string,
        currentPageId: string,
      ): boolean => {
        if (parentId === currentPageId) return true;

        const parent = pages.find((p) => p.id === parentId);

        if (parent && parent.parentId) {
          return wouldCreateCircularReference(parent.parentId, currentPageId);
        }

        return false;
      };

      if (wouldCreateCircularReference(formData.parentId, currentPage.id)) {
        addToast({
          title: "Validation Error",
          description:
            "Cannot create circular reference: A page cannot be a sub-menu of its own child",
          color: "danger",
        });

        return;
      }
    }

    if (formData.parentId) {
      const parentPage = pages.find((p) => p.id === formData.parentId);

      if (parentPage && parentPage.parentId) {
        addToast({
          title: "Validation Error",
          description:
            "Sub-menus can only be 1 level deep. The selected parent is already a sub-menu.",
          color: "danger",
        });

        return;
      }
    }

    setIsLoading(true);
    try {
      if (currentPage) {
        const originalOrder = currentPage.order;
        const originalParentId = currentPage.parentId || null;
        const newOrder = formData.order;
        const newParentId = formData.parentId || null;

        if (originalOrder !== newOrder || originalParentId !== newParentId) {
          if (originalParentId !== newParentId) {
            if (originalParentId === null) {
              await compactPageOrders(originalOrder, originalParentId);
            }
            if (newParentId === null) {
              await adjustPageOrders(newOrder, newParentId, currentPage.id);
            }
          } else if (originalParentId === null && newParentId === null) {
            await movePageToNewOrder(
              currentPage.id,
              originalOrder,
              newOrder,
              newParentId,
            );
          }
        }

        await pageService.updatePage(currentPage.id, formData);
        addToast({
          title: "Success",
          description: "Page updated successfully",
          color: "success",
        });
      } else {
        let pageDataToCreate = { ...formData };

        if (formData.parentId) {
          const siblingSubPages = pages.filter(
            (p) => p.parentId === formData.parentId,
          );
          const nextSubPageOrder =
            siblingSubPages.length > 0
              ? Math.max(...siblingSubPages.map((p) => p.order)) + 1
              : 1;

          pageDataToCreate.order = nextSubPageOrder;
        } else {
          await adjustPageOrders(formData.order, null);
        }

        await pageService.createPage(pageDataToCreate);
        addToast({
          title: "Success",
          description: "Page created successfully",
          color: "success",
        });
      }

      setIsModalOpen(false);
      fetchPages();
    } catch (error) {
      console.error("Error saving page:", error);
      addToast({
        title: "Error",
        description: "Failed to save page",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPage) return;

    setIsLoading(true);
    try {
      const deletedPageOrder = currentPage.order;
      const deletedPageParentId = currentPage.parentId || null;

      await pageService.deletePage(currentPage.id);
      await compactPageOrders(deletedPageOrder, deletedPageParentId);

      addToast({
        title: "Success",
        description: "Page deleted successfully",
        color: "success",
      });
      setIsDeleteModalOpen(false);
      fetchPages();
    } catch (error) {
      console.error("Error deleting page:", error);
      addToast({
        title: "Error",
        description: "Failed to delete page",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseDeleteModal = () => setIsDeleteModalOpen(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className={title({ size: "sm" })}>System Pages</h1>
          <p className="text-mountain-600 mt-1">
            Manage pages that can be assigned to clinic types. Root pages have
            customizable order, sub-pages are automatically ordered.
          </p>
        </div>
        <Button
          color="primary"
          startContent={<IoAddOutline />}
          onClick={openAddModal}
        >
          Add New Page
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <IoFilter className="text-mountain-600" />
            Filter & Search
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                fullWidth
                placeholder="Search pages by name, path, or description..."
                size="sm"
                startContent={<IoSearch className="text-mountain-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                placeholder="Status"
                selectedKeys={[statusFilter]}
                size="sm"
                onSelectionChange={(keys) =>
                  setStatusFilter(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="inactive">Inactive</SelectItem>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select
                placeholder="Type"
                selectedKeys={[parentFilter]}
                size="sm"
                onSelectionChange={(keys) =>
                  setParentFilter(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="root">Root Pages</SelectItem>
                <SelectItem key="sub">Sub Pages</SelectItem>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select
                placeholder="Auto-Assign"
                selectedKeys={[autoAssignFilter]}
                size="sm"
                onSelectionChange={(keys) =>
                  setAutoAssignFilter(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="all">All</SelectItem>
                <SelectItem key="yes">Auto-Assign</SelectItem>
                <SelectItem key="no">Manual</SelectItem>
              </Select>
            </div>
            <Button
              color="primary"
              size="sm"
              startContent={<IoRefreshOutline />}
              variant="flat"
              onClick={clearFilters}
            >
              Reset Filters
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-mountain-600 px-1">
        <span>
          Showing {filteredPages.length} of {pages.length} pages
        </span>
        {(searchQuery ||
          statusFilter !== "all" ||
          parentFilter !== "all" ||
          autoAssignFilter !== "all") && (
          <span className="text-teal-700">Filters applied</span>
        )}
      </div>

      <Card>
        <CardHeader className="bg-mountain-50">
          <p className="font-semibold text-sm">Available Pages</p>
        </CardHeader>
        <CardBody className="p-0">
          <Table aria-label="Pages table">
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>PATH</TableColumn>
              <TableColumn>PARENT</TableColumn>
              <TableColumn>ORDER</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AUTO-ASSIGN</TableColumn>
              <TableColumn>SHOW IN SIDEBAR</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={
                <div className="text-center py-8">
                  <div className="text-mountain-400 mb-2">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    parentFilter !== "all" ||
                    autoAssignFilter !== "all"
                      ? "No pages match your search criteria"
                      : "No pages found"}
                  </div>
                  {(searchQuery ||
                    statusFilter !== "all" ||
                    parentFilter !== "all" ||
                    autoAssignFilter !== "all") && (
                    <Button
                      size="sm"
                      startContent={<IoRefreshOutline />}
                      variant="flat"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              }
              isLoading={isLoading}
            >
              {paginatedPages.map((pageItem) => {
                const parentPage = pages.find(
                  (p) => p.id === pageItem.parentId,
                );
                const isSubPage = !!pageItem.parentId;

                return (
                  <TableRow key={pageItem.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        {pageItem.icon &&
                          (() => {
                            const IconComponent = (Icons as any)[pageItem.icon];

                            return IconComponent ? (
                              <IconComponent className="w-5 h-5 mt-0.5 text-mountain-600 flex-shrink-0" />
                            ) : (
                              <div className="w-5 h-5 mt-0.5 bg-mountain-200 rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-mountain-500">
                                  ?
                                </span>
                              </div>
                            );
                          })()}
                        <div>
                          <p
                            className={`font-medium ${isSubPage ? "text-sm text-mountain-600" : ""}`}
                          >
                            {pageItem.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-mountain-100 px-2 py-1 rounded break-all max-w-xs inline-block">
                        {pageItem.path}
                      </code>
                    </TableCell>
                    <TableCell>
                      {parentPage ? (
                        <Chip color="secondary" size="sm" variant="flat">
                          {parentPage.name}
                        </Chip>
                      ) : (
                        <span className="text-xs text-mountain-400">
                          Root Page
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {parentPage ? (
                        <span className="text-xs text-mountain-500">-</span>
                      ) : (
                        <span className="font-medium">{pageItem.order}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={pageItem.isActive ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                      >
                        {pageItem.isActive ? "Active" : "Inactive"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={pageItem.autoAssign ? "primary" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {pageItem.autoAssign ? "Yes" : "No"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          pageItem.showInSidebar !== false
                            ? "success"
                            : "default"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {pageItem.showInSidebar !== false ? "Yes" : "No"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          color="primary"
                          size="sm"
                          variant="bordered"
                          onClick={() => openEditModal(pageItem)}
                        >
                          <IoCreateOutline />
                        </Button>
                        <Button
                          isIconOnly
                          color="danger"
                          size="sm"
                          variant="bordered"
                          onClick={() => openDeleteModal(pageItem)}
                        >
                          <IoTrashOutline />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-mountain-100">
          <div className="flex items-center gap-2 text-sm text-mountain-500">
            Rows per page:
            <Select
              aria-label="Rows per page"
              className="w-24"
              selectedKeys={[rowsPerPage.toString()]}
              size="sm"
              onSelectionChange={(keys) => {
                const value = parseInt(Array.from(keys)[0] as string, 10);

                setRowsPerPage(value || 10);
                setPage(1);
              }}
            >
              <SelectItem key="5">5</SelectItem>
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="20">20</SelectItem>
              <SelectItem key="50">50</SelectItem>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-mountain-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                isDisabled={page === 1}
                size="sm"
                variant="flat"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                isDisabled={page === totalPages}
                size="sm"
                variant="flat"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        scrollBehavior="inside"
        size="3xl"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader>{currentPage ? "Edit Page" : "Add Page"}</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div>
                <h3 className="text-base font-semibold text-mountain-700 mb-4 border-b border-mountain-200 pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    isRequired
                    description="The display name for this page"
                    label="Page Name"
                    name="name"
                    placeholder="e.g., Patient Management"
                    value={formData.name}
                    onChange={handleChange}
                  />

                  <Input
                    isRequired
                    description="The URL path for this page"
                    label="Page Path"
                    name="path"
                    placeholder="e.g., /dashboard/patients"
                    startContent={
                      <span className="text-mountain-400 text-sm">/</span>
                    }
                    value={formData.path}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Hierarchy Section */}
              <div>
                <h3 className="text-base font-semibold text-mountain-700 mb-4 border-b border-mountain-200 pb-2">
                  Navigation Hierarchy
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <Select
                    description="Choose a parent page to create a sub-menu item"
                    label="Parent Page"
                    placeholder="Select a parent page (optional)"
                    selectedKeys={formData.parentId ? [formData.parentId] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      const parentId = selectedKey || "";

                      setFormData((prev) => {
                        let newOrder = prev.order;

                        if (parentId) {
                          const siblingSubPages = pages.filter(
                            (p) => p.parentId === parentId,
                          );

                          newOrder =
                            siblingSubPages.length > 0
                              ? Math.max(
                                  ...siblingSubPages.map((p) => p.order),
                                ) + 1
                              : 1;
                        } else {
                          const rootPages = pages.filter((p) => !p.parentId);

                          newOrder =
                            rootPages.length > 0
                              ? Math.max(...rootPages.map((p) => p.order)) + 1
                              : 1;
                        }

                        return { ...prev, parentId, order: newOrder };
                      });
                    }}
                  >
                    {pages
                      .filter(
                        (pageItem) =>
                          !pageItem.parentId &&
                          (!currentPage || pageItem.id !== currentPage.id),
                      )
                      .map((pageItem) => (
                        <SelectItem key={pageItem.id}>
                          {pageItem.name}
                        </SelectItem>
                      ))}
                  </Select>

                  {formData.parentId && (
                    <div className="bg-teal-50 p-3 rounded border border-teal-200">
                      <p className="text-sm text-teal-700">
                        <strong>Sub-menu:</strong> This page will appear as a
                        sub-item under the selected parent page in the
                        navigation sidebar.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Appearance Section */}
              <div>
                <h3 className="text-base font-semibold text-mountain-700 mb-4 border-b border-mountain-200 pb-2">
                  Appearance
                </h3>

                {/* Icon Picker */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-mountain-800 block mb-2">
                    Icon
                  </label>
                  <div className="border border-mountain-200 rounded-lg p-3 bg-white">
                    {/* Selected Icon Preview */}
                    {formData.icon && (
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-mountain-100">
                        <span className="text-xs text-mountain-500">
                          Selected:
                        </span>
                        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded px-2 py-1">
                          {(() => {
                            const selectedOption = ICON_OPTIONS.find(
                              (opt) => opt.value === formData.icon,
                            );

                            if (selectedOption) {
                              const IconComp = selectedOption.icon;

                              return (
                                <>
                                  <IconComp className="w-5 h-5 text-teal-700" />
                                  <span className="text-sm font-medium text-teal-700">
                                    {selectedOption.label}
                                  </span>
                                </>
                              );
                            }

                            return null;
                          })()}
                        </div>
                        <button
                          className="ml-auto text-xs text-mountain-500 hover:text-red-600"
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, icon: "" }))
                          }
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {/* Icon Grid */}
                    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                      {ICON_OPTIONS.map((iconOption) => {
                        const IconComp = iconOption.icon;
                        const isSelected = formData.icon === iconOption.value;

                        return (
                          <button
                            key={iconOption.value}
                            className={`
                              flex flex-col items-center justify-center p-2 rounded transition-colors
                              ${
                                isSelected
                                  ? "bg-teal-100 border-2 border-teal-500 text-teal-700"
                                  : "bg-mountain-50 border border-mountain-200 text-mountain-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600"
                              }
                            `}
                            title={iconOption.label}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                icon: iconOption.value,
                              }))
                            }
                          >
                            <IconComp className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-mountain-500 mt-1">
                    Click an icon to select it for navigation
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!formData.parentId && (
                    <Input
                      description="Order in navigation for root-level pages (lower numbers appear first). When creating: pages with this order and higher will be automatically moved down. When editing: pages will be automatically rearranged to maintain sequence."
                      label="Display Order"
                      name="order"
                      placeholder="1"
                      type="number"
                      value={formData.order.toString()}
                      onChange={handleChange}
                    />
                  )}

                  {formData.parentId && (
                    <div className="bg-teal-50 p-3 rounded border border-teal-200">
                      <p className="text-sm text-teal-700">
                        <strong>Sub-page ordering:</strong> Sub-pages are
                        automatically assigned sequential order numbers within
                        their parent. The order is managed automatically - no
                        manual configuration needed.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Textarea
                    label="Description"
                    name="description"
                    placeholder="Brief description of what this page does..."
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-mountain-500 mt-1">
                    Optional description for this page
                  </p>
                </div>
              </div>

              {/* Settings Section */}
              <div>
                <h3 className="text-base font-semibold text-mountain-700 mb-4 border-b border-mountain-200 pb-2">
                  Settings
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Settings */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-mountain-600 mb-2">
                        Status
                      </h4>
                      <Checkbox
                        isSelected={formData.isActive}
                        onValueChange={(checked) =>
                          handleCheckboxChange("isActive", checked)
                        }
                      >
                        <div>
                          <span className="text-sm font-medium text-mountain-700">
                            Active
                          </span>
                          <p className="text-xs text-mountain-500">
                            Page is available for assignment to clinic types
                          </p>
                        </div>
                      </Checkbox>
                    </div>

                    {/* Navigation Settings */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-mountain-600 mb-2">
                        Navigation
                      </h4>
                      <Checkbox
                        isSelected={formData.showInSidebar}
                        onValueChange={(checked) =>
                          handleCheckboxChange("showInSidebar", checked)
                        }
                      >
                        <div>
                          <span className="text-sm font-medium text-mountain-700">
                            Show in sidebar
                          </span>
                          <p className="text-xs text-mountain-500">
                            Display this page in the navigation sidebar
                          </p>
                        </div>
                      </Checkbox>
                    </div>
                  </div>

                  {/* Auto-assign Setting */}
                  <div className="bg-teal-50 p-4 rounded border border-teal-200">
                    <Checkbox
                      isSelected={formData.autoAssign}
                      onValueChange={(checked) =>
                        handleCheckboxChange("autoAssign", checked)
                      }
                    >
                      <div>
                        <span className="text-sm font-medium text-mountain-700">
                          Auto-assign to new clinic types
                        </span>
                        <p className="text-xs text-mountain-500 mt-1">
                          When enabled, this page will be automatically assigned
                          to any new clinic types that are created in the
                          future. This is useful for core pages that all clinics
                          should have access to.
                        </p>
                      </div>
                    </Checkbox>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="bordered"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button color="primary" isLoading={isLoading} onClick={handleSave}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal}>
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete the page{" "}
              <strong>{currentPage?.name}</strong>?
            </p>
            <p className="text-sm text-mountain-500 mt-2">
              This will also remove this page from all clinic types that have it
              assigned.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="bordered"
              onClick={handleCloseDeleteModal}
            >
              Cancel
            </Button>
            <Button color="danger" isLoading={isLoading} onClick={handleDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
