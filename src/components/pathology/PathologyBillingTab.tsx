import React, { useState, useEffect, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Tab, Tabs } from "@heroui/tabs";
import { addToast } from "@heroui/toast";
import {
  IoAddOutline,
  IoTrashOutline,
  IoEyeOutline,
  IoWalletOutline,
  IoCheckmark,
  IoTime,
  IoClose,
  IoSearchOutline,
  IoPrintOutline,
} from "react-icons/io5";

import { useAuthContext } from "@/context/AuthContext";
import { useModalState } from "@/hooks/useModalState";
import { pathologyBillingService } from "@/services/pathologyBillingService";
import { pathologyService } from "@/services/pathologyService";
import { clinicService } from "@/services/clinicService";
import {
  PathologyBilling,
  PathologyBillingItem,
  PathologyBillingSettings,
  PathologyTest,
  PathologyTestType,
  PathologyTestName,
} from "@/types/models";
import { PrintLayoutConfig } from "@/types/printLayout";

interface PathologyBillingTabProps {
  clinicId: string;
  branchId: string;
}

interface InvoiceFormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAddress: string;
  patientAge: string;
  patientGender: string;
  invoiceDate: string;
  items: PathologyBillingItem[];
  discountType: "flat" | "percent";
  discountValue: number;
  notes: string;
}

