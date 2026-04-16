import { IoSettingsOutline, IoLockClosedOutline } from "react-icons/io5";
import { useState, useEffect } from "react";

import { EditProfileModal } from "./components/EditProfileModal";
import { ChangePasswordModal } from "./components/ChangePasswordModal";

import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { useDisclosure } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { clinicService } from "@/services/clinicService";

export default function ProfilePage() {
  const { currentUser, userData, isClinicAdmin, isSuperAdmin } =
    useAuthContext();
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  const {
    isOpen: isPasswordModalOpen,
    onOpen: onPasswordModalOpen,
    onClose: onPasswordModalClose,
  } = useDisclosure();
  const [clinicName, setClinicName] = useState<string>("");

  useEffect(() => {
    if (userData?.clinicId) {
      clinicService.getClinicById(userData.clinicId).then((clinic) => {
        if (clinic) setClinicName(clinic.name);
      });
    }
  }, [userData?.clinicId]);

  const displayName =
    currentUser?.displayName || userData?.displayName || "User";
  const email = currentUser?.email || userData?.email || "No email provided";

  const getRoleBadge = () => {
    if (isSuperAdmin())
      return (
        <Chip color="danger" size="sm" variant="flat">
          System Admin
        </Chip>
      );
    if (isClinicAdmin())
      return (
        <Chip color="primary" size="sm" variant="flat">
          Clinic Admin
        </Chip>
      );

    return (
      <Chip color="success" size="sm" variant="flat">
        {userData?.role || "Staff"}
      </Chip>
    );
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-8 px-4">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          <div className="relative group">
            <Avatar
              className="w-32 h-32 text-3xl shadow-lg ring-4 ring-white dark:ring-zinc-900"
              color="primary"
              name={displayName}
              src={currentUser?.photoURL || ""}
            />
            <button
              className="absolute bottom-0 right-0 p-2 bg-teal-600 text-white rounded-full shadow-md hover:bg-teal-700 transition-colors border-2 border-white dark:border-zinc-900"
              onClick={onEditModalOpen}
            >
              <IoSettingsOutline className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {displayName}
              </h1>
              <div className="flex justify-center md:justify-start">
                {getRoleBadge()}
              </div>
            </div>

            <p className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-center md:justify-start gap-2">
              <span className="p-1 px-2 bg-zinc-100 dark:bg-zinc-900 rounded text-xs font-mono">
                {email}
              </span>
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
              <Button
                className="rounded-full px-6"
                color="primary"
                size="sm"
                variant="solid"
                onClick={onEditModalOpen}
              >
                Edit Profile
              </Button>
              <Button
                className="rounded-full px-6 bg-zinc-100 dark:bg-zinc-900"
                color="default"
                size="sm"
                variant="flat"
                onClick={onPasswordModalOpen}
              >
                Security
              </Button>
            </div>
          </div>
        </div>

        {/* Subtle decorative element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-50 dark:bg-teal-900/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em] px-1">
              Personal Details
            </h3>
            <Card className="border-none shadow-none bg-zinc-50/50 dark:bg-zinc-900/30">
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 p-8">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                    Email Address
                  </label>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {email}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                    Phone Number
                  </label>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {userData?.phone || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                    User Type
                  </label>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                    {userData?.role?.replace(/-/g, " ") || "Staff"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                    Member Since
                  </label>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {currentUser?.metadata.creationTime
                      ? new Date(
                          currentUser.metadata.creationTime,
                        ).toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </CardBody>
            </Card>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em] px-1">
              Permissions
            </h3>
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600">
                  <IoLockClosedOutline size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold capitalize text-zinc-900 dark:text-zinc-100">
                    {userData?.role?.replace(/-/g, " ")} Access
                  </p>
                  <p className="text-xs text-zinc-500">
                    Full administrative control over this branch
                  </p>
                </div>
              </div>
              <Button
                className="text-xs font-semibold"
                size="sm"
                variant="light"
              >
                View RBAC
              </Button>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em] px-1">
              Organization
            </h3>
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="h-24 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800">
                {clinicName ? (
                  <span className="text-lg font-bold text-zinc-300 dark:text-zinc-700 tracking-tighter">
                    PROVIDER
                  </span>
                ) : (
                  <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent animate-spin rounded-full" />
                )}
              </div>
              <CardBody className="p-6 text-center">
                <h4 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                  {clinicName || "Loading..."}
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium uppercase mt-1 tracking-widest">
                  {userData?.clinicId ? "Clinic Head" : "Clinic Unit"}
                </p>
              </CardBody>
            </Card>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em] px-1">
              Recent Activity
            </h3>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-100 dark:before:bg-zinc-800">
              <div className="relative pl-8 space-y-1">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border-2 border-teal-500 z-10" />
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Last Sign In
                </p>
                <p className="text-[10px] text-zinc-500">
                  {currentUser?.metadata.lastSignInTime
                    ? new Date(
                        currentUser.metadata.lastSignInTime,
                      ).toLocaleString()
                    : "First Session"}
                </p>
              </div>
              <div className="relative pl-8 space-y-1">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 z-10" />
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Account Created
                </p>
                <p className="text-[10px] text-zinc-500">
                  {currentUser?.metadata.creationTime
                    ? new Date(
                        currentUser.metadata.creationTime,
                      ).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={onEditModalClose} />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={onPasswordModalClose}
      />
    </div>
  );
}
