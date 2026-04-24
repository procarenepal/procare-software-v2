import { PathologyBilling, AppointmentBilling } from "@/types/models";
import {
  getPrintBrandingCSS,
  getPrintHeaderHTML,
  getPrintFooterHTML,
} from "./printBranding";

export type PrintFormat = "A4" | "A4_HALF" | "THERMAL_80MM" | "THERMAL_58MM";

/**
 * Generates HTML content for printing an invoice
 */
export const generateInvoiceHTML = (
  billing: PathologyBilling,
  format: PrintFormat,
  clinic: any,
  layoutConfig: any,
): string => {
  const isThermal = format === "THERMAL_80MM" || format === "THERMAL_58MM";
  const thermalWidth = format === "THERMAL_80MM" ? "80mm" : "58mm";

  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig) : "";
  const headerHTML = layoutConfig && !isThermal ? getPrintHeaderHTML(layoutConfig, clinic) : "";
  const footerHTML = layoutConfig && !isThermal ? getPrintFooterHTML(layoutConfig) : "";

  const itemsHtml = billing.items
    .map(
      (item, index) =>
        `<tr>
      <td class="text-center" style="text-align: center;">${index + 1}</td>
      <td class="text-center" style="text-align: center;">${item.testName}${item.testType ? ` (${item.testType})` : ""}</td>
      <td class="text-center" style="text-align: center;">${item.quantity}</td>
      ${!isThermal ? `<td class="text-center" style="text-align: center;">NPR ${item.price.toLocaleString()}</td>` : ""}
      <td class="text-center" style="text-align: center;">NPR ${item.amount.toLocaleString()}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${billing.invoiceNumber}</title>
  <style>
    @page {
      ${format === "A4_HALF" ? "size: A5 landscape; margin: 0;" : format === "A4" ? "size: A4; margin: 0;" : `size: ${thermalWidth} auto; margin: 0;`}
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: white;
      color: #333;
      font-size: ${isThermal ? "10px" : format === "A4_HALF" ? "11px" : "12px"};
    }
    
    ${!isThermal ? brandingCSS : ""}

    .print-container {
      width: 100%;
      margin: 0 auto;
      padding: ${isThermal ? "2mm" : "20mm"};
      ${isThermal ? `max-width: ${thermalWidth};` : ""}
      display: flex;
      flex-direction: column;
    }
    .content {
      flex: 1;
      padding: ${isThermal ? "0" : "15mm"};
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .document-title {
      text-align: center;
      margin: ${isThermal ? "2px 0" : format === "A4_HALF" ? "2px 0" : "5px 0 15px 0"};
    }
    .document-title h2 {
      font-size: ${isThermal ? "12px" : "18px"};
      font-weight: 800;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
    }
    .document-info {
      display: flex;
      justify-content: space-between;
      margin-top: 2px;
      border-top: ${isThermal ? "1px dashed #ccc" : "none"};
      border-bottom: ${isThermal ? "1px dashed #ccc" : "none"};
      padding: ${isThermal ? "2px 0" : "0"};
    }
    .bill-to-section {
      display: flex;
      flex-direction: column;
      margin-bottom: ${isThermal ? "5px" : "25px"};
      padding: ${isThermal ? "2px 0" : "15px"};
      background-color: ${isThermal ? "transparent" : "#f8fafc"};
      border-radius: 8px;
      border: ${isThermal ? "none" : "1px solid #f1f5f9"};
    }
    .bill-to-section h3 {
      margin: 0 0 8px 0;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .bill-to-section p {
      margin: 2px 0;
      font-size: 13px;
      color: #475569;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: ${isThermal ? "10px" : "30px"};
    }
    .items-table th, .items-table td {
      border: ${isThermal ? "none" : "1px solid #e2e8f0"};
      padding: ${isThermal ? "2px 0" : "12px 10px"};
      font-size: ${isThermal ? "10px" : "12px"};
      color: #475569;
    }
    .items-table th {
      background-color: ${isThermal ? "transparent" : "#f8fafc"};
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: ${isThermal ? "10px" : "10px"};
      color: #64748b;
    }
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-top: ${isThermal ? "5px" : "20px"};
    }
    .summary-table {
      width: ${isThermal ? "100%" : "250px"};
      border-collapse: collapse;
    }
    .summary-table td {
      padding: ${isThermal ? "3px 4px" : "8px 10px"};
      border-bottom: ${isThermal ? "1px dotted #ccc" : "1px solid #eee"};
    }
    .font-bold { font-weight: bold; }
    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
    .footer {
      margin-top: ${isThermal ? "10px" : "20px"};
      text-align: center;
      font-size: 10px;
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 5px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${!isThermal && headerHTML ? headerHTML : `
    <div class="header">
      <div class="header-content">
        <div>
          ${layoutConfig?.logoUrl ? `<img src="${layoutConfig.logoUrl}" alt="Logo" class="logo" />` : ""}
          <h1 class="clinic-name">${clinic?.name || layoutConfig?.clinicName || "Clinic Name"}</h1>
          <div class="clinic-details">
            <p>${layoutConfig?.address || clinic?.address || ""}, ${layoutConfig?.city || clinic?.city || ""}</p>
            <p>Phone: ${layoutConfig?.phone || clinic?.phone || ""}</p>
          </div>
        </div>
      </div>
    </div>
    `}
    
    <div class="content">
      <div class="document-title">
        <h2>Invoice</h2>
        <div class="document-info">
          <span># ${billing.invoiceNumber}</span>
          <span>Date: ${new Date(billing.invoiceDate).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div class="bill-to-section">
        <h3>Bill To:</h3>
        <p><strong>${billing.patientName}</strong></p>
        ${billing.patientPhone ? `<p>Phone: ${billing.patientPhone}</p>` : ""}
        ${!isThermal && billing.patientAddress ? `<p>Address: ${billing.patientAddress}</p>` : ""}
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">S.N.</th>
            <th style="text-align: center;">Test</th>
            <th style="width: 50px; text-align: center;">Qty</th>
            ${!isThermal ? `<th style="width: 80px; text-align: center;">Price</th>` : ""}
            <th style="width: 100px; text-align: center;" class="text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="summary-section">
        <table class="summary-table">
          <tr>
            <td>Subtotal</td>
            <td class="text-right">NPR ${billing.subtotal.toLocaleString()}</td>
          </tr>
          ${billing.discountAmount > 0 ? `<tr><td>Discount</td><td class="text-right">- NPR ${billing.discountAmount.toLocaleString()}</td></tr>` : ""}
          <tr class="font-bold">
            <td>Total</td>
            <td class="text-right">NPR ${billing.totalAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Paid</td>
            <td class="text-right">NPR ${billing.paidAmount.toLocaleString()}</td>
          </tr>
          <tr class="font-bold">
            <td>Balance</td>
            <td class="text-right">NPR ${billing.balanceAmount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
    </div>
    
    ${!isThermal && footerHTML ? footerHTML : `
    <div class="footer">
      <p>Thank you for choosing us</p>
      ${isThermal ? `<p>${new Date().toLocaleString()}</p>` : ""}
    </div>
    `}
  </div>
  
  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); window.close(); }, 500);
    }
  </script>
</body>
</html>`;
};