export default function PathologyBillingTab({
  clinicId,
  branchId,
}: PathologyBillingTabProps) {
  const { currentUser, userData } = useAuthContext();
  const invoiceModal = useModalState(false);
  const paymentModal = useModalState(false);
  const settingsModal = useModalState(false);

  const [activeTab, setActiveTab] = useState("create");

  // Data states
  const [tests, setTests] = useState<PathologyTest[]>([]);
  const [testTypes, setTestTypes] = useState<PathologyTestType[]>([]);
  const [testNames, setTestNames] = useState<PathologyTestName[]>([]);
  const [billings, setBillings] = useState<PathologyBilling[]>([]);
  const [billingSettings, setBillingSettings] =
    useState<PathologyBillingSettings | null>(null);
  const [layoutConfig, setLayoutConfig] = useState<PrintLayoutConfig | null>(
    null,
  );
  const [clinic, setClinic] = useState<any>(null);

  // Form states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBilling, setSelectedBilling] =
    useState<PathologyBilling | null>(null);

  // Payment states
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [selectedBillingForPayment, setSelectedBillingForPayment] =
    useState<PathologyBilling | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "cash",
    reference: "",
    notes: "",
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Form data
  const [formData, setFormData] = useState<InvoiceFormData>({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    patientAddress: "",
    patientAge: "",
    patientGender: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    items: [],
    discountType: "percent",
    discountValue: 0,
    notes: "",
  });

  // Calculations
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    loadData();
  }, [clinicId, branchId]);

  useEffect(() => {
    calculateTotals();
  }, [
    formData.items,
    formData.discountType,
    formData.discountValue,
    billingSettings,
  ]);

  const loadData = async () => {
    if (!clinicId || !branchId) return;

    try {
      setLoading(true);
      const [
        testsData,
        testTypesData,
        testNamesData,
        billingsData,
        settingsData,
        clinicData,
        layoutConfigData,
      ] = await Promise.all([
        pathologyService.getTestsByClinic(clinicId, branchId),
        pathologyService.getTestTypesByClinic(clinicId, branchId),
        pathologyService.getTestNamesByClinic(clinicId, branchId),
        pathologyBillingService.getBillingByClinic(clinicId, branchId),
        pathologyBillingService.getBillingSettings(clinicId),
        clinicService.getClinicById(clinicId),
        clinicService.getPrintLayoutConfig(clinicId),
      ]);

      setTests(testsData);
      setTestTypes(testTypesData);
      setTestNames(testNamesData);
      setBillings(billingsData);
      setBillingSettings(settingsData);
      setClinic(clinicData);
      setLayoutConfig(layoutConfigData);

      // Initialize settings if they don't exist
      if (!settingsData && currentUser) {
        const defaultSettings =
          pathologyBillingService.getDefaultBillingSettings(
            clinicId,
            currentUser.uid,
          );

        await pathologyBillingService.updateBillingSettings(
          clinicId,
          branchId,
          defaultSettings,
          currentUser.uid,
        );
        const updatedSettings =
          await pathologyBillingService.getBillingSettings(clinicId);

        if (updatedSettings) {
          setBillingSettings(updatedSettings);
        }
      }

      // Set default discount values from settings
      if (settingsData) {
        setFormData((prev) => ({
          ...prev,
          discountType: settingsData.defaultDiscountType,
          discountValue: settingsData.defaultDiscountValue,
        }));
      }
    } catch (error) {
      console.error("Error loading pathology billing data:", error);
      addToast({
        title: "Error",
        description: "Failed to load billing data. Please try again.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!formData.items.length || !billingSettings) {
      setCalculations({
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
      });

      return;
    }

    // Calculate subtotal by summing all item amounts
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (item.amount || 0),
      0,
    );

    // Calculate discount
    let discountAmount = 0;

    if (formData.discountType === "flat") {
      discountAmount = Math.min(formData.discountValue, subtotal);
    } else if (formData.discountType === "percent") {
      discountAmount = (subtotal * formData.discountValue) / 100;
    }

    // Calculate amount after discount
    const amountAfterDiscount = subtotal - discountAmount;

    // Calculate tax
    const taxPercentage = billingSettings.enableTax
      ? billingSettings.defaultTaxPercentage
      : 0;
    const taxAmount = (amountAfterDiscount * taxPercentage) / 100;

    // Calculate total
    const totalAmount = amountAfterDiscount + taxAmount;

    setCalculations({
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    });
  };

  const addInvoiceItem = () => {
    const newItem: PathologyBillingItem = {
      id: `item_${Date.now()}`,
      testId: "",
      testName: "",
      testType: "",
      price: 0,
      quantity: 1,
      amount: 0,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateInvoiceItem = (
    index: number,
    field: keyof PathologyBillingItem,
    value: any,
  ) => {
    const updatedItems = [...formData.items];

    if (field === "testName") {
      updatedItems[index] = {
        ...updatedItems[index],
        testName: value,
        // Keep testId empty for manual entries
        testId: "",
      };
    } else if (field === "testType") {
      const selectedTestType = testTypes.find((tt) => tt.name === value);

      updatedItems[index] = {
        ...updatedItems[index],
        testType: value || "",
        price: selectedTestType
          ? selectedTestType.price
          : updatedItems[index].price,
        amount:
          (selectedTestType
            ? selectedTestType.price
            : updatedItems[index].price) * updatedItems[index].quantity,
      };
    } else if (field === "quantity") {
      const qty = parseFloat(value) || 1;

      updatedItems[index] = {
        ...updatedItems[index],
        quantity: qty,
        amount: updatedItems[index].price * qty,
      };
    } else if (field === "price") {
      const price = parseFloat(value) || 0;

      updatedItems[index] = {
        ...updatedItems[index],
        price: price,
        amount: price * updatedItems[index].quantity,
      };
    } else if (field === "amount") {
      updatedItems[index] = {
        ...updatedItems[index],
        amount: parseFloat(value) || 0,
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const removeInvoiceItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!clinicId || !currentUser || !billingSettings) return;

    // Validation
    if (!formData.patientName.trim() || !formData.items.length) {
      addToast({
        title: "Validation Error",
        description:
          "Please fill in patient name and add at least one test item.",
        color: "warning",
      });

      return;
    }

    const hasValidItems = formData.items.every(
      (item) =>
        item.testName.trim() &&
        item.quantity > 0 &&
        item.price >= 0 &&
        item.amount >= 0,
    );

    if (!hasValidItems) {
      addToast({
        title: "Validation Error",
        description:
          "Please ensure all invoice items have test name, quantity, price, and amount.",
        color: "warning",
      });

      return;
    }

    try {
      setSubmitting(true);

      // Generate invoice number
      const invoiceNumber =
        await pathologyBillingService.generateInvoiceNumber(clinicId);

      // Create billing record
      const billingData: Omit<
        PathologyBilling,
        "id" | "createdAt" | "updatedAt"
      > = {
        invoiceNumber,
        clinicId,
        branchId,
        patientName: formData.patientName.trim(),
        patientEmail: formData.patientEmail.trim() || undefined,
        patientPhone: formData.patientPhone.trim() || undefined,
        patientAddress: formData.patientAddress.trim() || undefined,
        patientAge: formData.patientAge
          ? parseInt(formData.patientAge)
          : undefined,
        patientGender: formData.patientGender.trim() || undefined,
        invoiceDate: new Date(formData.invoiceDate),
        items: formData.items,
        subtotal: calculations.subtotal,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        discountAmount: calculations.discountAmount,
        taxPercentage: billingSettings.enableTax
          ? billingSettings.defaultTaxPercentage
          : 0,
        taxAmount: calculations.taxAmount,
        totalAmount: calculations.totalAmount,
        status: "draft",
        paymentStatus: "unpaid",
        paidAmount: 0,
        balanceAmount: calculations.totalAmount,
        notes: formData.notes.trim() || undefined,
        createdBy: currentUser.uid,
      };

      await pathologyBillingService.createBilling(billingData);

      addToast({
        title: "Success",
        description: "Pathology invoice created successfully",
        color: "success",
      });

      // Reset form
      setFormData({
        patientName: "",
        patientEmail: "",
        patientPhone: "",
        patientAddress: "",
        patientAge: "",
        patientGender: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        items: [],
        discountType: billingSettings.defaultDiscountType,
        discountValue: billingSettings.defaultDiscountValue,
        notes: "",
      });

      // Reload billings
      await loadData();

      // Switch to manage tab
      setActiveTab("manage");
      invoiceModal.forceClose();
    } catch (error) {
      console.error("Error creating pathology invoice:", error);
      addToast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentOpen = (billing: PathologyBilling) => {
    setSelectedBillingForPayment(billing);
    setPaymentForm({
      amount: billing.balanceAmount.toString(),
      method: billingSettings?.defaultPaymentMethod || "cash",
      reference: "",
      notes: "",
    });
    paymentModal.open();
  };

  const handlePaymentSubmit = async () => {
    if (!selectedBillingForPayment || !clinicId) return;

    const amount = parseFloat(paymentForm.amount);

    if (isNaN(amount) || amount <= 0) {
      addToast({
        title: "Validation Error",
        description: "Please enter a valid payment amount",
        color: "warning",
      });

      return;
    }

    if (amount > selectedBillingForPayment.balanceAmount) {
      addToast({
        title: "Validation Error",
        description: `Payment amount cannot exceed balance of ${selectedBillingForPayment.balanceAmount.toLocaleString()}`,
        color: "warning",
      });

      return;
    }

    try {
      setPaymentProcessing(true);

      await pathologyBillingService.recordPayment(
        selectedBillingForPayment.id,
        amount,
        paymentForm.method,
        paymentForm.reference || undefined,
        paymentForm.notes || undefined,
      );

      addToast({
        title: "Payment Recorded",
        description: `Payment of ${amount.toLocaleString()} has been recorded successfully.`,
        color: "success",
      });

      // Reload billings
      const updatedBillings = await pathologyBillingService.getBillingByClinic(
        clinicId,
        branchId,
      );

      setBillings(updatedBillings);

      // Close payment modal
      paymentModal.forceClose();
      setSelectedBillingForPayment(null);
      setPaymentForm({ amount: "", method: "cash", reference: "", notes: "" });
    } catch (error) {
      console.error("Error recording payment:", error);
      addToast({
        title: "Payment Error",
        description: "Failed to record payment. Please try again.",
        color: "danger",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "unpaid":
        return "danger";
      default:
        return "default";
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return IoCheckmark;
      case "partial":
        return IoTime;
      case "unpaid":
        return IoClose;
      default:
        return IoTime;
    }
  };

  const filteredBillings = useMemo(() => {
    if (!searchQuery.trim()) return billings;
    const query = searchQuery.toLowerCase();

    return billings.filter(
      (billing) =>
        billing.invoiceNumber.toLowerCase().includes(query) ||
        billing.patientName.toLowerCase().includes(query) ||
        (billing.patientPhone &&
          billing.patientPhone.toLowerCase().includes(query)),
    );
  }, [billings, searchQuery]);

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAvailablePaymentMethods = () => {
    if (!billingSettings?.paymentMethods) return [];

    return billingSettings.paymentMethods.filter((method) => method.isEnabled);
  };

  const handlePrint = (billing: PathologyBilling) => {
    if (!billing) return;

    // Create a new window for printing
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (!printWindow) {
      addToast({
        title: "Error",
        description:
          "Unable to open print window. Please check your browser settings.",
        color: "danger",
      });

      return;
    }

    // Build the items HTML
    const itemsHtml = billing.items
      .map(
        (item) =>
          `<tr>
        <td class="text-left">${item.testName}${item.testType ? ` (${item.testType})` : ""}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">NPR ${item.price.toLocaleString()}</td>
        <td class="text-right">NPR ${item.amount.toLocaleString()}</td>
      </tr>`,
      )
      .join("");

    // Generate the HTML content for printing with dynamic clinic data
    const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>Pathology Invoice - ${billing.invoiceNumber}</title>
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
        layoutConfig?.headerHeight === "compact"
          ? "10px"
          : layoutConfig?.headerHeight === "expanded"
            ? "20px"
            : "15px"
      };
      margin-bottom: ${
        layoutConfig?.headerHeight === "compact"
          ? "10px"
          : layoutConfig?.headerHeight === "expanded"
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
        layoutConfig?.logoPosition === "center"
          ? "justify-content: center; text-align: center;"
          : layoutConfig?.logoPosition === "right"
            ? "justify-content: flex-end; text-align: right;"
            : "justify-content: flex-start; text-align: left;"
      }
    }
    .header-right {
      text-align: right;
      font-size: ${
        layoutConfig?.fontSize === "small"
          ? "11px"
          : layoutConfig?.fontSize === "large"
            ? "14px"
            : "12px"
      };
      color: #333;
      line-height: 1.4;
    }
    .logo {
      ${
        layoutConfig?.logoSize === "small"
          ? "height: 40px;"
          : layoutConfig?.logoSize === "large"
            ? "height: 80px;"
            : "height: 60px;"
      }
      width: auto;
      object-fit: contain;
    }
    .clinic-info {
      ${layoutConfig?.logoPosition === "center" ? "text-align: center;" : ""}
    }
    .clinic-name {
      font-weight: bold;
      color: ${layoutConfig?.primaryColor || "#2563eb"};
      margin: 0;
      font-size: ${
        layoutConfig?.fontSize === "small"
          ? "20px"
          : layoutConfig?.fontSize === "large"
            ? "30px"
            : "26px"
      };
    }
    .tagline {
      font-size: ${
        layoutConfig?.fontSize === "small"
          ? "12px"
          : layoutConfig?.fontSize === "large"
            ? "16px"
            : "14px"
      };
      color: #666;
      margin: 5px 0;
    }
    .clinic-details {
      margin-top: 10px;
      color: #333;
      font-size: ${
        layoutConfig?.fontSize === "small"
          ? "11px"
          : layoutConfig?.fontSize === "large"
            ? "14px"
            : "12px"
      };
    }
    .document-title {
      text-align: center;
      margin: 20px 0;
    }
    .document-title h2 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      text-transform: uppercase;
    }
    .document-subtitle {
      font-size: 14px;
      color: #666;
      margin: 5px 0;
    }
    .document-info {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 14px;
      color: #666;
    }
    .content {
      flex: 1;
      padding: 10px 0;
      min-height: 0;
    }
    .bill-to-section {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .bill-to-section h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .bill-to-section p {
      margin: 5px 0;
      font-size: 12px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th,
    .items-table td {
      border: 1px solid #333;
      padding: 8px;
      font-size: 12px;
    }
    .items-table th {
      background-color: #f5f5f5;
      font-weight: bold;
      text-align: center;
    }
    .items-table td.text-left {
      text-align: left;
    }
    .items-table td.text-center {
      text-align: center;
    }
    .items-table td.text-right {
      text-align: right;
    }
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .summary-table {
      width: 250px;
      border-collapse: collapse;
    }
    .summary-table td {
      border: 1px solid #333;
      padding: 8px;
      font-size: 12px;
    }
    .summary-table .font-bold {
      font-weight: bold;
    }
    .payment-section {
      margin-top: 30px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .payment-section h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .footer {
      border-top: 1px solid #333;
      padding-top: 10px;
      margin-top: auto;
      text-align: center;
      font-size: ${
        layoutConfig?.fontSize === "small"
          ? "11px"
          : layoutConfig?.fontSize === "large"
            ? "13px"
            : "12px"
      };
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
            layoutConfig?.logoUrl
              ? `
            <img src="${layoutConfig.logoUrl}" alt="Logo" class="logo" />
          `
              : ""
          }
          <div class="clinic-info">
            <h1 class="clinic-name">${clinic?.name || layoutConfig?.clinicName || "Clinic Name"}</h1>
            ${
              layoutConfig?.tagline
                ? `
              <p class="tagline">${layoutConfig.tagline}</p>
            `
                : ""
            }
            <div class="clinic-details">
              <p>${layoutConfig?.address || clinic?.address || ""}</p>
              <p>${layoutConfig?.city || clinic?.city || ""}${layoutConfig?.state ? `, ${layoutConfig.state}` : ""} ${layoutConfig?.zipCode || ""}</p>
              ${layoutConfig?.website ? `<p>Website: ${layoutConfig.website}</p>` : ""}
            </div>
          </div>
        </div>
        <div class="header-right">
          <p><strong>Phone:</strong> ${layoutConfig?.phone || clinic?.phone || ""}</p>
          <p><strong>Email:</strong> ${layoutConfig?.email || clinic?.email || ""}</p>
        </div>
      </div>
    </div>
    
    <div class="document-title">
      <h2>Pathology Invoice</h2>
      <p class="document-subtitle">Laboratory Test Billing</p>
      <div class="document-info">
        <span>Invoice No: ${billing.invoiceNumber}</span>
        <span>Date: ${new Date(billing.invoiceDate).toLocaleDateString()}</span>
      </div>
    </div>
    
    <div class="content">
      <div class="bill-to-section">
        <h3>Bill To:</h3>
        <p><strong>Name: ${billing.patientName}</strong></p>
        ${billing.patientAddress ? `<p style="margin: 2px 0; font-size: 12px; color: #666;">Address: ${billing.patientAddress}</p>` : ""}
        ${billing.patientPhone ? `<p style="margin: 2px 0; font-size: 12px; color: #666;">Phone: ${billing.patientPhone}</p>` : ""}
        ${billing.patientEmail ? `<p style="margin: 2px 0; font-size: 12px; color: #666;">Email: ${billing.patientEmail}</p>` : ""}
        ${billing.patientAge ? `<p style="margin: 2px 0; font-size: 12px; color: #666;">Age: ${billing.patientAge}</p>` : ""}
        ${billing.patientGender ? `<p style="margin: 2px 0; font-size: 12px; color: #666;">Gender: ${billing.patientGender.charAt(0).toUpperCase() + billing.patientGender.slice(1)}</p>` : ""}
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Test Name (Type)</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="summary-section">
        <table class="summary-table">
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td class="text-right">NPR ${billing.subtotal.toLocaleString()}</td>
            </tr>
            ${
              billing.discountAmount > 0
                ? `
            <tr>
              <td>Discount (${billing.discountType === "flat" ? "Flat" : "Percent"})</td>
              <td class="text-right">- NPR ${billing.discountAmount.toLocaleString()}</td>
            </tr>
            `
                : ""
            }
            ${
              billing.taxAmount > 0
                ? `
            <tr>
              <td>Tax (${billing.taxPercentage}%)</td>
              <td class="text-right">NPR ${billing.taxAmount.toLocaleString()}</td>
            </tr>
            `
                : ""
            }
            <tr class="font-bold">
              <td>Total Amount</td>
              <td class="text-right">NPR ${billing.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Paid Amount</td>
              <td class="text-right">NPR ${billing.paidAmount.toLocaleString()}</td>
            </tr>
            <tr class="font-bold">
              <td>Balance</td>
              <td class="text-right">NPR ${billing.balanceAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      ${
        billing.paymentMethod
          ? `
      <div class="payment-section">
        <h3>Payment Information</h3>
        <p><strong>Payment Method:</strong> ${billing.paymentMethod}</p>
        ${billing.paymentReference ? `<p><strong>Reference:</strong> ${billing.paymentReference}</p>` : ""}
        ${billing.paymentDate ? `<p><strong>Payment Date:</strong> ${new Date(billing.paymentDate).toLocaleDateString()}</p>` : ""}
        ${billing.paymentNotes ? `<p><strong>Notes:</strong> ${billing.paymentNotes}</p>` : ""}
      </div>
      `
          : ""
      }
      
      ${
        billing.notes
          ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px;">Notes:</h3>
        <p style="margin: 0; font-size: 12px;">
          ${billing.notes}
        </p>
      </div>
      `
          : ""
      }
    </div>
    
    <div class="footer">
      <p>Thank you for choosing us</p>
    </div>
  </div>
  
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
    
    window.addEventListener('afterprint', function() {
      window.close();
    });
    
    window.addEventListener('beforeunload', function() {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage('printComplete', '*');
      }
    });
  </script>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-default-500">Loading billing data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        className="w-full"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        {/* Create Invoice Tab */}
        <Tab key="create" title="Create Invoice">
          <div className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">New Pathology Invoice</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Patient Information */}
                <div>
                  <h4 className="text-md font-medium mb-3">
                    Patient Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      isRequired
                      label="Patient Name *"
                      placeholder="Enter patient name"
                      value={formData.patientName}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, patientName: value }))
                      }
                    />
                    <Input
                      label="Phone"
                      placeholder="Enter phone number"
                      value={formData.patientPhone}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          patientPhone: value,
                        }))
                      }
                    />
                    <Input
                      label="Email"
                      placeholder="Enter email address"
                      type="email"
                      value={formData.patientEmail}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          patientEmail: value,
                        }))
                      }
                    />
                    <Input
                      label="Address"
                      placeholder="Enter address"
                      value={formData.patientAddress}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          patientAddress: value,
                        }))
                      }
                    />
                    <Input
                      label="Age"
                      placeholder="Enter age"
                      type="number"
                      value={formData.patientAge}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, patientAge: value }))
                      }
                    />
                    <Select
                      label="Gender"
                      placeholder="Select gender"
                      selectedKeys={
                        formData.patientGender ? [formData.patientGender] : []
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;

                        setFormData((prev) => ({
                          ...prev,
                          patientGender: selected || "",
                        }));
                      }}
                    >
                      <SelectItem key="male" value="male">
                        Male
                      </SelectItem>
                      <SelectItem key="female" value="female">
                        Female
                      </SelectItem>
                      <SelectItem key="other" value="other">
                        Other
                      </SelectItem>
                    </Select>
                  </div>
                </div>

                {/* Invoice Items */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium">Test Items</h4>
                    <Button
                      color="primary"
                      size="sm"
                      startContent={<IoAddOutline />}
                      onPress={addInvoiceItem}
                    >
                      Add Test
                    </Button>
                  </div>

                  {formData.items.length > 0 ? (
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg"
                        >
                          <div className="col-span-3">
                            <Autocomplete
                              isRequired
                              defaultItems={testNames}
                              label="Test Name *"
                              placeholder="Search and select test name"
                              popoverProps={{
                                shouldCloseOnBlur: false,
                                classNames: {
                                  content: "max-h-60 overflow-auto z-[1001]",
                                },
                              }}
                              selectedKey={item.testName || null}
                              onOpenChange={
                                invoiceModal.handleDropdownInteraction
                              }
                              onSelectionChange={(key) => {
                                const selectedName = key ? key.toString() : "";

                                updateInvoiceItem(
                                  index,
                                  "testName",
                                  selectedName,
                                );
                              }}
                            >
                              {(testName) => (
                                <AutocompleteItem
                                  key={testName.name}
                                  textValue={testName.name}
                                >
                                  {testName.name}
                                </AutocompleteItem>
                              )}
                            </Autocomplete>
                          </div>
                          <div className="col-span-3">
                            <Autocomplete
                              defaultItems={testTypes}
                              label="Test Type"
                              placeholder="Search and select test type"
                              popoverProps={{
                                shouldCloseOnBlur: false,
                                classNames: {
                                  content: "max-h-60 overflow-auto z-[1001]",
                                },
                              }}
                              selectedKey={item.testType || null}
                              onOpenChange={
                                invoiceModal.handleDropdownInteraction
                              }
                              onSelectionChange={(key) => {
                                const selectedName = key ? key.toString() : "";

                                updateInvoiceItem(
                                  index,
                                  "testType",
                                  selectedName || "",
                                );
                              }}
                            >
                              {(testType) => (
                                <AutocompleteItem
                                  key={testType.name}
                                  textValue={`${testType.name} - NPR ${testType.price.toFixed(2)}`}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-small">
                                      {testType.name}
                                    </span>
                                    <span className="text-tiny text-default-400">
                                      NPR {testType.price.toFixed(2)}
                                    </span>
                                  </div>
                                </AutocompleteItem>
                              )}
                            </Autocomplete>
                          </div>
                          <div className="col-span-2">
                            <Input
                              isRequired
                              label="Price *"
                              placeholder="0.00"
                              type="number"
                              value={item.price.toString()}
                              onValueChange={(value) =>
                                updateInvoiceItem(index, "price", value)
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              isRequired
                              label="Quantity *"
                              min={1}
                              placeholder="1"
                              type="number"
                              value={item.quantity.toString()}
                              onValueChange={(value) =>
                                updateInvoiceItem(index, "quantity", value)
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              isRequired
                              label="Amount *"
                              placeholder="0.00"
                              type="number"
                              value={item.amount.toString()}
                              onValueChange={(value) =>
                                updateInvoiceItem(index, "amount", value)
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <Button
                              color="danger"
                              size="sm"
                              startContent={<IoTrashOutline />}
                              variant="light"
                              onPress={() => removeInvoiceItem(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-default-500 text-sm">
                      No items added yet. Click "Add Test" to add items.
                    </p>
                  )}
                </div>

                {/* Discount and Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Discount Type"
                      selectedKeys={new Set([formData.discountType])}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as "flat" | "percent";

                        setFormData((prev) => ({
                          ...prev,
                          discountType: value,
                        }));
                      }}
                    >
                      <SelectItem key="flat">Flat Amount</SelectItem>
                      <SelectItem key="percent">Percentage</SelectItem>
                    </Select>
                  </div>
                  <div>
                    <Input
                      label="Discount Value"
                      type="number"
                      value={formData.discountValue.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          discountValue: parseFloat(value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.subtotal)}
                      </span>
                    </div>
                    {calculations.discountAmount > 0 && (
                      <div className="flex justify-between text-warning">
                        <span>Discount:</span>
                        <span>
                          -{formatCurrency(calculations.discountAmount)}
                        </span>
                      </div>
                    )}
                    {billingSettings?.enableTax &&
                      calculations.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>
                            Tax ({billingSettings.defaultTaxPercentage}%):
                          </span>
                          <span>{formatCurrency(calculations.taxAmount)}</span>
                        </div>
                      )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(calculations.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <Input
                  label="Notes"
                  placeholder="Additional notes (optional)"
                  value={formData.notes}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, notes: value }))
                  }
                />

                <Button
                  className="w-full"
                  color="primary"
                  isDisabled={
                    !formData.patientName.trim() || formData.items.length === 0
                  }
                  isLoading={submitting}
                  size="lg"
                  onPress={handleSubmit}
                >
                  Create Invoice
                </Button>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Manage Invoices Tab */}
        <Tab key="manage" title="Manage Invoices">
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <Input
                className="w-80"
                placeholder="Search by invoice number or patient name..."
                startContent={<IoSearchOutline />}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </div>

            {filteredBillings.length > 0 ? (
              <Table aria-label="Pathology invoices table">
                <TableHeader>
                  <TableColumn>INVOICE #</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>PATIENT</TableColumn>
                  <TableColumn>ITEMS</TableColumn>
                  <TableColumn>TOTAL</TableColumn>
                  <TableColumn>PAID</TableColumn>
                  <TableColumn>BALANCE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredBillings.map((billing) => {
                    const StatusIcon = getPaymentStatusIcon(
                      billing.paymentStatus,
                    );

                    return (
                      <TableRow key={billing.id}>
                        <TableCell>
                          <span className="font-medium">
                            {billing.invoiceNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(billing.invoiceDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{billing.patientName}</p>
                            {billing.patientPhone && (
                              <p className="text-xs text-default-500">
                                {billing.patientPhone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{billing.items.length}</TableCell>
                        <TableCell>
                          {formatCurrency(billing.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(billing.paidAmount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              billing.balanceAmount > 0
                                ? "text-danger font-semibold"
                                : "text-success font-semibold"
                            }
                          >
                            {formatCurrency(billing.balanceAmount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={getPaymentStatusColor(billing.paymentStatus)}
                            size="sm"
                            startContent={<StatusIcon size={14} />}
                            variant="flat"
                          >
                            {billing.paymentStatus.toUpperCase()}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {billing.balanceAmount > 0 && (
                              <Button
                                color="success"
                                size="sm"
                                startContent={<IoWalletOutline />}
                                variant="flat"
                                onPress={() => handlePaymentOpen(billing)}
                              >
                                Pay
                              </Button>
                            )}
                            <Button
                              size="sm"
                              startContent={<IoEyeOutline />}
                              variant="light"
                              onPress={() => {
                                setSelectedBilling(billing);
                                invoiceModal.open();
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-default-500">
                  {searchQuery ? "No invoices found" : "No invoices yet"}
                </p>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModal.isOpen}
        size="lg"
        onClose={paymentModal.close}
      >
        <ModalContent>
          <ModalHeader>Record Payment</ModalHeader>
          <ModalBody className="space-y-4">
            {selectedBillingForPayment && (
              <>
                <div>
                  <p className="text-sm text-default-500">Invoice Number</p>
                  <p className="font-medium">
                    {selectedBillingForPayment.invoiceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Patient</p>
                  <p className="font-medium">
                    {selectedBillingForPayment.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Total Amount</p>
                  <p className="font-medium">
                    {formatCurrency(selectedBillingForPayment.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Balance</p>
                  <p className="font-medium text-danger">
                    {formatCurrency(selectedBillingForPayment.balanceAmount)}
                  </p>
                </div>
                <Input
                  isRequired
                  label="Payment Amount *"
                  type="number"
                  value={paymentForm.amount}
                  onValueChange={(value) =>
                    setPaymentForm((prev) => ({ ...prev, amount: value }))
                  }
                />
                <Select
                  isRequired
                  disallowEmptySelection={false}
                  label="Payment Method *"
                  selectedKeys={
                    paymentForm.method
                      ? new Set([paymentForm.method])
                      : new Set()
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    if (selectedKey) {
                      setPaymentForm((prev) => ({
                        ...prev,
                        method: selectedKey,
                      }));
                    }
                  }}
                >
                  {getAvailablePaymentMethods().map((method) => {
                    const displayText =
                      `${method.icon || ""} ${method.name}`.trim();

                    return (
                      <SelectItem key={method.key} textValue={method.name}>
                        {displayText}
                      </SelectItem>
                    );
                  })}
                </Select>
                <Input
                  label="Reference/Transaction ID"
                  placeholder="Optional"
                  value={paymentForm.reference}
                  onValueChange={(value) =>
                    setPaymentForm((prev) => ({ ...prev, reference: value }))
                  }
                />
                <Input
                  label="Notes"
                  placeholder="Optional payment notes"
                  value={paymentForm.notes}
                  onValueChange={(value) =>
                    setPaymentForm((prev) => ({ ...prev, notes: value }))
                  }
                />
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={paymentModal.close}>
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={paymentProcessing}
              onPress={handlePaymentSubmit}
            >
              Record Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={invoiceModal.isOpen}
        size="2xl"
        onClose={invoiceModal.close}
      >
        <ModalContent>
          <ModalHeader>
            Invoice Details - {selectedBilling?.invoiceNumber}
          </ModalHeader>
          <ModalBody>
            {selectedBilling && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-500">Patient Name</p>
                    <p className="font-medium">{selectedBilling.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Invoice Date</p>
                    <p className="font-medium">
                      {new Date(
                        selectedBilling.invoiceDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedBilling.patientPhone && (
                    <div>
                      <p className="text-sm text-default-500">Phone</p>
                      <p className="font-medium">
                        {selectedBilling.patientPhone}
                      </p>
                    </div>
                  )}
                  {selectedBilling.patientEmail && (
                    <div>
                      <p className="text-sm text-default-500">Email</p>
                      <p className="font-medium">
                        {selectedBilling.patientEmail}
                      </p>
                    </div>
                  )}
                  {selectedBilling.patientAge && (
                    <div>
                      <p className="text-sm text-default-500">Age</p>
                      <p className="font-medium">
                        {selectedBilling.patientAge}
                      </p>
                    </div>
                  )}
                  {selectedBilling.patientGender && (
                    <div>
                      <p className="text-sm text-default-500">Gender</p>
                      <p className="font-medium">
                        {selectedBilling.patientGender.charAt(0).toUpperCase() +
                          selectedBilling.patientGender.slice(1)}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-default-500 mb-2">Test Items</p>
                  <Table>
                    <TableHeader>
                      <TableColumn>Test Name</TableColumn>
                      <TableColumn>Price</TableColumn>
                      <TableColumn>Quantity</TableColumn>
                      <TableColumn>Amount</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {selectedBilling.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.testName}
                            {item.testType && (
                              <span className="text-default-500 text-sm">
                                {" "}
                                ({item.testType})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedBilling.subtotal)}</span>
                    </div>
                    {selectedBilling.discountAmount > 0 && (
                      <div className="flex justify-between text-warning">
                        <span>Discount:</span>
                        <span>
                          -{formatCurrency(selectedBilling.discountAmount)}
                        </span>
                      </div>
                    )}
                    {selectedBilling.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({selectedBilling.taxPercentage}%):</span>
                        <span>{formatCurrency(selectedBilling.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedBilling.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid:</span>
                      <span className="text-success">
                        {formatCurrency(selectedBilling.paidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balance:</span>
                      <span
                        className={
                          selectedBilling.balanceAmount > 0
                            ? "text-danger font-semibold"
                            : "text-success font-semibold"
                        }
                      >
                        {formatCurrency(selectedBilling.balanceAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedBilling.notes && (
                  <div>
                    <p className="text-sm text-default-500">Notes</p>
                    <p className="font-medium">{selectedBilling.notes}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              startContent={<IoPrintOutline />}
              variant="light"
              onPress={() => {
                if (selectedBilling) {
                  handlePrint(selectedBilling);
                }
              }}
            >
              Print
            </Button>
            <Button variant="light" onPress={invoiceModal.close}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
