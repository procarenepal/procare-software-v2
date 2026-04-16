import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { verifyPasswordResetCode } from "firebase/auth";
import { addToast } from "@heroui/toast";

import { PasswordResetForm } from "@/components/PasswordResetForm";
import { auth } from "@/config/firebase";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError("Invalid or missing reset code");
        setIsValidCode(false);
        setIsLoading(false);

        return;
      }

      try {
        // Verify the password reset code
        await verifyPasswordResetCode(auth, oobCode);
        setIsValidCode(true);
      } catch (error: any) {
        console.error("Error verifying reset code:", error);
        setError(
          "Invalid or expired reset code. Please request a new password reset.",
        );
        setIsValidCode(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handlePasswordUpdateSuccess = async () => {
    // No need to apply action code again - it's already applied in the password service
    addToast({
      title: "Password Reset Complete",
      description:
        "Your password has been successfully updated. You can now log in with your new password.",
    });
    navigate("/login");
  };

  const handleCancel = () => {
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Verifying reset code...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-bold text-red-600">
              Invalid Reset Code
            </h1>
          </CardHeader>
          <CardBody className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                color="primary"
                size="lg"
                onClick={() => navigate("/forgot-password")}
              >
                Request New Reset Link
              </Button>
              <Button
                className="w-full"
                size="md"
                variant="light"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        <PasswordResetForm
          oobCode={oobCode || ""}
          showCancelButton={true}
          onCancel={handleCancel}
          onSuccess={handlePasswordUpdateSuccess}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Remember your password?{" "}
            <Button
              className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              size="sm"
              variant="light"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