/**
 * Generates HTML content for printing an appointment invoice
 */
export const generateAppointmentInvoiceHTML = (
  invoice: AppointmentBilling,
  clinic: any,
  layoutConfig: any,
  patient?: any,
): string => {
  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig) : "";
  const headerHTML = layoutConfig ? getPrintHeaderHTML(layoutConfig, clinic) : "";
  const footerHTML = layoutConfig ? getPrintFooterHTML(layoutConfig) : "";

  // Helper to format currency
  const formatCurrency = (amount: number) => `NPR ${amount.toLocaleString()}`;

  // Helper for BS date (minimal version for utility)
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const itemsHtml = invoice.items
    .map(
      (item, index) =>
        `<tr>
          <td class="text-center" style="text-align: center;">${index + 1}</td>
          <td class="text-center" style="text-align: center;">${item.appointmentTypeName}</td>
          <td class="text-center" style="text-align: center;">${item.quantity}</td>
          <td class="text-center" style="text-align: center;">${formatCurrency(item.price)}</td>
          <td class="text-center" style="text-align: center;">${formatCurrency(item.amount)}</td>
        </tr>`,
    )
    .join("");

  // Get involved clinicians
  const cliniciansMap = new Map();
  if (invoice.doctorId) cliniciansMap.set(invoice.doctorId, { name: invoice.doctorName, isPrimary: true });
  invoice.items.forEach((item) => {
    if (item.doctorId && !cliniciansMap.has(item.doctorId)) {
      cliniciansMap.set(item.doctorId, { name: item.doctorName, isPrimary: false });
    }
  });
  const cliniciansList = Array.from(cliniciansMap.values());
  const cliniciansHtml = cliniciansList.length > 0
    ? `<div>
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #333;">${cliniciansList.length > 1 ? "Clinicians" : "Clinician"}:</h3>
        ${cliniciansList.map((c) => `<p style="margin: 2px 0; font-size: 12px; font-weight: 500;">${c.name}${c.isPrimary && cliniciansList.length > 1 ? " (Primary)" : ""}</p>`).join("")}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${invoice.invoiceNumber}</title>
  <style>
    @page { margin: 0; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: white;
      color: #333;
    }
    .print-container {
      width: 100%;
      margin: 0;
      background: white;
      display: flex;
      flex-direction: column;
      min-height: auto;
      padding: 20mm;
      box-sizing: border-box;
    }
    
    ${brandingCSS}

    .content {
      flex: 1;
      padding: 15mm;
      min-height: 0;
    }
    .document-title {
      text-align: center;
      margin: 5px 0 15px 0;
    }
    .document-title h2 {
      font-size: 18px;
      font-weight: 800;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
    }
    .bill-to-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
    }
    .bill-to-section h3 {
      margin: 0 0 8px 0;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .bill-to-section p {
      margin: 2px 0;
      font-size: 13px;
      color: #475569;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th,
    .items-table td {
      border: 1px solid #e2e8f0;
      padding: 12px 10px;
      font-size: 12px;
      color: #475569;
    }
    .items-table th {
      background-color: #f8fafc;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
    .summary-table { width: 250px; border-collapse: collapse; }
    .summary-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #eee;
    }
    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
    .font-bold { font-weight: bold; }

    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${headerHTML}
    
    <div class="content">
      <div class="document-title">
        <h2>Invoice</h2>
        <div class="document-info" style="display: flex; justify-content: space-between; margin-top: 10px;">
          <span># ${invoice.invoiceNumber}</span>
          <span>Date: ${formatDate(invoice.invoiceDate)}</span>
        </div>
      </div>
      
      <div class="bill-to-section">
        <div>
          <h3>Bill To:</h3>
          <p><strong>${invoice.patientName}</strong></p>
          ${patient?.mobile ? `<p>Phone: ${patient.mobile}</p>` : ""}
          ${patient?.address ? `<p>Address: ${patient.address}</p>` : ""}
        </div>
        ${cliniciansHtml}
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">S.N.</th>
            <th style="text-align: center;">Service</th>
            <th style="width: 50px; text-align: center;">Qty</th>
            <th style="width: 100px; text-align: center;">Price</th>
            <th style="width: 100px; text-align: center;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="summary-section">
        <table class="summary-table">
          <tr>
            <td>Subtotal</td>
            <td class="text-right">${formatCurrency(invoice.subtotal)}</td>
          </tr>
          ${invoice.discountAmount > 0 ? `<tr><td>Discount</td><td class="text-right">- ${formatCurrency(invoice.discountAmount)}</td></tr>` : ""}
          <tr class="font-bold">
            <td>Total</td>
            <td class="text-right">${formatCurrency(invoice.totalAmount)}</td>
          </tr>
          <tr>
            <td>Paid</td>
            <td class="text-right">${formatCurrency(invoice.paidAmount)}</td>
          </tr>
          <tr class="font-bold">
            <td>Balance</td>
            <td class="text-right">${formatCurrency(invoice.balanceAmount)}</td>
          </tr>
        </table>
      </div>
    </div>
    
    ${footerHTML}
  </div>
  
  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); window.close(); }, 500);
    }
  </script>
</body>
</html>`;
};
