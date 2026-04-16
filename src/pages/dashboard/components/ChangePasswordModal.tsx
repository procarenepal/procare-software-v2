import React, { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  IoLockClosedOutline,
  IoKeyOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from "react-icons/io5";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import { addToast } from "@/components/ui/toast";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.email) return;

    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");

      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");

      return;
    }

    setLoading(true);

    try {
      // 1. Re-authenticate with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );

      await reauthenticateWithCredential(currentUser, credential);

      // 2. Update to new password
      await updatePassword(currentUser, newPassword);

      addToast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        color: "success",
      });

      // Clear the form and close
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: any) {
      console.error("Password change failed:", err);
      if (
        err.code === "auth/invalid-login-credentials" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Incorrect current password.");
      } else {
        setError(
          err.message || "An error occurred while changing your password.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setShowPasswords(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="sm" onClose={handleClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Change Password</ModalHeader>
          <ModalBody className="space-y-4 py-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                fullWidth
                isRequired
                endContent={
                  <button
                    className="hover:text-mountain-600 transition-colors bg-transparent border-none outline-none"
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? (
                      <IoEyeOffOutline className="w-4 h-4" />
                    ) : (
                      <IoEyeOutline className="w-4 h-4" />
                    )}
                  </button>
                }
                label="Current Password"
                placeholder="Enter current password"
                startContent={
                  <IoLockClosedOutline className="text-mountain-400" />
                }
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onValueChange={setCurrentPassword}
              />

              <Input
                fullWidth
                isRequired
                endContent={
                  <button
                    className="hover:text-mountain-600 transition-colors bg-transparent border-none outline-none"
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? (
                      <IoEyeOffOutline className="w-4 h-4" />
                    ) : (
                      <IoEyeOutline className="w-4 h-4" />
                    )}
                  </button>
                }
                label="New Password"
                placeholder="Enter new password"
                startContent={<IoKeyOutline className="text-mountain-400" />}
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onValueChange={setNewPassword}
              />

              <Input
                fullWidth
                isRequired
                endContent={
                  <button
                    className="hover:text-mountain-600 transition-colors bg-transparent border-none outline-none"
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? (
                      <IoEyeOffOutline className="w-4 h-4" />
                    ) : (
                      <IoEyeOutline className="w-4 h-4" />
                    )}
                  </button>
                }
                label="Confirm New Password"
                placeholder="Re-enter new password"
                startContent={<IoKeyOutline className="text-mountain-400" />}
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onValueChange={setConfirmPassword}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              isDisabled={loading}
              size="sm"
              variant="light"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button color="primary" isLoading={loading} size="sm" type="submit">
              Update Password
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
