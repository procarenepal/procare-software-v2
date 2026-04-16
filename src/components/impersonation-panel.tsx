import React, { useState, useEffect } from "react";
import {
  IoPersonOutline,
  IoKeyOutline,
  IoLogInOutline,
  IoTrashOutline,
  IoAlertCircleOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@/components/ui";
import { userService } from "@/services/userService";
import { clinicService } from "@/services/clinicService";
import { impersonationService } from "@/services/impersonationService";
import { User, Clinic } from "@/types/models";

interface ClinicAdmin extends User {
  clinicName?: string;
  hasStoredCredentials?: boolean;
}

export const ImpersonationPanel: React.FC = () => {
  const [clinicAdmins, setClinicAdmins] = useState<ClinicAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedAdmin, setSelectedAdmin] = useState<ClinicAdmin | null>(null);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  // Load clinic admins data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get all clinics
        const allClinics = await clinicService.getAllClinics();
        const clinicsMap = new Map<string, Clinic>();

        allClinics.forEach((clinic) => clinicsMap.set(clinic.id, clinic));

        // Get all clinic admins
        const admins = await userService.getClinicAdmins();

        // Check which admins have stored credentials
        const adminsWithCredentialStatus = await Promise.all(
          admins.map(async (admin) => {
            const hasCredentials =
              await impersonationService.hasStoredCredentials(admin.id);
            const clinicName = admin.clinicId
              ? clinicsMap.get(admin.clinicId)?.name
              : "Unknown Clinic";

            return {
              ...admin,
              clinicName,
              hasStoredCredentials: hasCredentials,
            };
          }),
        );

        setClinicAdmins(adminsWithCredentialStatus);
      } catch (err) {
        console.error("Error fetching clinic admins:", err);
        setError("Failed to load clinic admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter admins based on search term
  const filteredAdmins = clinicAdmins.filter(
    (admin) =>
      admin.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.clinicName &&
        admin.clinicName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Open modal to store credentials
  const handleStoreCredentials = (admin: ClinicAdmin) => {
    setSelectedAdmin(admin);
    setAdminPassword("");
    onOpen();
  };

  // Save admin credentials
  const saveCredentials = async () => {
    if (!selectedAdmin || !adminPassword) return;

    try {
      await impersonationService.storeCredentials(
        selectedAdmin.id,
        selectedAdmin.email,
        adminPassword,
      );

      // Update the local state to reflect the change
      setClinicAdmins((prev) =>
        prev.map((admin) =>
          admin.id === selectedAdmin.id
            ? { ...admin, hasStoredCredentials: true }
            : admin,
        ),
      );

      onClose();
    } catch (err) {
      console.error("Error storing credentials:", err);
      setError("Failed to store credentials");
    }
  };

  // Impersonate a clinic admin
  const impersonateAdmin = async (admin: ClinicAdmin) => {
    try {
      setError(null); // Clear any previous errors
      setLoading(true);

      await impersonationService.impersonateAdmin(admin.id);

      // Add a small delay to allow auth state to settle
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to impersonate admin";

      setError(`Failed to impersonate admin: ${errorMessage}`);
    } finally {
      // Reset loading state regardless of success or failure
      setLoading(false);
    }
  };

  // Remove stored credentials
  const removeCredentials = async (admin: ClinicAdmin) => {
    try {
      await impersonationService.removeCredentials(admin.id);

      // Update the local state to reflect the change
      setClinicAdmins((prev) =>
        prev.map((a) =>
          a.id === admin.id ? { ...a, hasStoredCredentials: false } : a,
        ),
      );
    } catch (err) {
      console.error("Error removing credentials:", err);
      setError("Failed to remove credentials");
    }
  };

  if (loading) {
    return (
      <Card className="w-full border border-mountain-200">
        <CardBody>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-primary" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full border border-mountain-200">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-semibold">Clinic Admin Impersonation</h2>
          <div className="w-64">
            <Input
              placeholder="Search admins or clinics..."
              size="sm"
              startContent={<IoSearchOutline className="text-mountain-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
              <IoAlertCircleOutline />
              <span>{error}</span>
            </div>
          )}

          {filteredAdmins.length === 0 ? (
            <div className="text-center py-8 text-mountain-400">
              {searchTerm
                ? "No matching admins found"
                : "No clinic admins available"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex justify-between items-center p-4 border border-mountain-200 rounded-lg hover:bg-mountain-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IoPersonOutline className="text-mountain-600" />
                      <span className="font-medium">{admin.displayName}</span>
                    </div>
                    <div className="text-sm text-mountain-500 mt-1">
                      {admin.email}
                    </div>
                    {admin.clinicName && (
                      <div className="text-xs text-mountain-400 mt-1">
                        Clinic: {admin.clinicName}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {admin.hasStoredCredentials ? (
                      <>
                        <Button
                          color="primary"
                          disabled={loading}
                          isLoading={loading}
                          size="sm"
                          startContent={<IoLogInOutline />}
                          variant="flat"
                          onClick={() => impersonateAdmin(admin)}
                        >
                          {loading ? "Impersonating..." : "Impersonate"}
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          startContent={<IoTrashOutline />}
                          variant="light"
                          onClick={() => removeCredentials(admin)}
                        >
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<IoKeyOutline />}
                        variant="bordered"
                        onClick={() => handleStoreCredentials(admin)}
                      >
                        Store Credentials
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal for storing credentials */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Store Admin Credentials</ModalHeader>
          <ModalBody>
            <p className="text-mountain-600 mb-4">
              Enter the password for {selectedAdmin?.displayName} (
              {selectedAdmin?.email})
            </p>
            <p className="text-mountain-400 text-sm mb-4">
              This password will be encrypted and stored securely for future
              impersonation.
            </p>
            <Input
              autoComplete="new-password"
              label="Admin Password"
              placeholder="Enter password"
              startContent={<IoKeyOutline className="text-mountain-400" />}
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button
              color="primary"
              disabled={!adminPassword}
              onClick={saveCredentials}
            >
              Store Credentials
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
