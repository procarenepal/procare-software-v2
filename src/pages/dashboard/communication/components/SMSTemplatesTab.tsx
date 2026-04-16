import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";

import { useModalState } from "@/hooks/useModalState";
import { useAuth } from "@/hooks/useAuth";
import {
  getSMSTemplates,
  addSMSTemplate,
  updateSMSTemplate,
  deleteSMSTemplate,
  SMSTemplate,
} from "@/services/sendMessageService";

const SMSTemplatesTab: React.FC = () => {
  const { clinicId, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SMSTemplate[]>([]);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const modalState = useModalState();
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const [templateType, setTemplateType] = useState<
    "patient" | "doctor" | "general" | "appointment" | "reminder"
  >("patient");

  // Preset templates
  const presetTemplates = {
    patient: [
      {
        name: "Appointment Reminder",
        message:
          "Dear {patientName}, this is a reminder for your appointment on {date} at {time} with Dr. {doctorName}. Please arrive 15 minutes early. For any changes, call us at {clinicPhone}.",
      },
      {
        name: "Welcome Message",
        message:
          "Welcome to {clinicName}! Thank you for choosing us for your healthcare needs. We look forward to serving you. For any questions, please call {clinicPhone}.",
      },
      {
        name: "Test Results Ready",
        message:
          "Dear {patientName}, your test results are ready. Please visit our clinic or call {clinicPhone} to discuss the results with your doctor.",
      },
      {
        name: "Prescription Ready",
        message:
          "Hello {patientName}, your prescription is ready for pickup at {clinicName}. Our pharmacy hours are 9 AM to 6 PM. Call {clinicPhone} for queries.",
      },
      {
        name: "Follow-up Appointment",
        message:
          "Dear {patientName}, please schedule your follow-up appointment with Dr. {doctorName}. Call us at {clinicPhone} or visit our clinic.",
      },
    ],
    doctor: [
      {
        name: "Patient Arrival Notification",
        message:
          "Dr. {doctorName}, your patient {patientName} has arrived for the {time} appointment. Room: {roomNumber}.",
      },
      {
        name: "Schedule Update",
        message:
          "Dr. {doctorName}, your schedule has been updated. Please check the dashboard for the latest appointments. Contact admin for any queries.",
      },
      {
        name: "Emergency Patient",
        message:
          "Dr. {doctorName}, emergency patient {patientName} requires immediate attention. Please report to {location} immediately.",
      },
      {
        name: "Lab Results Available",
        message:
          "Dr. {doctorName}, lab results for patient {patientName} are now available in the system. Patient ID: {patientId}.",
      },
    ],
    general: [
      {
        name: "Clinic Holiday Notice",
        message:
          "Dear patients, {clinicName} will be closed on {date} due to {reason}. Emergency contacts: {emergencyPhone}. Regular hours resume on {resumeDate}.",
      },
      {
        name: "New Services Announcement",
        message:
          "We're excited to announce new services at {clinicName}! {serviceDetails}. For more information, call {clinicPhone} or visit our website.",
      },
      {
        name: "Payment Reminder",
        message:
          "Dear {patientName}, this is a reminder that your payment of ${amount} is due on {dueDate}. Please visit our clinic or call {clinicPhone} to make payment.",
      },
      {
        name: "Health Tips",
        message:
          "Health Tip from {clinicName}: {healthTip}. Stay healthy and take care! For personalized health advice, schedule an appointment at {clinicPhone}.",
      },
    ],
  };

  // Apply preset template
  const applyPreset = (preset: { name: string; message: string }) => {
    setTemplateName(preset.name);
    setTemplateMessage(preset.message);
  };

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!clinicId) return;

      setLoading(true);
      try {
        const templatesData = await getSMSTemplates(clinicId);

        setTemplates(templatesData);
        setFilteredTemplates(templatesData);
      } catch (error) {
        console.error("Error loading templates:", error);
        addToast({
          title: "Error",
          description: "Failed to load templates. Please try again.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [clinicId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...templates];

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.message.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((template) => template.type === typeFilter);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, typeFilter]);

  // Reset form
  const resetForm = () => {
    setTemplateName("");
    setTemplateMessage("");
    setTemplateType("patient");
    setEditingTemplate(null);
    setIsEditing(false);
  };

  // Open modal for new template
  const handleNewTemplate = () => {
    resetForm();
    modalState.open();
  };

  // Open modal for editing template
  const handleEditTemplate = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateMessage(template.message);
    setTemplateType(template.type);
    setIsEditing(true);
    modalState.open();
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateMessage.trim()) {
      addToast({
        title: "Validation Error",
        description: "Please enter template name and message.",
        color: "danger",
      });

      return;
    }

    if (!clinicId) {
      addToast({
        title: "Error",
        description: "Clinic ID not found.",
        color: "danger",
      });

      return;
    }

    setSaving(true);
    try {
      if (isEditing && editingTemplate) {
        await updateSMSTemplate(editingTemplate.id!, {
          name: templateName,
          message: templateMessage,
          type: templateType,
        });

        // Update local state
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === editingTemplate.id
              ? {
                  ...t,
                  name: templateName,
                  message: templateMessage,
                  type: templateType,
                }
              : t,
          ),
        );

        addToast({
          title: "Success",
          description: "Template updated successfully",
          color: "success",
        });
      } else {
        const newTemplateId = await addSMSTemplate({
          clinicId: clinicId,
          name: templateName,
          message: templateMessage,
          type: templateType,
          createdBy: currentUser?.uid || "system",
        });

        // Add to local state
        const newTemplate: SMSTemplate = {
          id: newTemplateId,
          clinicId: clinicId,
          name: templateName,
          message: templateMessage,
          type: templateType,
          isActive: true,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "current-user",
          updatedBy: "current-user",
        };

        setTemplates((prev) => [newTemplate, ...prev]);

        addToast({
          title: "Success",
          description: "Template created successfully",
          color: "success",
        });
      }

      modalState.forceClose();
      resetForm();
    } catch (error) {
      console.error("Error saving template:", error);
      addToast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (template: SMSTemplate) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the template "${template.name}"?`,
      )
    ) {
      return;
    }

    try {
      await deleteSMSTemplate(template.id!);

      // Remove from local state
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));

      addToast({
        title: "Success",
        description: "Template deleted successfully",
        color: "success",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      addToast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        color: "danger",
      });
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "patient":
        return "primary";
      case "doctor":
        return "secondary";
      case "general":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with new template button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-default-500 text-sm">
            Create and manage reusable SMS templates ({filteredTemplates.length}{" "}
            of {templates.length} templates)
          </p>
        </div>
        <Button color="primary" onPress={handleNewTemplate}>
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          isClearable
          label="Search"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
        />

        <Select
          disallowEmptySelection
          label="Type"
          selectedKeys={new Set([typeFilter])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;

            setTypeFilter(value);
          }}
        >
          <SelectItem key="all">All Types</SelectItem>
          <SelectItem key="patient">Patient</SelectItem>
          <SelectItem key="doctor">Doctor</SelectItem>
          <SelectItem key="general">General</SelectItem>
        </Select>

        <Button className="mt-6" variant="flat" onPress={clearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-default-500">No templates found</p>
          {templates.length === 0 ? (
            <Button
              className="mt-2"
              color="primary"
              variant="flat"
              onPress={handleNewTemplate}
            >
              Create your first template
            </Button>
          ) : (
            <Button
              className="mt-2"
              size="sm"
              variant="flat"
              onPress={clearFilters}
            >
              Clear filters to see all templates
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="border border-default-200">
              <CardBody className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{template.name}</h4>
                    <Chip
                      color={getTypeColor(template.type)}
                      size="sm"
                      variant="flat"
                    >
                      {template.type.toUpperCase()}
                    </Chip>
                  </div>

                  <div className="text-sm bg-default-100 p-3 rounded-lg">
                    {template.message}
                  </div>

                  <div className="flex justify-between items-center text-xs text-default-500">
                    <span>Used: {template.usageCount || 0} times</span>
                    <span>
                      Created:{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }).format(new Date(template.createdAt))}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      variant="flat"
                      onPress={() => handleEditTemplate(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      variant="flat"
                      onPress={() => handleDeleteTemplate(template)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Template Modal */}
      <Modal
        hideCloseButton={saving}
        isDismissable={!saving}
        isOpen={modalState.isOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={() => {
          modalState.close();
          resetForm();
        }}
      >
        <ModalContent>
          <ModalHeader>
            {isEditing ? "Edit Template" : "New Template"}
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              isRequired
              label="Template Name"
              placeholder="Enter template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />

            <Select
              disallowEmptySelection
              isRequired
              label="Template Type"
              popoverProps={{
                classNames: {
                  content: "min-w-[200px]",
                },
              }}
              selectedKeys={new Set([templateType])}
              onOpenChange={modalState.handleDropdownInteraction}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as
                  | "patient"
                  | "doctor"
                  | "general";

                setTemplateType(value);
              }}
            >
              <SelectItem key="patient">Patient Templates</SelectItem>
              <SelectItem key="doctor">Doctor Templates</SelectItem>
              <SelectItem key="general">General Templates</SelectItem>
            </Select>

            {/* Preset Templates Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Quick Presets</span>
                <span className="text-xs text-default-500">Click to apply</span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-default-200 rounded-lg p-3">
                {presetTemplates[templateType]?.map((preset, index) => (
                  <Button
                    key={index}
                    className="text-left justify-start h-auto p-2"
                    size="sm"
                    variant="flat"
                    onPress={() => applyPreset(preset)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-xs">{preset.name}</span>
                      <span className="text-xs text-default-500 truncate max-w-full">
                        {preset.message.substring(0, 80)}...
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Textarea
                isRequired
                label="Message"
                maxRows={8}
                minRows={4}
                placeholder="Enter template message or select a preset above"
                value={templateMessage}
                onChange={(e) => setTemplateMessage(e.target.value)}
              />
              <div className="flex justify-between items-center text-sm text-default-500">
                <span>Character count: {templateMessage.length}</span>
                <span>
                  SMS count: {Math.ceil(templateMessage.length / 160)}
                </span>
              </div>
              {templateMessage.includes("{") && (
                <div className="text-xs text-warning">
                  Note: Placeholders like {"{patientName}"} will be replaced
                  with actual values when sending SMS.
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={saving}
              variant="flat"
              onPress={() => {
                modalState.close();
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={!templateName.trim() || !templateMessage.trim()}
              isLoading={saving}
              onPress={handleSaveTemplate}
            >
              {saving ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SMSTemplatesTab;
