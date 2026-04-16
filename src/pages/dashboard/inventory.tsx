import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { format } from "date-fns";
import {
  IoAdd,
  IoSearch,
  IoCreate,
  IoCheckmark,
  IoTime,
  IoWarning,
  IoArrowForward,
} from "react-icons/io5";

import { useAuth } from "@/hooks/useAuth";
import { useModalState } from "@/hooks/useModalState";
import { useTheme } from "@/context/ThemeContext";

// Services
import { itemService } from "@/services/itemService";
import { itemCategoryService } from "@/services/itemCategoryService";
import { issuedItemService } from "@/services/issuedItemService";

// Types
import { Item, ItemCategory, IssuedItem } from "@/types/models";

// Icons

import { title } from "@/components/primitives";

export default function InventoryPage() {
  const { currentUser, userData, clinicId } = useAuth();
  const { themeConfig, isDark } = useTheme();

  // Get branchId from userData
  const branchId = userData?.branchId || userData?.clinicId || clinicId;

  // State management
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("items");

  // Modal states
  const itemModalState = useModalState(false);
  const categoryModalState = useModalState(false);
  const issueModalState = useModalState(false);
  const returnModalState = useModalState(false);

  // Form states
  const [itemForm, setItemForm] = useState({
    id: "",
    name: "",
    category: "",
    quantity: 0,
    description: "",
    unit: "",
    barcode: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    description: "",
  });

  const [issueForm, setIssueForm] = useState({
    itemId: "",
    quantity: 0,
    issuedTo: "",
    expectedReturnDate: null as Date | null,
    notes: "",
  });

  const [selectedIssuedItem, setSelectedIssuedItem] =
    useState<IssuedItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Theme-aware classes
  const getThemeClasses = () => {
    const themeVariant = themeConfig.id;

    return {
      mainCard: isDark
        ? "bg-default-100"
        : "bg-white border border-default-200",
      tableHeader: isDark ? "bg-default-200" : "bg-nepal-50",
      tableRow: isDark ? "hover:bg-default-200" : "hover:bg-nepal-50",
      input: isDark ? "bg-default-100" : "bg-white",
      modal: isDark ? "bg-default-100" : "bg-white",
    };
  };

  const themeClasses = getThemeClasses();

  // Load data
  useEffect(() => {
    loadInventoryData();
  }, [clinicId, branchId]);

  const loadInventoryData = async () => {
    if (!clinicId || !branchId) return;

    try {
      setLoading(true);
      const [itemsData, categoriesData, issuedItemsData] = await Promise.all([
        itemService.getItemsByClinic(clinicId, branchId),
        itemCategoryService.getCategoriesByClinic(clinicId, branchId),
        issuedItemService.getIssuedItemsByClinic(clinicId, branchId),
      ]);

      setItems(itemsData);
      setCategories(categoriesData);
      setIssuedItems(issuedItemsData);
    } catch (error) {
      console.error("Error loading inventory data:", error);
      addToast({
        title: "Error",
        description: "Failed to load inventory data",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredIssuedItems = issuedItems.filter(
    (item) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.issuedTo?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handle item operations
  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.category || itemForm.quantity < 0) {
      addToast({
        title: "Error",
        description:
          "Please fill in all required fields and ensure quantity is not negative",
        color: "danger",
      });

      return;
    }

    try {
      const itemData = {
        name: itemForm.name,
        category: itemForm.category,
        description: itemForm.description,
        unit: itemForm.unit,
        barcode: itemForm.barcode,
        quantity: itemForm.quantity, // Include quantity in the data
        salePrice: 0, // Default sale price since we're not tracking prices in the UI
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdBy: currentUser?.uid || "",
      };

      if (isEditing) {
        await itemService.updateItem(itemForm.id, itemData);
        addToast({
          title: "Success",
          description: "Item updated successfully",
          color: "success",
        });
      } else {
        await itemService.createItem(itemData);
        addToast({
          title: "Success",
          description: "Item created successfully",
          color: "success",
        });
      }

      itemModalState.forceClose();
      loadInventoryData();
      resetItemForm();
    } catch (error) {
      console.error("Error saving item:", error);
      addToast({
        title: "Error",
        description: "Failed to save item",
        color: "danger",
      });
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      addToast({
        title: "Error",
        description: "Please enter category name",
        color: "danger",
      });

      return;
    }

    try {
      const categoryData = {
        ...categoryForm,
        clinicId: clinicId!,
        branchId: branchId!,
        isActive: true,
        createdBy: currentUser?.uid || "",
      };

      if (isEditing) {
        await itemCategoryService.updateCategory(categoryForm.id, categoryData);
        addToast({
          title: "Success",
          description: "Category updated successfully",
          color: "success",
        });
      } else {
        await itemCategoryService.createCategory(categoryData);
        addToast({
          title: "Success",
          description: "Category created successfully",
          color: "success",
        });
      }

      categoryModalState.forceClose();
      loadInventoryData();
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

  const handleIssueItem = async () => {
    if (!issueForm.itemId || !issueForm.quantity || issueForm.quantity <= 0) {
      addToast({
        title: "Error",
        description:
          "Please fill in all required fields and ensure quantity is greater than 0",
        color: "danger",
      });

      return;
    }

    try {
      const selectedItem = items.find((item) => item.id === issueForm.itemId);

      if (!selectedItem) {
        addToast({
          title: "Error",
          description: "Selected item not found",
          color: "danger",
        });

        return;
      }

      // Check if there's enough quantity available
      if (selectedItem.quantity < issueForm.quantity) {
        addToast({
          title: "Error",
          description: `Insufficient quantity. Available: ${selectedItem.quantity}, Requested: ${issueForm.quantity}`,
          color: "danger",
        });

        return;
      }

      const issuedItemData = {
        itemId: issueForm.itemId,
        itemName: selectedItem.name,
        itemCategory: selectedItem.category,
        quantity: issueForm.quantity,
        issuedDate: new Date(),
        expectedReturnDate: issueForm.expectedReturnDate,
        status: "issued" as const,
        issuedTo: issueForm.issuedTo,
        issuedBy: currentUser?.uid || "",
        notes: issueForm.notes,
        clinicId: clinicId!,
        branchId: branchId!,
      };

      await issuedItemService.issueItem(issuedItemData);

      // Update the item quantity by reducing the issued quantity
      const updatedItemData = {
        ...selectedItem,
        quantity: selectedItem.quantity - issueForm.quantity,
      };

      await itemService.updateItem(selectedItem.id, updatedItemData);

      addToast({
        title: "Success",
        description: "Item issued successfully",
        color: "success",
      });

      issueModalState.forceClose();
      loadInventoryData();
      resetIssueForm();
    } catch (error) {
      console.error("Error issuing item:", error);
      addToast({
        title: "Error",
        description: "Failed to issue item",
        color: "danger",
      });
    }
  };

  const handleReturnItem = async () => {
    if (!selectedIssuedItem) return;

    try {
      await issuedItemService.returnItem(
        selectedIssuedItem.id,
        currentUser?.uid || "",
      );

      // Find the original item and increase its quantity
      const originalItem = items.find(
        (item) => item.id === selectedIssuedItem.itemId,
      );

      if (originalItem) {
        const updatedItemData = {
          ...originalItem,
          quantity: originalItem.quantity + selectedIssuedItem.quantity,
        };

        await itemService.updateItem(originalItem.id, updatedItemData);
      }

      addToast({
        title: "Success",
        description: "Item returned successfully",
        color: "success",
      });

      returnModalState.forceClose();
      loadInventoryData();
      setSelectedIssuedItem(null);
    } catch (error) {
      console.error("Error returning item:", error);
      addToast({
        title: "Error",
        description: "Failed to return item",
        color: "danger",
      });
    }
  };

  // Reset forms
  const resetItemForm = () => {
    setItemForm({
      id: "",
      name: "",
      category: "",
      quantity: 0,
      description: "",
      unit: "",
      barcode: "",
    });
    setIsEditing(false);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      id: "",
      name: "",
      description: "",
    });
    setIsEditing(false);
  };

  const resetIssueForm = () => {
    setIssueForm({
      itemId: "",
      quantity: 0,
      issuedTo: "",
      expectedReturnDate: null,
      notes: "",
    });
  };

  // Edit functions
  const editItem = (item: Item) => {
    setItemForm({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity || 0, // Use the actual quantity from the item
      description: item.description || "",
      unit: item.unit || "",
      barcode: item.barcode || "",
    });
    setIsEditing(true);
    itemModalState.open();
  };

  const editCategory = (category: ItemCategory) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description || "",
    });
    setIsEditing(true);
    categoryModalState.open();
  };

  const openReturnModal = (issuedItem: IssuedItem) => {
    setSelectedIssuedItem(issuedItem);
    returnModalState.open();
  };

  // Status chip colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "issued":
        return "primary";
      case "returned":
        return "success";
      case "overdue":
        return "danger";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner label="Loading inventory..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title()}>Inventory Management</h1>
          <p className="text-default-500 mt-2">
            Manage your clinic's inventory items, categories, and issued items
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card className={themeClasses.mainCard}>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Input
              className="w-80"
              placeholder="Search inventory..."
              startContent={<IoSearch />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardBody>
          <Tabs
            className="w-full"
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            {/* Items Tab */}
            <Tab key="items" title="Items">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-default-500">
                    Total Items: {filteredItems.length}
                  </p>
                  <Button
                    color="primary"
                    startContent={<IoAdd />}
                    onPress={() => {
                      resetItemForm();
                      itemModalState.open();
                    }}
                  >
                    Add Item
                  </Button>
                </div>

                {filteredItems.length > 0 ? (
                  <Table aria-label="Items table">
                    <TableHeader>
                      <TableColumn>NAME</TableColumn>
                      <TableColumn>CATEGORY</TableColumn>
                      <TableColumn>QUANTITY</TableColumn>
                      <TableColumn>CREATED ON</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-default-500">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip color="primary" size="sm" variant="flat">
                              {item.category}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={item.quantity > 0 ? "success" : "danger"}
                              size="sm"
                              variant="flat"
                            >
                              {item.quantity || 0}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            {format(item.createdAt, "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                color="primary"
                                size="sm"
                                startContent={<IoCreate />}
                                variant="flat"
                                onPress={() => editItem(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                color="secondary"
                                isDisabled={item.quantity === 0}
                                size="sm"
                                startContent={<IoArrowForward />}
                                variant="flat"
                                onPress={() => {
                                  setIssueForm({
                                    ...issueForm,
                                    itemId: item.id,
                                  });
                                  issueModalState.open();
                                }}
                              >
                                Issue
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto">
                        <IoAdd className="w-8 h-8 text-default-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-default-700 mb-2">
                          {searchQuery ? "No items found" : "No items yet"}
                        </h3>
                        <p className="text-sm text-default-500 max-w-sm">
                          {searchQuery
                            ? `No items match your search "${searchQuery}". Try adjusting your search terms.`
                            : "Start building your inventory by adding your first item."}
                        </p>
                      </div>
                      {!searchQuery && (
                        <Button
                          color="primary"
                          startContent={<IoAdd />}
                          onPress={() => {
                            resetItemForm();
                            itemModalState.open();
                          }}
                        >
                          Add Your First Item
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            {/* Categories Tab */}
            <Tab key="categories" title="Item Categories">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-default-500">
                    Total Categories: {filteredCategories.length}
                  </p>
                  <Button
                    color="primary"
                    startContent={<IoAdd />}
                    onPress={() => {
                      resetCategoryForm();
                      categoryModalState.open();
                    }}
                  >
                    Add Category
                  </Button>
                </div>

                {filteredCategories.length > 0 ? (
                  <Table aria-label="Categories table">
                    <TableHeader>
                      <TableColumn>CATEGORY NAME</TableColumn>
                      <TableColumn>DESCRIPTION</TableColumn>
                      <TableColumn>ITEMS COUNT</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <p className="font-medium">{category.name}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-default-500">
                              {category.description || "No description"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Chip color="primary" size="sm" variant="flat">
                              {
                                items.filter(
                                  (item) => item.category === category.name,
                                ).length
                              }
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Button
                              color="primary"
                              size="sm"
                              startContent={<IoCreate />}
                              variant="flat"
                              onPress={() => editCategory(category)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto">
                        <IoAdd className="w-8 h-8 text-default-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-default-700 mb-2">
                          {searchQuery
                            ? "No categories found"
                            : "No categories yet"}
                        </h3>
                        <p className="text-sm text-default-500 max-w-sm">
                          {searchQuery
                            ? `No categories match your search "${searchQuery}". Try adjusting your search terms.`
                            : "Organize your inventory by creating item categories first."}
                        </p>
                      </div>
                      {!searchQuery && (
                        <Button
                          color="primary"
                          startContent={<IoAdd />}
                          onPress={() => {
                            resetCategoryForm();
                            categoryModalState.open();
                          }}
                        >
                          Create Your First Category
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            {/* Issued Items Tab */}
            <Tab key="issued" title="Issued Items">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-default-500">
                    Total Issued Items: {filteredIssuedItems.length}
                  </p>
                  <Button
                    color="primary"
                    startContent={<IoAdd />}
                    onPress={() => {
                      resetIssueForm();
                      issueModalState.open();
                    }}
                  >
                    Issue Item
                  </Button>
                </div>

                {filteredIssuedItems.length > 0 ? (
                  <Table aria-label="Issued items table">
                    <TableHeader>
                      <TableColumn>ITEM NAME</TableColumn>
                      <TableColumn>CATEGORY</TableColumn>
                      <TableColumn>QUANTITY</TableColumn>
                      <TableColumn>ISSUED DATE</TableColumn>
                      <TableColumn>RETURN DATE</TableColumn>
                      <TableColumn>ISSUED TO</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredIssuedItems.map((issuedItem) => (
                        <TableRow key={issuedItem.id}>
                          <TableCell>
                            <p className="font-medium">{issuedItem.itemName}</p>
                          </TableCell>
                          <TableCell>
                            <Chip color="primary" size="sm" variant="flat">
                              {issuedItem.itemCategory}
                            </Chip>
                          </TableCell>
                          <TableCell>{issuedItem.quantity}</TableCell>
                          <TableCell>
                            {format(issuedItem.issuedDate, "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            {issuedItem.returnDate
                              ? format(issuedItem.returnDate, "MMM dd, yyyy")
                              : issuedItem.expectedReturnDate
                                ? `Expected: ${format(issuedItem.expectedReturnDate, "MMM dd, yyyy")}`
                                : "N/A"}
                          </TableCell>
                          <TableCell>{issuedItem.issuedTo || "N/A"}</TableCell>
                          <TableCell>
                            <Chip
                              color={getStatusColor(issuedItem.status)}
                              size="sm"
                              startContent={
                                issuedItem.status === "issued" ? (
                                  <IoTime />
                                ) : issuedItem.status === "returned" ? (
                                  <IoCheckmark />
                                ) : (
                                  <IoWarning />
                                )
                              }
                              variant="flat"
                            >
                              {issuedItem.status.charAt(0).toUpperCase() +
                                issuedItem.status.slice(1)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            {issuedItem.status === "issued" && (
                              <Button
                                color="success"
                                size="sm"
                                startContent={<IoCheckmark />}
                                variant="flat"
                                onPress={() => openReturnModal(issuedItem)}
                              >
                                Return
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto">
                        <IoArrowForward className="w-8 h-8 text-default-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-default-700 mb-2">
                          {searchQuery
                            ? "No issued items found"
                            : "No issued items yet"}
                        </h3>
                        <p className="text-sm text-default-500 max-w-sm">
                          {searchQuery
                            ? `No issued items match your search "${searchQuery}". Try adjusting your search terms.`
                            : items.length > 0
                              ? "Start tracking item usage by issuing items to staff or departments."
                              : "Add some items to your inventory first before you can issue them."}
                        </p>
                      </div>
                      {!searchQuery && items.length > 0 && (
                        <Button
                          color="primary"
                          startContent={<IoArrowForward />}
                          onPress={() => {
                            resetIssueForm();
                            issueModalState.open();
                          }}
                        >
                          Issue Your First Item
                        </Button>
                      )}
                      {!searchQuery && items.length === 0 && (
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={() => setSelectedTab("items")}
                        >
                          Go to Items Tab
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Add/Edit Item Modal */}
      <Modal
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={itemModalState.isOpen}
        size="2xl"
        onClose={itemModalState.close}
      >
        <ModalContent>
          <ModalHeader>{isEditing ? "Edit Item" : "Add New Item"}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isRequired
                label="Item Name"
                placeholder="Enter item name"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
              />
              <Select
                isRequired
                disallowEmptySelection={false}
                label="Category"
                placeholder="Select category"
                popoverProps={{
                  placement: "bottom",
                  triggerType: "listbox",
                  offset: 10,
                }}
                selectedKeys={
                  itemForm.category ? new Set([itemForm.category]) : new Set()
                }
                onSelectionChange={(keys) => {
                  itemModalState.handleDropdownInteraction();
                  const selectedKey = Array.from(keys)[0] as string;

                  setItemForm({ ...itemForm, category: selectedKey || "" });
                }}
              >
                {categories.map((category) => (
                  <SelectItem key={category.name}>{category.name}</SelectItem>
                ))}
              </Select>
              <Input
                isRequired
                label="Quantity"
                min="0"
                placeholder="Enter quantity"
                type="number"
                value={itemForm.quantity.toString()}
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="Unit"
                placeholder="e.g., piece, box, bottle"
                value={itemForm.unit}
                onChange={(e) =>
                  setItemForm({ ...itemForm, unit: e.target.value })
                }
              />
              <Input
                label="Barcode"
                placeholder="Enter barcode"
                value={itemForm.barcode}
                onChange={(e) =>
                  setItemForm({ ...itemForm, barcode: e.target.value })
                }
              />
            </div>
            <Textarea
              label="Description"
              placeholder="Enter item description"
              value={itemForm.description}
              onChange={(e) =>
                setItemForm({ ...itemForm, description: e.target.value })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={itemModalState.forceClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveItem}>
              {isEditing ? "Update" : "Add"} Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add/Edit Category Modal */}
      <Modal
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={categoryModalState.isOpen}
        onClose={categoryModalState.close}
      >
        <ModalContent>
          <ModalHeader>
            {isEditing ? "Edit Category" : "Add New Category"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Category Name"
                placeholder="Enter category name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
              />
              <Textarea
                label="Description"
                placeholder="Enter category description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={categoryModalState.forceClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveCategory}>
              {isEditing ? "Update" : "Add"} Category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Issue Item Modal */}
      <Modal
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={issueModalState.isOpen}
        onClose={issueModalState.close}
      >
        <ModalContent>
          <ModalHeader>Issue Item</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                isRequired
                disallowEmptySelection={false}
                label="Select Item"
                placeholder="Choose item to issue"
                popoverProps={{
                  placement: "bottom",
                  triggerType: "listbox",
                  offset: 10,
                }}
                selectedKeys={
                  issueForm.itemId ? new Set([issueForm.itemId]) : new Set()
                }
                onSelectionChange={(keys) => {
                  issueModalState.handleDropdownInteraction();
                  const selectedKey = Array.from(keys)[0] as string;

                  setIssueForm({ ...issueForm, itemId: selectedKey || "" });
                }}
              >
                {items
                  .filter((item) => item.quantity > 0)
                  .map((item) => (
                    <SelectItem
                      key={item.id}
                      textValue={`${item.name} (${item.category}) - Available: ${item.quantity}`}
                    >
                      {item.name} ({item.category}) - Available: {item.quantity}
                    </SelectItem>
                  ))}
              </Select>
              <Input
                isRequired
                label="Quantity"
                max={
                  issueForm.itemId
                    ? items.find((item) => item.id === issueForm.itemId)
                        ?.quantity || 0
                    : undefined
                }
                min="1"
                placeholder="Enter quantity"
                type="number"
                value={issueForm.quantity.toString()}
                onChange={(e) =>
                  setIssueForm({
                    ...issueForm,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
              />
              {issueForm.itemId && (
                <div className="col-span-full">
                  <p className="text-sm text-default-500">
                    Available quantity:{" "}
                    {items.find((item) => item.id === issueForm.itemId)
                      ?.quantity || 0}
                  </p>
                </div>
              )}
              <Input
                label="Issued To"
                placeholder="Person or department"
                value={issueForm.issuedTo}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, issuedTo: e.target.value })
                }
              />
              <Input
                label="Expected Return Date"
                type="date"
                value={
                  issueForm.expectedReturnDate
                    ? issueForm.expectedReturnDate.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setIssueForm({
                    ...issueForm,
                    expectedReturnDate: e.target.value
                      ? new Date(e.target.value)
                      : null,
                  })
                }
              />
              <Textarea
                label="Notes"
                placeholder="Additional notes"
                value={issueForm.notes}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, notes: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={issueModalState.forceClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleIssueItem}>
              Issue Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Return Item Modal */}
      <Modal
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={returnModalState.isOpen}
        onClose={returnModalState.close}
      >
        <ModalContent>
          <ModalHeader>Return Item</ModalHeader>
          <ModalBody>
            {selectedIssuedItem && (
              <div className="space-y-4">
                <p className="text-sm text-default-500">
                  Are you sure you want to mark this item as returned?
                </p>
                <div className="bg-default-100 p-4 rounded-lg">
                  <p>
                    <strong>Item:</strong> {selectedIssuedItem.itemName}
                  </p>
                  <p>
                    <strong>Category:</strong> {selectedIssuedItem.itemCategory}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {selectedIssuedItem.quantity}
                  </p>
                  <p>
                    <strong>Issued To:</strong> {selectedIssuedItem.issuedTo}
                  </p>
                  <p>
                    <strong>Issued Date:</strong>{" "}
                    {format(selectedIssuedItem.issuedDate, "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={returnModalState.forceClose}>
              Cancel
            </Button>
            <Button color="success" onPress={handleReturnItem}>
              Confirm Return
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
