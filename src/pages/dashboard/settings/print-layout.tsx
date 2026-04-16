import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import {
  IoSaveOutline,
  IoImageOutline,
  IoPrintOutline,
  IoEyeOutline,
  IoArrowBackOutline,
  IoBusinessOutline,
  IoCallOutline,
  IoMailOutline,
  IoGlobeOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { Progress } from "@heroui/progress";

import { uploadImage } from "@/services/appwriteStorageService";
import { clinicService } from "@/services/clinicService";
import { useAuthContext } from "@/context/AuthContext";
import { title } from "@/components/primitives";
import {
  PrintLayoutConfig,
  createPrintLayoutConfig,
} from "@/types/printLayout";
import { PrintLayoutTemplate } from "@/components/PrintLayoutTemplate";

export default function PrintLayoutPage() {
  const navigate = useNavigate();
  const { clinicId, currentUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [clinic, setClinic] = useState<any>(null); // Store clinic object
  const [isPrinting, setIsPrinting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [layoutConfig, setLayoutConfig] = useState<PrintLayoutConfig>(
    createPrintLayoutConfig(clinicId || "", currentUser?.uid || ""),
  );

  useEffect(() => {
    const loadLayoutConfig = async () => {
      if (!clinicId) return;
      try {
        setLoading(true);
        // Always load clinic info
        const clinicObj = await clinicService.getClinicById(clinicId);

        setClinic(clinicObj);
        // Load existing print layout config
        const config = await clinicService.getPrintLayoutConfig(clinicId);

        if (config) {
          setLayoutConfig({
            ...config,
            clinicName: clinicObj?.name || config.clinicName || "",
            phone: config.phone || clinicObj?.phone || "",
            email: config.email || clinicObj?.email || "",
          });
        } else if (clinicObj) {
          setLayoutConfig((prev) => ({
            ...prev,
            clinicName: clinicObj.name || "",
            city: clinicObj.city || "",
            phone: clinicObj.phone || "",
            email: clinicObj.email || "",
          }));
        }
      } catch (error) {
        console.error("Error loading layout config:", error);
        addToast({
          title: "Error",
          description: "Failed to load print layout configuration",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    loadLayoutConfig();
  }, [clinicId]);

  const handleSave = async () => {
    if (!clinicId || !currentUser) return;

    try {
      setSaving(true);

      const configData = {
        ...layoutConfig,
        clinicId,
        updatedBy: currentUser.uid,
      };

      await clinicService.savePrintLayoutConfig(configData);

      addToast({
        title: "Success",
        description: "Print layout configuration saved successfully!",
        color: "success",
      });
    } catch (error) {
      console.error("Error saving layout config:", error);
      addToast({
        title: "Error",
        description: "Failed to save print layout configuration",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      addToast({
        title: "Invalid File Type",
        description: "Please select a valid image file (JPG, PNG, GIF, SVG)",
        color: "danger",
      });

      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      addToast({
        title: "File Too Large",
        description: "Image size should be less than 1MB",
        color: "danger",
      });

      return;
    }

    try {
      setIsUploading(true);

      // Show uploading toast with more details
      addToast({
        title: "Uploading Logo",
        description: `Uploading ${file.name}...`,
        color: "primary",
      });

      // Upload to Appwrite with optimization (max 800px width for logos)
      const uploadResult = await uploadImage(
        file,
        `clinic-${clinicId}-logo-${Date.now()}`,
        800, // max width
        800, // max height
      );

      // Update layout config with the new URL
      setLayoutConfig((prev) => ({
        ...prev,
        logoUrl: uploadResult.fileUrl,
        logoFileId: uploadResult.fileId, // Store file ID for future deletion if needed
      }));

      addToast({
        title: "Upload Successful!",
        description: `Logo uploaded and optimized. File size: ${(uploadResult.fileSize / 1024).toFixed(1)}KB`,
        color: "success",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      addToast({
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload logo. Please try again.",
        color: "danger",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);

    // Create a new window for printing
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (printWindow) {
      // Generate the HTML content for printing using the shared template structure
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Layout - ${clinic?.name || "Clinic"}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: #333;
            }
            .print-container {
              max-width: 100%;
              margin: 0;
              background: white;
              display: flex;
              flex-direction: column;
              height: 100vh;
              padding: 10mm;
              box-sizing: border-box;
            }
            .header {
              border-bottom: 2px solid #333;
              padding-bottom: ${
                layoutConfig.headerHeight === "compact"
                  ? "10px"
                  : layoutConfig.headerHeight === "expanded"
                    ? "20px"
                    : "15px"
              };
              margin-bottom: ${
                layoutConfig.headerHeight === "compact"
                  ? "10px"
                  : layoutConfig.headerHeight === "expanded"
                    ? "20px"
                    : "15px"
              };
            }
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 20px;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 20px;
              ${
                layoutConfig.logoPosition === "center"
                  ? "justify-content: center; text-align: center;"
                  : layoutConfig.logoPosition === "right"
                    ? "justify-content: flex-end; text-align: right;"
                    : "justify-content: flex-start; text-align: left;"
              }
            }
            .header-right {
              text-align: right;
              font-size: ${
                layoutConfig.fontSize === "small"
                  ? "11px"
                  : layoutConfig.fontSize === "large"
                    ? "14px"
                    : "12px"
              };
              color: #333;
              line-height: 1.4;
            }
            .logo {
              ${
                layoutConfig.logoSize === "small"
                  ? "height: 40px;"
                  : layoutConfig.logoSize === "large"
                    ? "height: 80px;"
                    : "height: 60px;"
              }
              width: auto;
              object-fit: contain;
            }
            .clinic-info {
              ${layoutConfig.logoPosition === "center" ? "text-align: center;" : ""}
            }
            .clinic-name {
              font-weight: bold;
              color: ${layoutConfig.primaryColor};
              margin: 0;
              ${
                layoutConfig.fontSize === "small"
                  ? "font-size: 20px;"
                  : layoutConfig.fontSize === "large"
                    ? "font-size: 30px;"
                    : "font-size: 26px;"
              }
            }
            .tagline {
              font-size: ${
                layoutConfig.fontSize === "small"
                  ? "12px"
                  : layoutConfig.fontSize === "large"
                    ? "16px"
                    : "14px"
              };
              color: #666;
              margin: 5px 0;
            }
            .clinic-details {
              margin-top: 10px;
              color: #333;
              ${
                layoutConfig.fontSize === "small"
                  ? "font-size: 11px;"
                  : layoutConfig.fontSize === "large"
                    ? "font-size: 14px;"
                    : "font-size: 12px;"
              }
            }
            .content {
              flex: 1;
              padding: 10px 0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 0;
            }
            .content-placeholder {
              text-align: center;
              color: #999;
              font-size: 18px;
            }
            .footer {
              border-top: 1px solid #333;
              padding-top: 10px;
              margin-top: auto;
              text-align: center;
              ${
                layoutConfig.fontSize === "small"
                  ? "font-size: 11px;"
                  : layoutConfig.fontSize === "large"
                    ? "font-size: 13px;"
                    : "font-size: 12px;"
              }
              color: #666;
              flex-shrink: 0;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .print-container {
                height: 100vh;
                padding: 5mm;
                max-width: 100%;
                box-sizing: border-box;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <div class="header-content">
                <div class="header-left">
                  ${
                    layoutConfig.logoUrl
                      ? `
                    <img src="${layoutConfig.logoUrl}" alt="Logo" class="logo" />
                  `
                      : ""
                  }
                  <div class="clinic-info">
                    <h1 class="clinic-name">${clinic?.name || "Clinic Name"}</h1>
                    ${
                      layoutConfig.tagline
                        ? `
                      <p class="tagline">${layoutConfig.tagline}</p>
                    `
                        : ""
                    }
                    <div class="clinic-details">
                      <p>${layoutConfig.address}</p>
                      <p>${layoutConfig.city || clinic?.city || ""}${layoutConfig.state ? `, ${layoutConfig.state}` : ""} ${layoutConfig.zipCode || ""}</p>
                      ${layoutConfig.website ? `<p>Website: ${layoutConfig.website}</p>` : ""}
                    </div>
                  </div>
                </div>
                <div class="header-right">
                  <p><strong>Phone:</strong> ${layoutConfig.phone || clinic?.phone || ""}</p>
                  <p><strong>Email:</strong> ${layoutConfig.email || clinic?.email || ""}</p>
                </div>
              </div>
            </div>
            
            <div class="content">
              <div class="content-placeholder">
                <p><strong>Document Content Area</strong></p>
                <p>This is where your document content will appear</p>
              </div>
            </div>
            
            ${
              layoutConfig.showFooter && layoutConfig.footerText
                ? `
              <div class="footer">
                <p>${layoutConfig.footerText}</p>
              </div>
            `
                : ""
            }
          </div>
          
          <script>
            // Wait for images to load, then trigger print
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
              }, 500);
            });
            
            // Handle print dialog events
            window.addEventListener('afterprint', function() {
              window.close();
            });
            
            // Fallback to close window if user cancels print
            window.addEventListener('beforeunload', function() {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage('printComplete', '*');
              }
            });
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      // Listen for messages from the print window
      const handleMessage = (event: MessageEvent) => {
        if (event.data === "printComplete") {
          setIsPrinting(false);
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);

      // Fallback timeout to reset printing state
      setTimeout(() => {
        setIsPrinting(false);
        window.removeEventListener("message", handleMessage);
      }, 10000); // 10 seconds timeout
    } else {
      setIsPrinting(false);
      addToast({
        title: "Error",
        description:
          "Unable to open print window. Please check your browser settings.",
        color: "danger",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="flat"
            onPress={() => navigate("/dashboard/settings")}
          >
            <IoArrowBackOutline />
          </Button>
          <div>
            <h1 className={title({ size: "sm" })}>
              Print Layout Configuration
            </h1>
            <p className="text-default-500 mt-1">Loading configuration...</p>
          </div>
        </div>
        <Card>
          <CardBody className="flex items-center justify-center py-12">
            <Spinner label="Loading layout configuration..." size="lg" />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              variant="flat"
              onPress={() => navigate("/dashboard/settings")}
            >
              <IoArrowBackOutline />
            </Button>
            <div>
              <h1 className={title({ size: "sm" })}>
                Print Layout Configuration
              </h1>
              <p className="text-default-500 mt-1">
                Configure clinic letterhead and layout for all printable
                documents
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              color="secondary"
              startContent={<IoEyeOutline />}
              variant="bordered"
              onPress={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? "Edit Configuration" : "Preview Mode"}
            </Button>
            {!previewMode && (
              <Button
                color="default"
                isDisabled={isPrinting}
                isLoading={isPrinting}
                startContent={<IoPrintOutline />}
                variant="bordered"
                onPress={handlePrint}
              >
                {isPrinting ? "Printing..." : "Print Layout"}
              </Button>
            )}
            <Button
              color="primary"
              isDisabled={saving}
              isLoading={saving}
              startContent={<IoSaveOutline />}
              onPress={handleSave}
            >
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Mode Info - Show when in preview mode */}
          {previewMode && (
            <div className="lg:col-span-2">
              <Card className="border-l-4 border-l-primary">
                <CardBody className="py-4">
                  <div className="flex items-center gap-3">
                    <IoEyeOutline className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-primary">
                        Preview Mode Active
                      </p>
                      <p className="text-sm text-default-500">
                        You're viewing the print layout preview. Click "Edit" to
                        modify the configuration or "Print" to test the layout.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Configuration Form - Hide in preview mode */}
          {!previewMode && (
            <div className="space-y-6">
              {/* Clinic Information */}
              <Card>
                <CardHeader className="bg-default-50 border-b border-default-200">
                  <div className="flex items-center gap-2">
                    <IoBusinessOutline className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      Clinic Information
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input
                    isReadOnly
                    description="Clinic name is always fetched from your clinic profile. To change it, update your clinic profile."
                    label="Clinic Name"
                    value={clinic?.name || ""}
                    variant="flat"
                  />

                  <Input
                    label="Tagline"
                    placeholder="Your clinic's tagline or motto"
                    value={layoutConfig.tagline || ""}
                    onChange={(e) =>
                      setLayoutConfig((prev) => ({
                        ...prev,
                        tagline: e.target.value,
                      }))
                    }
                  />

                  <Textarea
                    isRequired
                    label="Address *"
                    minRows={2}
                    placeholder="Enter full address"
                    value={layoutConfig.address}
                    onChange={(e) =>
                      setLayoutConfig((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      description="You can override the city from clinic profile"
                      label="City (from clinic profile)"
                      placeholder="Loaded from clinic profile"
                      value={layoutConfig.city}
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="State/Province"
                      placeholder="State"
                      value={layoutConfig.state}
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="ZIP/Postal Code"
                      placeholder="ZIP Code"
                      value={layoutConfig.zipCode}
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({
                          ...prev,
                          zipCode: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Country"
                      placeholder="Country"
                      value={layoutConfig.country}
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      description={
                        clinic?.phone
                          ? `Default: ${clinic.phone}`
                          : "You can override the phone from clinic profile"
                      }
                      label="Phone (from clinic profile)"
                      placeholder={
                        clinic?.phone || "Loaded from clinic profile"
                      }
                      startContent={
                        <IoCallOutline className="text-default-400" />
                      }
                      value={
                        layoutConfig.phone !== ""
                          ? layoutConfig.phone
                          : clinic?.phone || ""
                      }
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                    <Input
                      description={
                        clinic?.email
                          ? `Default: ${clinic.email}`
                          : "You can override the email from clinic profile"
                      }
                      label="Email (from clinic profile)"
                      placeholder={
                        clinic?.email || "Loaded from clinic profile"
                      }
                      startContent={
                        <IoMailOutline className="text-default-400" />
                      }
                      type="email"
                      value={
                        layoutConfig.email !== ""
                          ? layoutConfig.email
                          : clinic?.email || ""
                      }
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <Input
                    label="Website"
                    placeholder="https://www.yourclinic.com"
                    startContent={
                      <IoGlobeOutline className="text-default-400" />
                    }
                    value={layoutConfig.website || ""}
                    onChange={(e) =>
                      setLayoutConfig((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                  />
                </CardBody>
              </Card>

              {/* Logo and Branding */}
              <Card>
                <CardHeader className="bg-default-50 border-b border-default-200">
                  <div className="flex items-center gap-2">
                    <IoImageOutline className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Logo & Branding</h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-default-700 mb-2">
                      Upload Logo
                    </label>
                    <div className="space-y-3">
                      {/* File Drop Zone */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          isUploading
                            ? "border-primary bg-primary/5 opacity-50"
                            : "border-default-300 hover:border-default-400 cursor-pointer"
                        }`}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];

                            if (file.type.startsWith("image/")) {
                              // Create a synthetic event-like object
                              const fileList = { 0: file, length: 1 };
                              const syntheticEvent = {
                                target: { files: fileList },
                              };

                              handleLogoUpload(syntheticEvent as any);
                            } else {
                              addToast({
                                title: "Invalid File Type",
                                description: "Please drop a valid image file",
                                color: "danger",
                              });
                            }
                          }
                        }}
                      >
                        <IoImageOutline className="w-10 h-10 mx-auto mb-3 text-default-400" />
                        <p className="text-default-600 mb-2">
                          Drag & drop a logo here, or click to select
                        </p>
                        <p className="text-xs text-default-500 mb-3">
                          Supports: JPG, PNG, GIF, SVG (Max 1MB)
                        </p>
                        <input
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          id="logo-upload"
                          type="file"
                          onChange={handleLogoUpload}
                        />
                        <Button
                          as="label"
                          className="cursor-pointer"
                          color="primary"
                          htmlFor="logo-upload"
                          isDisabled={isUploading}
                          size="sm"
                          variant="flat"
                        >
                          {isUploading ? "Uploading..." : "Choose Logo"}
                        </Button>
                      </div>

                      {isUploading && (
                        <div className="bg-default-100 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-sm text-default-600 mb-2">
                            <Spinner size="sm" />
                            <span>Uploading logo...</span>
                          </div>
                          <Progress
                            isIndeterminate
                            className="mb-2"
                            color="primary"
                            value={85}
                          />
                          <p className="text-xs text-default-500">
                            Your logo will be optimized and stored securely
                          </p>
                        </div>
                      )}

                      {layoutConfig.logoUrl && !isUploading && (
                        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <img
                              alt="Logo preview"
                              className="h-16 w-auto object-contain bg-white border border-default-200 rounded-lg p-2 flex-shrink-0"
                              src={layoutConfig.logoUrl}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-success-800 mb-1">
                                ✅ Logo uploaded successfully
                              </p>
                              <p className="text-xs text-success-600 mb-2">
                                Stored securely in cloud storage
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  color="primary"
                                  size="sm"
                                  startContent={
                                    <IoEyeOutline className="w-3 h-3" />
                                  }
                                  variant="flat"
                                  onClick={() =>
                                    window.open(layoutConfig.logoUrl, "_blank")
                                  }
                                >
                                  View
                                </Button>
                                <Button
                                  color="danger"
                                  size="sm"
                                  startContent={
                                    <IoTrashOutline className="w-3 h-3" />
                                  }
                                  variant="flat"
                                  onClick={() => {
                                    setLayoutConfig((prev) => ({
                                      ...prev,
                                      logoUrl: undefined,
                                    }));
                                    addToast({
                                      title: "Logo removed",
                                      description:
                                        "Logo removed from layout. Don't forget to save changes.",
                                      color: "warning",
                                    });
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Logo Position"
                      selectedKeys={[layoutConfig.logoPosition]}
                      onSelectionChange={(keys) => {
                        const position = Array.from(keys)[0] as
                          | "left"
                          | "center"
                          | "right";

                        setLayoutConfig((prev) => ({
                          ...prev,
                          logoPosition: position,
                        }));
                      }}
                    >
                      <SelectItem key="left">Left</SelectItem>
                      <SelectItem key="center">Center</SelectItem>
                      <SelectItem key="right">Right</SelectItem>
                    </Select>

                    <Select
                      label="Logo Size"
                      selectedKeys={[layoutConfig.logoSize]}
                      onSelectionChange={(keys) => {
                        const size = Array.from(keys)[0] as
                          | "small"
                          | "medium"
                          | "large";

                        setLayoutConfig((prev) => ({
                          ...prev,
                          logoSize: size,
                        }));
                      }}
                    >
                      <SelectItem key="small">Small</SelectItem>
                      <SelectItem key="medium">Medium</SelectItem>
                      <SelectItem key="large">Large</SelectItem>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Primary Color"
                      type="color"
                      value={layoutConfig.primaryColor}
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Secondary Color"
                      type="color"
                      value={layoutConfig.secondaryColor}
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({
                          ...prev,
                          secondaryColor: e.target.value,
                        }))
                      }
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Layout Settings */}
              <Card>
                <CardHeader className="bg-default-50 border-b border-default-200">
                  <div className="flex items-center gap-2">
                    <IoPrintOutline className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Layout Settings</h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show Footer</p>
                        <p className="text-sm text-default-500">
                          Display footer information on printed documents
                        </p>
                      </div>
                      <Switch
                        isSelected={layoutConfig.showFooter}
                        onValueChange={(value) =>
                          setLayoutConfig((prev) => ({
                            ...prev,
                            showFooter: value,
                          }))
                        }
                      />
                    </div>

                    {layoutConfig.showFooter && (
                      <Textarea
                        label="Footer Text"
                        minRows={2}
                        placeholder="Enter footer text (e.g., Thank you for choosing our clinic)"
                        value={layoutConfig.footerText || ""}
                        onChange={(e) =>
                          setLayoutConfig((prev) => ({
                            ...prev,
                            footerText: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>

                  <Divider />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Default: print pathology reports without letterhead
                          </p>
                          <p className="text-xs text-default-500">
                            When enabled, pathology reports will skip the
                            header/footer and use the top margin below.
                          </p>
                        </div>
                        <Switch
                          isSelected={
                            layoutConfig.defaultPathologyPrintWithoutLetterhead ??
                            false
                          }
                          size="sm"
                          onValueChange={(value) =>
                            setLayoutConfig((prev) => ({
                              ...prev,
                              defaultPathologyPrintWithoutLetterhead: value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <Input
                      description="Used when printing without letterhead (e.g., onto preprinted paper)."
                      label="Top margin for preprinted letterhead (mm)"
                      type="number"
                      value={
                        layoutConfig.contentTopMarginWithoutLetterheadMm !==
                        undefined
                          ? layoutConfig.contentTopMarginWithoutLetterheadMm.toString()
                          : "20"
                      }
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);

                        setLayoutConfig((prev) => ({
                          ...prev,
                          contentTopMarginWithoutLetterheadMm: Number.isNaN(
                            value,
                          )
                            ? undefined
                            : Math.max(value, 0),
                        }));
                      }}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Preview - Full width in preview mode */}
          <div
            className={`lg:sticky lg:top-6 ${previewMode ? "lg:col-span-2" : ""}`}
          >
            <Card>
              <CardHeader className="bg-default-50 border-b border-default-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IoEyeOutline className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      Print Layout Preview
                    </h3>
                  </div>
                  {previewMode && (
                    <div className="flex gap-2">
                      <Button
                        color="default"
                        isDisabled={isPrinting}
                        isLoading={isPrinting}
                        size="sm"
                        startContent={<IoPrintOutline />}
                        variant="flat"
                        onPress={handlePrint}
                      >
                        {isPrinting ? "Printing..." : "Print"}
                      </Button>
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<IoEyeOutline />}
                        variant="flat"
                        onPress={() => setPreviewMode(false)}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <PrintLayoutTemplate
                  className={`${previewMode ? "min-h-[800px]" : "min-h-[600px]"} print-preview`}
                  clinicName={clinic?.name}
                  layoutConfig={layoutConfig}
                  showInPrint={true}
                >
                  {/* Sample Content - This will take up the remaining space */}
                  <div
                    className="flex-1 flex items-center justify-center"
                    style={{ padding: previewMode ? "20px" : "10px" }}
                  >
                    <div className="text-center text-gray-400">
                      <p className="text-lg font-medium">
                        Document Content Area
                      </p>
                      <p className="text-sm mt-2">
                        This is where your document content will appear
                      </p>
                    </div>
                  </div>
                </PrintLayoutTemplate>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
