import React from "react";
import { IoKeyOutline } from "react-icons/io5";

import { title } from "@/components/primitives";
import { ImpersonationPanel } from "@/components/impersonation-panel";
import { Card, CardBody } from "@/components/ui";

export default function AdminImpersonationPage() {
  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={title({ size: "sm" })}>
              Clinic Admin Impersonation
            </h1>
            <p className="text-mountain-600 mt-2">
              Manage impersonation access to clinic admin accounts for support
              and troubleshooting purposes.
            </p>
          </div>
        </div>

        {/* Impersonation Panel */}
        <ImpersonationPanel />

        {/* Documentation Card */}
        <Card className="mb-8 bg-mountain-50 border border-mountain-200">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-100 text-teal-700 rounded-lg">
                <IoKeyOutline className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  How Impersonation Works
                </h3>
                <p className="text-mountain-600 mb-4">
                  Impersonation allows you to access a clinic admin's account
                  for support and troubleshooting without knowing their actual
                  password. The credentials you store are encrypted and securely
                  stored.
                </p>
                <div className="space-y-2 text-sm text-mountain-500">
                  <p>
                    <strong>1.</strong> Store the clinic admin's credentials
                    securely
                  </p>
                  <p>
                    <strong>2.</strong> Use the "Impersonate" button to log in
                    as that admin
                  </p>
                  <p>
                    <strong>3.</strong> All actions performed will be logged in
                    the audit trail
                  </p>
                  <p>
                    <strong>4.</strong> Remove the stored credentials when no
                    longer needed
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
