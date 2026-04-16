import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { addToast } from "@heroui/toast";

import { passwordService } from "@/services/passwordService";

interface PasswordUpdateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export const PasswordUpdateForm: React.FC<PasswordUpdateFormProps> = ({
  onSuccess,
  onCancel,
  showCancelButton = true,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate current password
    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    // Validate new password
    const passwordValidation = passwordService.validatePassword(newPassword);

    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.message;
    }

    // Validate password confirmation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (!passwordService.passwordsMatch(newPassword, confirmPassword)) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Check if new password is different from current
    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await passwordService.updatePassword(currentPassword, newPassword);

      addToast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});

      onSuccess?.();
    } catch (error: any) {
      console.error("Error updating password:", error);

      let errorMessage = "Failed to update password. Please try again.";

      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
        setErrors({ currentPassword: errorMessage });
      } else if (error.code === "auth/weak-password") {
        errorMessage =
          "Password is too weak. Please choose a stronger password.";
        setErrors({ newPassword: errorMessage });
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "Please log out and log back in before changing your password.";
        setErrors({ currentPassword: errorMessage });
      } else if (error.message) {
        errorMessage = error.message;
      }

      addToast({
        title: "Password Update Failed",
        description: errorMessage,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    const validation = passwordService.validatePassword(password);

    if (validation.isValid) {
      return { strength: 100, label: "Strong", color: "text-green-600" };
    }

    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (/(?=.*[a-z])/.test(password)) strength += 20;
    if (/(?=.*[A-Z])/.test(password)) strength += 20;
    if (/(?=.*\d)/.test(password)) strength += 20;
    if (/(?=.*[@$!%*?&])/.test(password)) strength += 20;

    let label = "Very Weak";
    let color = "text-red-600";

    if (strength >= 80) {
      label = "Strong";
      color = "text-green-600";
    } else if (strength >= 60) {
      label = "Good";
      color = "text-yellow-600";
    } else if (strength >= 40) {
      label = "Fair";
      color = "text-orange-600";
    } else if (strength >= 20) {
      label = "Weak";
      color = "text-red-500";
    }

    return { strength, label, color };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch =
    newPassword && confirmPassword
      ? passwordService.passwordsMatch(newPassword, confirmPassword)
      : null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <h2 className="text-xl font-semibold">Update Password</h2>
        <p className="text-sm text-gray-600">
          Enter your current password and choose a new one
        </p>
      </CardHeader>
      <CardBody>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Current Password */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700">
              Current Password
            </label>
            <div className="relative">
              <Input
                required
                autoComplete="current-password"
                className="w-full"
                classNames={{
                  input: "text-gray-900 pr-10",
                  inputWrapper: errors.currentPassword
                    ? "border-red-300 hover:border-red-400 focus-within:border-red-500"
                    : "border-gray-200 hover:border-gray-300 focus-within:border-blue-500",
                }}
                isDisabled={loading}
                placeholder="Enter current password"
                radius="lg"
                size="md"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700">
              New Password
            </label>
            <div className="relative">
              <Input
                required
                autoComplete="new-password"
                className="w-full"
                classNames={{
                  input: "text-gray-900 pr-10",
                  inputWrapper: errors.newPassword
                    ? "border-red-300 hover:border-red-400 focus-within:border-red-500"
                    : "border-gray-200 hover:border-gray-300 focus-within:border-blue-500",
                }}
                isDisabled={loading}
                placeholder="Enter new password"
                radius="lg"
                size="md"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Password strength:</span>
                  <span className={passwordStrength.color}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.strength >= 80
                        ? "bg-green-500"
                        : passwordStrength.strength >= 60
                          ? "bg-yellow-500"
                          : passwordStrength.strength >= 40
                            ? "bg-orange-500"
                            : "bg-red-500"
                    }`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  />
                </div>
              </div>
            )}

            {errors.newPassword && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                required
                autoComplete="new-password"
                className="w-full"
                classNames={{
                  input: "text-gray-900 pr-10",
                  inputWrapper: errors.confirmPassword
                    ? "border-red-300 hover:border-red-400 focus-within:border-red-500"
                    : passwordsMatch === true
                      ? "border-green-300 hover:border-green-400 focus-within:border-green-500"
                      : "border-gray-200 hover:border-gray-300 focus-within:border-blue-500",
                }}
                isDisabled={loading}
                placeholder="Confirm new password"
                radius="lg"
                size="md"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && passwordsMatch !== null && (
              <p
                className={`text-xs mt-1 flex items-center gap-1 ${
                  passwordsMatch ? "text-green-600" : "text-red-600"
                }`}
              >
                {passwordsMatch ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </p>
            )}

            {errors.confirmPassword && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1"
              color="primary"
              isDisabled={loading}
              isLoading={loading}
              size="md"
              type="submit"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>

            {showCancelButton && (
              <Button
                isDisabled={loading}
                size="md"
                type="button"
                variant="light"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
