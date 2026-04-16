import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { Plus, Edit, MapPin, Phone, Mail, Crown } from "lucide-react";

import { Branch, Clinic } from "../../types/models";
import { branchService } from "../../services/branchService";
import { clinicService } from "../../services/clinicService";

interface BranchManagementProps {
  clinicId: string;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({
  clinicId,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isEnablingMultiBranch, setIsEnablingMultiBranch] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    isMainBranch: false,
  });

  useEffect(() => {
    loadData();
  }, [clinicId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clinicData, branchesData] = await Promise.all([
        clinicService.getClinicById(clinicId),
        branchService.getClinicBranches(clinicId, false),
      ]);

      setClinic(clinicData);
      setBranches(branchesData);
    } catch (error) {
      console.error("Error loading data:", error);
      addToast({
        title: "Error",
        description: "Failed to load clinic data",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMultiBranch = async () => {
    try {
      setIsEnablingMultiBranch(true);

      // Enable multi-branch for the clinic
      await clinicService.updateClinic(clinicId, {
        isMultiBranchEnabled: true,
        maxBranches: 5, // Default limit
        totalBranches: 1,
      });

      // Create default main branch
      await branchService.createDefaultMainBranch(clinicId);

      addToast({
        title: "Success",
        description: "Multi-branch system enabled successfully",
        color: "success",
      });
      await loadData();
    } catch (error) {
      console.error("Error enabling multi-branch:", error);
      addToast({
        title: "Error",
        description: "Failed to enable multi-branch system",
        color: "danger",
      });
    } finally {
      setIsEnablingMultiBranch(false);
    }
  };

  const handleCreateBranch = async () => {
    try {
      if (
        !formData.name ||
        !formData.code ||
        !formData.address ||
        !formData.city ||
        !formData.phone
      ) {
        addToast({
          title: "Error",
          description: "Please fill in all required fields",
          color: "danger",
        });

        return;
      }

      await branchService.createBranch({
        ...formData,
        clinicId,
        createdBy: "current-user-id", // Replace with actual user ID
      });

      addToast({
        title: "Success",
        description: "Branch created successfully",
        color: "success",
      });
      setIsCreateModalOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error creating branch:", error);
      addToast({
        title: "Error",
        description: "Failed to create branch",
        color: "danger",
      });
    }
  };

  const handleEditBranch = async () => {
    try {
      if (!selectedBranch) return;

      await branchService.updateBranch(selectedBranch.id, formData);

      addToast({
        title: "Success",
        description: "Branch updated successfully",
        color: "success",
      });
      setIsEditModalOpen(false);
      setSelectedBranch(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error updating branch:", error);
      addToast({
        title: "Error",
        description: "Failed to update branch",
        color: "danger",
      });
    }
  };

  const handleSetMainBranch = async (branchId: string) => {
    try {
      await branchService.setMainBranch(branchId);
      addToast({
        title: "Success",
        description: "Main branch updated successfully",
        color: "success",
      });
      await loadData();
    } catch (error) {
      console.error("Error setting main branch:", error);
      addToast({
        title: "Error",
        description: "Failed to set main branch",
        color: "danger",
      });
    }
  };

  const handleDeactivateBranch = async (branchId: string) => {
    try {
      await branchService.deactivateBranch(branchId);
      addToast({
        title: "Success",
        description: "Branch deactivated successfully",
        color: "success",
      });
      await loadData();
    } catch (error) {
      console.error("Error deactivating branch:", error);
      addToast({
        title: "Error",
        description: "Failed to deactivate branch",
        color: "danger",
      });
    }
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      email: branch.email || "",
      isMainBranch: branch.isMainBranch,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      isMainBranch: false,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner label="Loading..." size="lg" />
      </div>
    );
  }

  if (!clinic?.isMultiBranchEnabled) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Multi-Branch Management</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold mb-2">
              Multi-Branch System Disabled
            </h4>
            <p className="text-gray-600 mb-6">
              This clinic doesn't have multi-branch functionality enabled.
              Enable it to manage multiple branch locations.
            </p>
            <Button
              color="primary"
              isLoading={isEnablingMultiBranch}
              startContent={<Plus />}
              onClick={handleEnableMultiBranch}
            >
              Enable Multi-Branch System
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Branch Management</h3>
            <p className="text-sm text-gray-600">
              Manage all branches for {clinic.name}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Plus />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add New Branch
          </Button>
        </CardHeader>
        <CardBody>
          <Table aria-label="Branches table">
            <TableHeader>
              <TableColumn>BRANCH</TableColumn>
              <TableColumn>CODE</TableColumn>
              <TableColumn>LOCATION</TableColumn>
              <TableColumn>CONTACT</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {branch.isMainBranch && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium">{branch.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {branch.code}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{branch.address}</div>
                      <div className="text-gray-500">{branch.city}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {branch.phone}
                      </div>
                      {branch.email && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Mail className="h-3 w-3" />
                          {branch.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={branch.isActive ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {branch.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        startContent={<Edit className="h-3 w-3" />}
                        variant="flat"
                        onClick={() => openEditModal(branch)}
                      >
                        Edit
                      </Button>
                      {!branch.isMainBranch && branch.isActive && (
                        <Button
                          color="warning"
                          size="sm"
                          variant="flat"
                          onClick={() => handleSetMainBranch(branch.id)}
                        >
                          Set as Main
                        </Button>
                      )}
                      {!branch.isMainBranch && branch.isActive && (
                        <Button
                          color="danger"
                          size="sm"
                          variant="flat"
                          onClick={() => handleDeactivateBranch(branch.id)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Create Branch Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        size="2xl"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Create New Branch</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                isRequired
                label="Branch Name"
                placeholder="e.g., Downtown Branch"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Input
                isRequired
                label="Branch Code"
                placeholder="e.g., DT"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
              <div className="col-span-2">
                <Textarea
                  isRequired
                  label="Address"
                  placeholder="Branch address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <Input
                isRequired
                label="City"
                placeholder="City"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
              <Input
                isRequired
                label="Phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <div className="col-span-2">
                <Input
                  label="Email (Optional)"
                  placeholder="Branch email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <Switch
                  isSelected={formData.isMainBranch}
                  onValueChange={(checked) =>
                    setFormData({ ...formData, isMainBranch: checked })
                  }
                >
                  Set as Main Branch
                </Switch>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleCreateBranch}>
              Create Branch
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Branch Modal */}
      <Modal
        isOpen={isEditModalOpen}
        size="2xl"
        onClose={() => setIsEditModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Edit Branch</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                isRequired
                label="Branch Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Input
                isRequired
                label="Branch Code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
              <div className="col-span-2">
                <Textarea
                  isRequired
                  label="Address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <Input
                isRequired
                label="City"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
              <Input
                isRequired
                label="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <div className="col-span-2">
                <Input
                  label="Email (Optional)"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleEditBranch}>
              Update Branch
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
