import { PathologyBilling, AppointmentBilling } from "@/types/models";
import { PrintLayoutConfig } from "@/types/printLayout";
import {
  getPrintBrandingCSS,
  getPrintHeaderHTML,
  getPrintFooterHTML,
} from "./printBranding";

export type PrintFormat = "A4" | "A4_HALF" | "THERMAL_80MM" | "THERMAL_58MM" | "THERMAL_4INCH";

/**
 * Generates HTML content for printing an invoice
 */
export const generateInvoiceHTML = (
  billing: PathologyBilling,
  format: PrintFormat,
  clinic: any,
  layoutConfig: any,
): string => {
  const isThermal = format === "THERMAL_80MM" || format === "THERMAL_58MM" || format === "THERMAL_4INCH";

  // Use config-defined width if available and format is thermal
  let thermalWidth = "80mm";
  if (format === "THERMAL_80MM") thermalWidth = "80mm";
  else if (format === "THERMAL_58MM") thermalWidth = "58mm";
  else if (format === "THERMAL_4INCH") thermalWidth = "104mm";
  else if (isThermal && layoutConfig?.thermalPaperWidthMm) {
    thermalWidth = `${layoutConfig.thermalPaperWidthMm}mm`;
  }

  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig, isThermal) : "";
  const headerHTML = layoutConfig ? getPrintHeaderHTML(layoutConfig, clinic, isThermal) : "";
  const footerHTML = layoutConfig ? getPrintFooterHTML(layoutConfig) : "";

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
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      -webkit-print-color-adjust: exact;
      width: 100%;
    }
    body {
      font-family: Arial, sans-serif;
      color: #333;
      font-size: ${isThermal ? "10px" : format === "A4_HALF" ? "11px" : "12px"};
    }
    
    ${!isThermal ? brandingCSS : ""}

    .print-container {
      width: ${isThermal ? thermalWidth : "100%"};
      margin: 0 auto;
      padding: ${isThermal ? "2mm" : "20mm"};
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
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
    ${headerHTML}
    
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
    
    ${footerHTML || `
    <div class="footer">
      <p>Thank you for choosing us</p>
      <p>${new Date().toLocaleString()}</p>
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
  layoutConfig: PrintLayoutConfig | null,
  patient: any,
  format: PrintFormat = "A4",
): string => {
  const isThermal = format === "THERMAL_80MM" || format === "THERMAL_58MM" || format === "THERMAL_4INCH";

  // Use config-defined width if available and format is thermal
  let thermalWidth = "80mm";
  if (format === "THERMAL_80MM") thermalWidth = "80mm";
  else if (format === "THERMAL_58MM") thermalWidth = "58mm";
  else if (format === "THERMAL_4INCH") thermalWidth = "104mm";
  else if (isThermal && layoutConfig?.thermalPaperWidthMm) {
    thermalWidth = `${layoutConfig.thermalPaperWidthMm}mm`;
  }

  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig, isThermal) : "";
  const headerHTML = layoutConfig ? getPrintHeaderHTML(layoutConfig, clinic, isThermal) : "";
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
    @page {
      ${format === "A4_HALF" ? "size: A5 landscape; margin: 0;" : format === "A4" ? "size: A4; margin: 0;" : `size: ${thermalWidth} auto; margin: 0;`}
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      -webkit-print-color-adjust: exact;
      width: 100%;
    }
    body {
      font-family: Arial, sans-serif;
      color: #333;
    }
    .print-container {
      width: ${isThermal ? thermalWidth : "100%"};
      margin: 0 auto;
      background: white;
      display: flex;
      flex-direction: column;
      min-height: auto;
      padding: ${isThermal ? "2mm" : "20mm"};
      box-sizing: border-box;
    }
    
    ${brandingCSS}

    .content {
      flex: 1;
      padding: ${isThermal ? "2mm 0" : "15mm"};
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
      flex-direction: ${isThermal ? "column" : "row"};
      justify-content: space-between;
      margin-bottom: ${isThermal ? "10px" : "25px"};
      padding: ${isThermal ? "8px" : "15px"};
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
      margin-bottom: ${isThermal ? "10px" : "30px"};
    }
    .items-table th,
    .items-table td {
      border: 1px solid #e2e8f0;
      padding: ${isThermal ? "6px 4px" : "12px 10px"};
      font-size: ${isThermal ? "11px" : "12px"};
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
      padding: ${isThermal ? "4px 6px" : "8px 10px"};
      border-bottom: 1px solid #eee;
      font-size: ${isThermal ? "11px" : "13px"};
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
        ${!isThermal ? cliniciansHtml : ""}
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">S.N.</th>
            <th style="text-align: center;">Service</th>
            <th style="width: 50px; text-align: center;">Qty</th>
            ${!isThermal ? `<th style="width: 100px; text-align: center;">Price</th>` : ""}
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
      ${isThermal ? cliniciansHtml : ""}
    </div>
    
    ${!isThermal && footerHTML ? footerHTML : `
    <div style="margin-top: 15px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #eee; padding-top: 5px;">
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
 * Generates HTML content for printing a patient slip
 */
export const generatePatientSlipHTML = (
  patient: any,
  clinic: any,
  format: PrintFormat,
  layoutConfig: PrintLayoutConfig | null,
): string => {
  const isThermal = format === "THERMAL_80MM" || format === "THERMAL_58MM" || format === "THERMAL_4INCH";

  // Use config-defined width if available and format is thermal
  let thermalWidth = "80mm";
  if (format === "THERMAL_80MM") thermalWidth = "80mm";
  else if (format === "THERMAL_58MM") thermalWidth = "58mm";
  else if (format === "THERMAL_4INCH") thermalWidth = "104mm";
  else if (isThermal && layoutConfig?.thermalPaperWidthMm) {
    thermalWidth = `${layoutConfig.thermalPaperWidthMm}mm`;
  }

  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig, isThermal) : "";

  // Helper for date formatting
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const calculateAge = (dob: Date | string): number => {
    const today = new Date();
    const b = typeof dob === "string" ? new Date(dob) : dob;
    let a = today.getFullYear() - b.getFullYear();
    if (
      today.getMonth() < b.getMonth() ||
      (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())
    )
      a--;
    return a;
  };

  const ageGender = [
    patient.dob ? calculateAge(patient.dob) + " yrs" : (patient.age ? patient.age + " yrs" : ""),
    patient.gender || "",
  ]
    .filter(Boolean)
    .join(" / ");

  const slipDate = new Date().toISOString().split("T")[0].replace(/-/g, "/");

  // Layout for A4/A5
  const standardLayout = `
    <table class="slip-table">
      <tbody>
        <tr>
          <td class="label">Reg#:</td><td class="value">${patient.regNumber || ""}</td>
          <td class="label">Name:</td><td class="value">${patient.name}</td>
        </tr>
        <tr>
          <td class="label">Age/Gender:</td><td class="value">${ageGender}</td>
          <td class="label">Date:</td><td class="value">${slipDate}</td>
        </tr>
        <tr>
          <td class="label">Contact:</td><td class="value">${patient.mobile || ""}</td>
          <td class="label">Address:</td><td class="value">${patient.address || ""}</td>
        </tr>
        <tr>
          <td class="label">Ref By:</td><td class="value" colspan="3">${patient.referredBy || ""}</td>
        </tr>
      </tbody>
    </table>
  `;

  // Layout for Thermal
  const thermalLayout = `
    <table class="slip-table-thermal">
      <tbody>
        <tr><td class="label">Reg#:</td><td class="value">${patient.regNumber || ""}</td></tr>
        <tr><td class="label">Name:</td><td class="value">${patient.name}</td></tr>
        <tr><td class="label">Age/Gen:</td><td class="value">${ageGender}</td></tr>
        <tr><td class="label">Date:</td><td class="value">${slipDate}</td></tr>
        <tr><td class="label">Contact:</td><td class="value">${patient.mobile || ""}</td></tr>
        <tr><td class="label">Address:</td><td class="value">${patient.address || ""}</td></tr>
        <tr><td class="label">Ref By:</td><td class="value">${patient.referredBy || ""}</td></tr>
      </tbody>
    </table>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <title>Patient Slip - ${patient.name}</title>
  <style>
    @page {
      ${format === "A4_HALF" ? "size: A5 landscape; margin: 0;" : format === "A4" ? "size: A4; margin: 0;" : `size: ${thermalWidth} auto; margin: 0;`}
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      -webkit-print-color-adjust: exact;
      width: 100%;
    }
    body {
      margin: 0;
      padding: 0;
      background: white;
      color: #333;
      font-family: Arial, sans-serif;
      font-size: ${isThermal ? "11px" : "13px"};
    }
    
    ${!isThermal ? brandingCSS : ""}

    .print-container {
      width: ${isThermal ? thermalWidth : "100%"};
      margin: 0 auto;
      padding: ${isThermal ? "2mm" : "20mm"};
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    
    .document-title {
      text-align: center;
      margin: ${isThermal ? "5px 0" : "15px 0"};
      border-bottom: 1px solid #333;
      padding-bottom: 5px;
    }
    .document-title h2 {
      font-size: ${isThermal ? "14px" : "18px"};
      margin: 0;
      text-transform: uppercase;
    }

    /* Standard Table Styles */
    .slip-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .slip-table td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; }
    .slip-table td.label { background: #f5f5f5; font-weight: bold; width: 15%; }
    .slip-table td.value { width: 35%; }

    /* Thermal Table Styles */
    .slip-table-thermal { width: 100%; border-collapse: collapse; margin-top: 5px; }
    .slip-table-thermal td { border: 1px solid #333; padding: 4px 6px; vertical-align: top; }
    .slip-table-thermal td.label { font-weight: bold; width: 35%; background: #f9f9f9; }
    .slip-table-thermal td.value { width: 65%; }

    .header-thermal {
      text-align: center;
      margin-bottom: 10px;
    }
    .clinic-name-thermal { font-weight: bold; font-size: 14px; margin: 0; }
    .clinic-info-thermal { font-size: 10px; margin: 2px 0; }

    .footer {
      margin-top: 15px;
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
    <div style="text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
      <h1 style="font-weight: bold; font-size: 14px; margin: 0;">PATIENT SLIP</h1>
    </div>
    
    ${isThermal ? thermalLayout : standardLayout}
    
    <div class="footer">
      <p>Thank you</p>
      <p>${new Date().toLocaleString()}</p>
    </div>
  </div>
  
  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); window.close(); }, 500);
    }
  </script>
</body>
</html>`;
};
