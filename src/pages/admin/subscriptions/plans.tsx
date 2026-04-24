import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoAddOutline,
  IoTrashOutline,
  IoCloseOutline,
  IoArrowBackOutline,
  IoSaveOutline,
  IoSettingsOutline,
  IoAlertCircleOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoSearchOutline,
  IoLayersOutline,
  IoCloseCircleOutline,
  IoFilterOutline,
  IoCreateOutline,
  IoListOutline,
  IoStatsChartOutline,
} from "react-icons/io5";

import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Input,
  Textarea,
  Spinner,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui";
import { title } from "@/components/primitives";
import { subscriptionService } from "@/services/subscriptionService";
import { SubscriptionPlan } from "@/types/models";

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // New plan modal
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlan>>({
    name: "",
    description: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    discountedMonthlyPrice: 0,
    discountedYearlyPrice: 0,
    features: [],
    maxUsers: 10,
    maxPatients: 100,
    storageLimitGB: 5,
    isActive: true,
  });
  const [newFeature, setNewFeature] = useState<string>("");

  // Edit mode for existing plans
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SubscriptionPlan> | null>(
    null,
  );
  const [tempFeature, setTempFeature] = useState<string>("");

  // Delete plan confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const onOpenDeleteModal = () => setIsDeleteModalOpen(true);
  const onCloseDeleteModal = () => setIsDeleteModalOpen(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Load subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const data = await subscriptionService.getAllSubscriptionPlans();

        setPlans(data);
        setAllPlans(data);
      } catch (err) {
        console.error("Error fetching subscription plans:", err);
        setError("Failed to load subscription plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Handle adding a new feature to the plan being created
  const handleAddFeature = () => {
    if (newFeature.trim() !== "") {
      setNewPlan({
        ...newPlan,
        features: [...(newPlan.features || []), newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  // Handle removing a feature from the plan being created
  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...(newPlan.features || [])];

    updatedFeatures.splice(index, 1);
    setNewPlan({
      ...newPlan,
      features: updatedFeatures,
    });
  };

  // Create new subscription plan
  const handleCreatePlan = async () => {
    try {
      if (!newPlan.name || !newPlan.description) {
        setError("Name and description are required");

        return;
      }

      const planId = await subscriptionService.createSubscriptionPlan(newPlan);
      const createdPlan =
        await subscriptionService.getSubscriptionPlanById(planId);

      if (createdPlan) {
        setPlans([...plans, createdPlan]);
        setAllPlans([...allPlans, createdPlan]);
      }

      onClose();
      setNewPlan({
        name: "",
        description: "",
        monthlyPrice: 0,
        yearlyPrice: 0,
        discountedMonthlyPrice: 0,
        discountedYearlyPrice: 0,
        features: [],
        maxUsers: 10,
        maxPatients: 100,
        storageLimitGB: 5,
        isActive: true,
      });
      setNewFeature("");
    } catch (err) {
      console.error("Error creating subscription plan:", err);
      setError("Failed to create subscription plan");
    }
  };

  // Start editing a plan
  const startEditMode = (plan: SubscriptionPlan) => {
    setEditModeId(plan.id);
    setEditData({ ...plan });
  };

  // Cancel editing
  const cancelEditMode = () => {
    setEditModeId(null);
    setEditData(null);
    setTempFeature("");
  };

  // Handle add feature in edit mode
  const handleAddFeatureInEditMode = () => {
    if (tempFeature.trim() !== "" && editData) {
      setEditData({
        ...editData,
        features: [...(editData.features || []), tempFeature.trim()],
      });
      setTempFeature("");
    }
  };

  // Handle remove feature in edit mode
  const handleRemoveFeatureInEditMode = (index: number) => {
    if (editData) {
      const updatedFeatures = [...(editData.features || [])];

      updatedFeatures.splice(index, 1);
      setEditData({
        ...editData,
        features: updatedFeatures,
      });
    }
  };

  // Save edited plan
  const handleSaveEdit = async () => {
    try {
      if (editModeId && editData) {
        await subscriptionService.updateSubscriptionPlan(editModeId, editData);

        // Update local state
        setPlans(
          plans.map((plan) =>
            plan.id === editModeId ? { ...plan, ...editData } : plan,
          ),
        );
        setAllPlans(
          allPlans.map((plan) =>
            plan.id === editModeId ? { ...plan, ...editData } : plan,
          ),
        );
        setEditModeId(null);
        setEditData(null);
      }
    } catch (err) {
      console.error("Error updating subscription plan:", err);
      setError("Failed to update subscription plan");
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (planId: string) => {
    setPlanToDelete(planId);
    onOpenDeleteModal();
  };

  // Delete plan
  const handleDeletePlan = async () => {
    try {
      if (planToDelete) {
        await subscriptionService.deleteSubscriptionPlan(planToDelete);

        // Update local state
        setPlans(plans.filter((plan) => plan.id !== planToDelete));
        setAllPlans(allPlans.filter((plan) => plan.id !== planToDelete));

        onCloseDeleteModal();
        setPlanToDelete(null);
      }
    } catch (err) {
      console.error("Error deleting subscription plan:", err);
      setError("Failed to delete subscription plan");
    }
  };

  // Toggle plan active status
  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      await subscriptionService.toggleSubscriptionPlanStatus(planId, isActive);

      // Update local state
      setPlans(
        plans.map((plan) =>
          plan.id === planId ? { ...plan, isActive: isActive } : plan,
        ),
      );
      setAllPlans(
        allPlans.map((plan) =>
          plan.id === planId ? { ...plan, isActive: isActive } : plan,
        ),
      );
    } catch (err) {
      console.error("Error toggling plan status:", err);
      setError("Failed to update plan status");
    }
  };

  // Function to handle searching and filtering
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value === "") {
      // Apply current filter to all plans
      if (activeFilter === "all") {
        setPlans(allPlans);
      } else if (activeFilter === "active") {
        setPlans(allPlans.filter((p) => p.isActive));
      } else if (activeFilter === "inactive") {
        setPlans(allPlans.filter((p) => !p.isActive));
      }
    } else {
      // Filter by search term and current filter
      let filtered = allPlans.filter(
        (plan) =>
          plan.name.toLowerCase().includes(value.toLowerCase()) ||
          plan.description.toLowerCase().includes(value.toLowerCase()),
      );

      // Apply additional filtering based on active filter
      if (activeFilter === "active") {
        filtered = filtered.filter((p) => p.isActive);
      } else if (activeFilter === "inactive") {
        filtered = filtered.filter((p) => !p.isActive);
      }

      setPlans(filtered);
    }
  };

  // Function to apply filters
  const applyFilter = (filter: string) => {
    setActiveFilter(filter);
    if (searchTerm) {
      // If there's a search term, apply both filters
      handleSearch(searchTerm);
    } else {
      // Otherwise just apply the status filter
      if (filter === "all") {
        setPlans(allPlans);
      } else if (filter === "active") {
        setPlans(allPlans.filter((p) => p.isActive));
      } else if (filter === "inactive") {
        setPlans(allPlans.filter((p) => !p.isActive));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner label="Loading subscription plans..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardBody>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <IoAlertCircleOutline className="w-12 h-12 text-red-600" />
            <div className="text-center">
              <p className="text-xl font-semibold text-red-600">{error}</p>
              <p className="text-sm text-red-600/80 mt-1">
                Please try again or contact support if the issue persists.
              </p>
            </div>
            <Button
              color="warning"
              startContent={<IoRefreshOutline />}
              variant="bordered"
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className={title({ size: "sm" })}>Subscription Plans</h1>
          <p className="text-mountain-500 mt-2">
            Create and manage subscription plans for clinics
          </p>
        </div>

        <div className="flex gap-2 mt-4 sm:mt-0">
          <Input
            className="w-48 md:w-64"
            placeholder="Search plans..."
            size="sm"
            startContent={
              <IoSearchOutline className="text-mountain-400 w-5 h-5" />
            }
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Link to="/admin/subscriptions">
            <Button
              color="default"
              startContent={<IoArrowBackOutline className="w-5 h-5" />}
              variant="flat"
            >
              Back
            </Button>
          </Link>
          <Button
            color="primary"
            startContent={<IoAddOutline className="w-5 h-5" />}
            onClick={onOpen}
          >
            New Plan
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Card className="bg-mountain-50 border border-mountain-200">
          <CardBody className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <IoLayersOutline className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-mountain-600">
                  Total Plans
                </p>
                <p className="text-xl font-bold">{plans.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-health-50 border border-health-100">
          <CardBody className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-health-100 rounded-lg">
                <IoCheckmarkCircleOutline className="w-6 h-6 text-health-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-mountain-600">
                  Active Plans
                </p>
                <p className="text-xl font-bold">
                  {plans.filter((p) => p.isActive).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-red-50 border border-red-100">
          <CardBody className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <IoCloseCircleOutline className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-mountain-600">
                  Inactive Plans
                </p>
                <p className="text-xl font-bold">
                  {plans.filter((p) => !p.isActive).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          color={activeFilter === "all" ? "primary" : "default"}
          size="sm"
          variant={activeFilter === "all" ? "solid" : "flat"}
          onClick={() => {
            setActiveFilter("all");
            setPlans(allPlans);
          }}
        >
          All Plans
        </Button>
        <Button
          color={activeFilter === "active" ? "success" : "default"}
          size="sm"
          variant={activeFilter === "active" ? "solid" : "flat"}
          onClick={() => applyFilter("active")}
        >
          Active Only
        </Button>
        <Button
          color={activeFilter === "inactive" ? "danger" : "default"}
          size="sm"
          variant={activeFilter === "inactive" ? "solid" : "flat"}
          onClick={() => {
            setActiveFilter("inactive");
            setPlans(allPlans.filter((p) => !p.isActive));
          }}
        >
          Inactive Only
        </Button>
        <Dropdown>
          <DropdownTrigger>
            <Button
              color="default"
              size="sm"
              startContent={<IoFilterOutline />}
              variant="flat"
            >
              Sort by Price
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Sort options">
            <DropdownItem
              onClick={() => {
                setPlans(
                  [...plans].sort((a, b) => a.monthlyPrice - b.monthlyPrice),
                );
              }}
            >
              Monthly Price: Low to High
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setPlans(
                  [...plans].sort((a, b) => b.monthlyPrice - a.monthlyPrice),
                );
              }}
            >
              Monthly Price: High to Low
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setPlans(
                  [...plans].sort((a, b) => a.yearlyPrice - b.yearlyPrice),
                );
              }}
            >
              Yearly Price: Low to High
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setPlans(
                  [...plans].sort((a, b) => b.yearlyPrice - a.yearlyPrice),
                );
              }}
            >
              Yearly Price: High to Low
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`border transition-colors ${
              plan.isActive ? "border-teal-200" : "border-mountain-200"
            } ${editModeId === plan.id ? "ring-2 ring-teal-500" : ""}`}
          >
            <CardHeader className="flex justify-between items-start bg-mountain-50 border-b border-mountain-100">
              {editModeId === plan.id ? (
                <Input
                  className="font-semibold text-lg"
                  placeholder="Plan name"
                  value={editData?.name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData!, name: e.target.value })
                  }
                />
              ) : (
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <Chip
                    className="mt-1"
                    color={plan.isActive ? "success" : "default"}
                    size="sm"
                    variant="flat"
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </Chip>
                </div>
              )}

              {editModeId === plan.id ? (
                <div className="flex gap-1">
                  <Button
                    isIconOnly
                    color="primary"
                    size="sm"
                    variant="flat"
                    onClick={() => handleSaveEdit()}
                  >
                    <IoSaveOutline className="w-5 h-5" />
                  </Button>
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="flat"
                    onClick={cancelEditMode}
                  >
                    <IoCloseOutline className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Button
                    isIconOnly
                    color="primary"
                    size="sm"
                    variant="flat"
                    onClick={() => startEditMode(plan)}
                  >
                    <IoCreateOutline className="w-5 h-5" />
                  </Button>
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="flat"
                    onClick={() => openDeleteConfirmation(plan.id)}
                  >
                    <IoTrashOutline className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardBody>
              {editModeId === plan.id ? (
                <Textarea
                  className="mb-4"
                  placeholder="Plan description"
                  value={editData?.description || ""}
                  onChange={(e) =>
                    setEditData({ ...editData!, description: e.target.value })
                  }
                />
              ) : (
                <p className="text-mountain-600 mb-4">{plan.description}</p>
              )}

              <div className="bg-mountain-50 p-3 rounded-lg mb-4 border border-mountain-100">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Monthly</h4>
                  {editModeId === plan.id ? (
                    <Input
                      placeholder="0.00"
                      size="sm"
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-mountain-400 text-xs">NPR</span>
                        </div>
                      }
                      type="number"
                      value={editData?.monthlyPrice || 0}
                      onChange={(e) =>
                        setEditData({
                          ...editData!,
                          monthlyPrice: parseFloat(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        NPR{" "}
                        {plan.discountedMonthlyPrice ? (
                          <>
                            <span className="text-health-600">
                              {plan.discountedMonthlyPrice.toLocaleString()}
                            </span>
                            <span className="text-mountain-400 text-sm line-through ml-2">
                              {plan.monthlyPrice.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          plan.monthlyPrice.toLocaleString()
                        )}
                      </p>
                      <p className="text-xs text-mountain-500">per month</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Yearly</h4>
                  {editModeId === plan.id ? (
                    <Input
                      placeholder="0.00"
                      size="sm"
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-mountain-400 text-xs">NPR</span>
                        </div>
                      }
                      type="number"
                      value={editData?.yearlyPrice || 0}
                      onChange={(e) =>
                        setEditData({
                          ...editData!,
                          yearlyPrice: parseFloat(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        NPR{" "}
                        {plan.discountedYearlyPrice ? (
                          <>
                            <span className="text-health-600">
                              {plan.discountedYearlyPrice.toLocaleString()}
                            </span>
                            <span className="text-mountain-400 text-sm line-through ml-2">
                              {plan.yearlyPrice.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          plan.yearlyPrice.toLocaleString()
                        )}
                      </p>
                      <p className="text-xs text-mountain-500">per year</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <IoListOutline className="w-4 h-4 mr-1" />
                  Features
                </h4>
                {editModeId === plan.id ? (
                  <div className="flex mb-2">
                    <Input
                      className="flex-1"
                      placeholder="Add a feature"
                      size="sm"
                      value={tempFeature}
                      onChange={(e) => setTempFeature(e.target.value)}
                    />
                    <Button
                      isIconOnly
                      className="ml-2"
                      color="primary"
                      size="sm"
                      onClick={handleAddFeatureInEditMode}
                    >
                      <IoAddOutline className="w-4 h-4" />
                    </Button>
                  </div>
                ) : null}

                <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border border-mountain-200 rounded-md">
                  {plan.features && plan.features.length > 0 ? (
                    plan.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-mountain-50"
                      >
                        <div className="flex items-center">
                          <IoCheckmarkCircleOutline className="w-4 h-4 text-health-600 mr-2" />
                          <span className="text-sm">{feature}</span>
                        </div>
                        {editModeId === plan.id && (
                          <Button
                            isIconOnly
                            color="danger"
                            size="sm"
                            variant="flat"
                            onClick={() => handleRemoveFeatureInEditMode(index)}
                          >
                            <IoCloseOutline className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2 text-mountain-400 text-sm italic">
                      No features added yet
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-mountain-50 p-3 rounded-lg border border-mountain-100">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <IoStatsChartOutline className="w-4 h-4 mr-1" />
                  Limits
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Users</span>
                    {editModeId === plan.id ? (
                      <Input
                        className="w-24"
                        size="sm"
                        type="number"
                        value={editData?.maxUsers || 0}
                        onChange={(e) =>
                          setEditData({
                            ...editData!,
                            maxUsers: parseInt(e.target.value),
                          })
                        }
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {plan.maxUsers}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Patients</span>
                    {editModeId === plan.id ? (
                      <Input
                        className="w-24"
                        size="sm"
                        type="number"
                        value={editData?.maxPatients || 0}
                        onChange={(e) =>
                          setEditData({
                            ...editData!,
                            maxPatients: parseInt(e.target.value),
                          })
                        }
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {plan.maxPatients}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Storage (GB)</span>
                    {editModeId === plan.id ? (
                      <Input
                        className="w-24"
                        size="sm"
                        type="number"
                        value={editData?.storageLimitGB || 0}
                        onChange={(e) =>
                          setEditData({
                            ...editData!,
                            storageLimitGB: parseInt(e.target.value),
                          })
                        }
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {plan.storageLimitGB} GB
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>

            {editModeId !== plan.id && (
              <CardFooter className="border-t border-mountain-100">
                <Button
                  fullWidth
                  color={plan.isActive ? "danger" : "success"}
                  startContent={
                    plan.isActive ? (
                      <IoCloseCircleOutline className="w-5 h-5" />
                    ) : (
                      <IoCheckmarkCircleOutline className="w-5 h-5" />
                    )
                  }
                  variant={plan.isActive ? "flat" : "solid"}
                  onClick={() => togglePlanStatus(plan.id, !plan.isActive)}
                >
                  {plan.isActive ? "Deactivate Plan" : "Activate Plan"}
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}

        {plans.length === 0 && (
          <Card className="col-span-full border border-dashed border-mountain-300 bg-mountain-50">
            <CardBody>
              <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-teal-50 p-6 mb-6">
                  <IoSettingsOutline className="w-14 h-14 text-teal-700" />
                </div>
                <h3 className="text-2xl font-medium mb-3">
                  No Plans Created Yet
                </h3>
                <p className="text-mountain-500 text-center mb-6 max-w-md">
                  Create your first subscription plan to start managing clinic
                  subscriptions. Each plan can have different features, limits,
                  and pricing options.
                </p>
                <Button
                  color="primary"
                  size="lg"
                  startContent={<IoAddOutline />}
                  onClick={onOpen}
                >
                  Create Your First Plan
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* New Plan Modal */}
      <Modal isOpen={isOpen} size="4xl" onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              Create New Subscription Plan
            </h3>
          </ModalHeader>
          <ModalBody className="py-3">
            <div className="grid grid-cols-1 gap-4">
              {/* Basic Info - Name & Description in a single row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Plan Name"
                  placeholder="e.g. Basic, Professional, Enterprise"
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                />
                <div className="md:col-span-2">
                  <Textarea
                    label="Description"
                    placeholder="Explain what's included in this plan"
                    value={newPlan.description}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Price options in a single row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Monthly Price"
                  placeholder="0.00"
                  size="sm"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-mountain-400 text-xs">NPR</span>
                    </div>
                  }
                  type="number"
                  value={newPlan.monthlyPrice}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      monthlyPrice: parseFloat(e.target.value),
                    })
                  }
                />
                <Input
                  label="Discounted Monthly"
                  placeholder="0.00"
                  size="sm"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-mountain-400 text-xs">NPR</span>
                    </div>
                  }
                  type="number"
                  value={newPlan.discountedMonthlyPrice}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      discountedMonthlyPrice: parseFloat(e.target.value),
                    })
                  }
                />
                <Input
                  label="Yearly Price"
                  placeholder="0.00"
                  size="sm"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-mountain-400 text-xs">NPR</span>
                    </div>
                  }
                  type="number"
                  value={newPlan.yearlyPrice}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      yearlyPrice: parseFloat(e.target.value),
                    })
                  }
                />
                <Input
                  label="Discounted Yearly"
                  placeholder="0.00"
                  size="sm"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-mountain-400 text-xs">NPR</span>
                    </div>
                  }
                  type="number"
                  value={newPlan.discountedYearlyPrice}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      discountedYearlyPrice: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              {/* Limits and features in a single row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Limits - 6 columns (increased from 5) */}
                <div className="md:col-span-6">
                  <div className="bg-mountain-50 p-3 rounded-lg border border-mountain-200">
                    <h4 className="text-sm font-medium mb-2">Plan Limits</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        label="Max Users"
                        size="sm"
                        type="number"
                        value={newPlan.maxUsers}
                        onChange={(e) =>
                          setNewPlan({
                            ...newPlan,
                            maxUsers: parseInt(e.target.value),
                          })
                        }
                      />
                      <Input
                        label="Max Patients"
                        size="sm"
                        type="number"
                        value={newPlan.maxPatients}
                        onChange={(e) =>
                          setNewPlan({
                            ...newPlan,
                            maxPatients: parseInt(e.target.value),
                          })
                        }
                      />
                      <Input
                        label="Storage (GB)"
                        size="sm"
                        type="number"
                        value={newPlan.storageLimitGB}
                        onChange={(e) =>
                          setNewPlan({
                            ...newPlan,
                            storageLimitGB: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Features - 6 columns (decreased from 7) */}
                <div className="md:col-span-6">
                  <div className="bg-mountain-50 p-3 rounded-lg border border-mountain-200 h-full">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Features</h4>
                      <div className="flex">
                        <Input
                          className="w-56"
                          placeholder="Add a feature"
                          size="sm"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddFeature();
                            }
                          }}
                        />
                        <Button
                          isIconOnly
                          className="ml-2"
                          color="primary"
                          size="sm"
                          onClick={handleAddFeature}
                        >
                          <IoAddOutline className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-[100px] overflow-y-auto">
                      {newPlan.features && newPlan.features.length > 0 ? (
                        newPlan.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-1 px-2 rounded hover:bg-mountain-50"
                          >
                            <div className="flex items-center">
                              <IoCheckmarkCircleOutline className="w-4 h-4 text-health-600 mr-2" />
                              <span className="text-sm">{feature}</span>
                            </div>
                            <Button
                              isIconOnly
                              color="danger"
                              size="sm"
                              variant="light"
                              onClick={() => handleRemoveFeature(index)}
                            >
                              <IoCloseOutline className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-2 text-mountain-400 text-sm italic">
                          No features added yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              startContent={<IoSaveOutline />}
              onClick={handleCreatePlan}
            >
              Create Plan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} size="sm" onClose={onCloseDeleteModal}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
          </ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete this subscription plan? This
              action cannot be undone.
            </p>
            <p className="text-red-600 text-sm mt-2">
              Warning: Any clinics using this plan will need to be reassigned to
              another plan.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onClick={onCloseDeleteModal}>
              Cancel
            </Button>
            <Button
              color="danger"
              startContent={<IoTrashOutline />}
              onClick={handleDeletePlan}
            >
              Delete Plan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
