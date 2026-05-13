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

  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig, isThermal, thermalWidth) : "";
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
    ${brandingCSS}
    
    /* Ensure table wrap doesn't show borders */
    .report-wrap { width: 100%; height: 100%; border-collapse: collapse; border: none; }
    .report-wrap td { padding: 0; border: none; }
  </style>
</head>
<body>
  <div class="print-container">
    <table class="report-wrap">
      <thead>
        <tr><td>${headerHTML}</td></tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="content">
              <div class="document-title">
                <h2>Invoice</h2>
                <div class="document-subtitle"># ${billing.invoiceNumber} • ${new Date(billing.invoiceDate).toLocaleDateString()}</div>
              </div>
              
              <div class="info-grid">
                <div class="info-section">
                  <h3>Bill To:</h3>
                  <div class="info-item"><span class="info-label">Name:</span><span class="info-value"><strong>${billing.patientName}</strong></span></div>
                  ${billing.patientPhone ? `<div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${billing.patientPhone}</span></div>` : ""}
                  ${!isThermal && billing.patientAddress ? `<div class="info-item"><span class="info-label">Address:</span><span class="info-value">${billing.patientAddress}</span></div>` : ""}
                </div>
              </div>
              
              <table class="print-table">
                <thead>
                  <tr>
                    <th style="width: ${isThermal ? "25px" : "40px"};">S.N.</th>
                    <th>Test</th>
                    <th style="width: ${isThermal ? "40px" : "60px"};">Qty</th>
                    ${!isThermal ? `<th style="width: 100px;">Price</th>` : ""}
                    <th style="width: ${isThermal ? "80px" : "120px"};">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div class="summary-container">
                <table class="summary-table">
                  <tr>
                    <td>Subtotal</td>
                    <td class="text-right">NPR ${billing.subtotal.toLocaleString()}</td>
                  </tr>
                  ${billing.discountAmount > 0 ? `<tr><td>Discount</td><td class="text-right">- NPR ${billing.discountAmount.toLocaleString()}</td></tr>` : ""}
                  <tr class="total-row">
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
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            ${footerHTML || `
              <footer class="footer-section">
                <p class="footer-text">Thank you for choosing us</p>
                ${isThermal ? `<p class="footer-text" style="margin-top: 4px; font-size: 7px; text-transform: none;">${new Date().toLocaleString()}</p>` : ""}
              </footer>
            `}
          </td>
        </tr>
      </tfoot>
    </table>
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

  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig, isThermal, thermalWidth) : "";
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
          ${!isThermal ? `<td class="text-center" style="text-align: center;">${formatCurrency(item.price)}</td>` : ""}
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
    ${brandingCSS}
  </style>
</head>
<body>
  <div class="print-container">
    ${headerHTML}
    
    <div class="content">
      <div class="document-title">
        <h2>Invoice</h2>
        <div class="document-subtitle"># ${invoice.invoiceNumber} • ${formatDate(invoice.invoiceDate)}</div>
      </div>
      
      <div class="info-grid">
        <div class="info-section">
          <h3>Bill To:</h3>
          <div class="info-item"><span class="info-label">Name:</span><span class="info-value"><strong>${invoice.patientName}</strong></span></div>
          ${patient?.mobile ? `<div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${patient.mobile}</span></div>` : ""}
          ${patient?.address ? `<div class="info-item"><span class="info-label">Address:</span><span class="info-value">${patient.address}</span></div>` : ""}
        </div>
        ${!isThermal && cliniciansList.length > 0 ? `
        <div class="info-section">
          <h3>${cliniciansList.length > 1 ? "Clinicians" : "Clinician"}:</h3>
          ${cliniciansList.map((c) => `<div class="info-item"><span class="info-value">${c.name}${c.isPrimary && cliniciansList.length > 1 ? " (Primary)" : ""}</span></div>`).join("")}
        </div>` : ""}
      </div>
      
      <table class="print-table">
        <thead>
          <tr>
            <th style="width: ${isThermal ? "25px" : "40px"};">S.N.</th>
            <th>Service</th>
            <th style="width: ${isThermal ? "40px" : "60px"};">Qty</th>
            ${!isThermal ? `<th style="width: 100px;">Price</th>` : ""}
            <th style="width: ${isThermal ? "90px" : "120px"};">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="summary-container">
        <table class="summary-table">
          <tr>
            <td>Subtotal</td>
            <td class="text-right">${formatCurrency(invoice.subtotal)}</td>
          </tr>
          ${invoice.discountAmount > 0 ? `<tr><td>Discount</td><td class="text-right">- ${formatCurrency(invoice.discountAmount)}</td></tr>` : ""}
          <tr class="total-row">
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
      
      ${isThermal && cliniciansList.length > 0 ? `
      <div class="info-section" style="margin-top: 15px;">
        <h3>${cliniciansList.length > 1 ? "Clinicians" : "Clinician"}:</h3>
        ${cliniciansList.map((c) => `<div class="info-item"><span class="info-value">${c.name}</span></div>`).join("")}
      </div>` : ""}
    </div>
    
    ${footerHTML || `
    <footer class="footer-section">
      <p class="footer-text">Thank you for choosing us</p>
      ${isThermal ? `<p class="footer-text" style="margin-top: 4px; font-size: 7px; text-transform: none;">${new Date().toLocaleString()}</p>` : ""}
    </footer>
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

  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig, isThermal, thermalWidth) : "";

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

  const slipDate = new Date().toLocaleDateString();

  return `<!DOCTYPE html>
<html>
<head>
  <title>Patient Slip - ${patient.name}</title>
  <style>
    @page {
      ${format === "A4_HALF" ? "size: A5 landscape; margin: 0;" : format === "A4" ? "size: A4; margin: 0;" : `size: ${thermalWidth} auto; margin: 0;`}
    }
    ${brandingCSS}
  </style>
</head>
<body>
  <div class="print-container">
    <div class="content" style="padding-top: 10px;">
      <div class="document-title">
        <h2>Patient Registration Slip</h2>
        <div class="document-subtitle">Confidential Patient Record</div>
      </div>
      
      <div class="info-section">
        <h3>Patient Identification:</h3>
        <table class="print-table" style="margin-bottom: 0; border: none;">
          <tbody>
            <tr>
              <td class="font-bold" style="width: 20%; background: #f8fafc;">Reg#:</td><td>${patient.regNumber || ""}</td>
              <td class="font-bold" style="width: 20%; background: #f8fafc;">Date:</td><td>${slipDate}</td>
            </tr>
            <tr>
              <td class="font-bold" style="background: #f8fafc;">Name:</td><td colspan="3"><strong>${patient.name}</strong></td>
            </tr>
            <tr>
              <td class="font-bold" style="background: #f8fafc;">Age/Gen:</td><td>${ageGender}</td>
              <td class="font-bold" style="background: #f8fafc;">Contact:</td><td>${patient.mobile || ""}</td>
            </tr>
            <tr>
              <td class="font-bold" style="background: #f8fafc;">Address:</td><td colspan="3">${patient.address || ""}</td>
            </tr>
            <tr>
              <td class="font-bold" style="background: #f8fafc;">Ref By:</td><td colspan="3">${patient.referredBy || ""}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
        <div style="display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 150px;">
            <div style="border-top: 1px solid #64748b; margin-top: 40px;"></div>
            <p style="font-size: 10px; color: #64748b; margin-top: 5px;">Receptionist</p>
          </div>
          <div style="text-align: center; width: 150px;">
            <div style="border-top: 1px solid #64748b; margin-top: 40px;"></div>
            <p style="font-size: 10px; color: #64748b; margin-top: 5px;">Patient Signature</p>
          </div>
        </div>
      </div>
    </div>
    
    <footer class="footer-section">
      <p class="footer-text">This is a system generated document</p>
      <p class="footer-text" style="text-transform: none; font-size: 7px; margin-top: 2px;">Printed on ${new Date().toLocaleString()}</p>
    </footer>
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
 * Generates HTML content for printing a prescription
 */
export const generatePrescriptionHTML = (
  prescription: any,
  clinic: any,
  layoutConfig: PrintLayoutConfig | null,
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

  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig, isThermal, thermalWidth) : "";
  const headerHTML = layoutConfig ? getPrintHeaderHTML(layoutConfig, clinic, isThermal) : "";
  const footerHTML = layoutConfig ? getPrintFooterHTML(layoutConfig) : "";

  const itemsHtml = (prescription.items || [])
    .map(
      (item: any) =>
        `<tr>
          <td>${item.medicineName}</td>
          <td class="text-center">${item.dosage}</td>
          <td class="text-center">${item.frequency}</td>
          <td class="text-center">${item.duration}</td>
          <td class="text-center">${item.time}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <title>Prescription - ${prescription.prescriptionNo}</title>
  <style>
    @page {
      ${format === "A4_HALF" ? "size: A5 landscape; margin: 0;" : format === "A4" ? "size: A4; margin: 0;" : `size: ${thermalWidth} auto; margin: 0;`}
    }
    ${brandingCSS}
    
    .signature-section { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature-box { text-align: center; width: 180px; }
    .sign-line { border-top: 1px solid #475569; margin-bottom: 5px; }
    .sign-label { font-size: 11px; color: #64748b; font-weight: 500; }
  </style>
</head>
<body>
  <div class="print-container">
    ${headerHTML}
    
    <div class="content">
      <div class="document-title">
        <h2>Medical Prescription</h2>
        <div class="document-subtitle">Professional Treatment Plan</div>
      </div>

      <div class="info-grid">
        <div class="info-section">
          <h3>Prescription Detail:</h3>
          <div class="info-item"><span class="info-label">No:</span><span class="info-value">#${prescription.prescriptionNo}</span></div>
          <div class="info-item"><span class="info-label">Date:</span><span class="info-value">${new Date(prescription.prescriptionDate).toLocaleDateString()}</span></div>
        </div>
        <div class="info-section">
          <h3>Patient Detail:</h3>
          <div class="info-item"><span class="info-label">Name:</span><span class="info-value"><strong>${prescription.patientName}</strong></span></div>
          ${(() => {
      const parts = [];
      if (prescription.patientAge) parts.push(`${prescription.patientAge} yrs`);
      if (prescription.patientGender && prescription.patientGender !== "N/A") parts.push(prescription.patientGender);
      if (parts.length === 0) return "";
      return `<div class="info-item"><span class="info-label">Age/Gen:</span><span class="info-value">${parts.join(" / ")}</span></div>`;
    })()}
          ${prescription.patientPhone ? `<div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${prescription.patientPhone}</span></div>` : ""}
        </div>
      </div>

      <div class="info-section" style="margin-bottom: 25px; background: transparent;">
        <h3>Doctor Detail:</h3>
        <div class="info-item"><span class="info-label">Physician:</span><span class="info-value">${prescription.doctorName}</span></div>
        ${prescription.doctorSpeciality ? `<div class="info-item"><span class="info-label">Speciality:</span><span class="info-value">${prescription.doctorSpeciality}</span></div>` : ""}
      </div>
      
      <table class="print-table">
        <thead>
          <tr>
            <th>Medicine Name & Description</th>
            <th style="width: 80px;">Dosage</th>
            <th style="width: 100px;">Frequency</th>
            <th style="width: 80px;">Duration</th>
            <th style="width: 80px;">Time</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      ${prescription.notes ? `
      <div class="info-section" style="background: #fff; margin-top: 20px;">
        <h3>Clinical Notes & Instructions:</h3>
        <p style="font-size: 13px; color: #1e293b; line-height: 1.6; margin: 0;">${prescription.notes}</p>
      </div>` : ""}

      ${!isThermal ? `
      <div class="signature-section">
        <div class="signature-box">
          <div class="sign-line"></div>
          <p class="sign-label">Patient/Guardian Signature</p>
        </div>
        <div class="signature-box">
          <div class="sign-line"></div>
          <p class="sign-label">Authorized Physician Signature</p>
        </div>
      </div>` : ""}
    </div>
    
    ${footerHTML || `
    <footer class="footer-section">
      <p class="footer-text">Thank you for choosing us</p>
    </footer>
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
 * Generates HTML content for printing a pharmacy purchase receipt
 */
export const generatePharmacyPurchaseHTML = (
  purchase: any,
  payments: any[],
  clinic: any,
  layoutConfig: PrintLayoutConfig | null,
  format: PrintFormat = "A4",
  itemLifoPrices: Record<string, number> = {},
): string => {
  const isThermal = format.startsWith("THERMAL");

  let thermalWidth = "80mm";
  if (format === "THERMAL_80MM") thermalWidth = "80mm";
  else if (format === "THERMAL_58MM") thermalWidth = "58mm";
  else if (format === "THERMAL_4INCH") thermalWidth = "104mm";
  else if (isThermal && layoutConfig?.thermalPaperWidthMm) {
    thermalWidth = `${layoutConfig.thermalPaperWidthMm}mm`;
  }

  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig, isThermal, thermalWidth) : "";
  const headerHTML = layoutConfig ? getPrintHeaderHTML(layoutConfig, clinic, isThermal) : "";
  const footerHTML = layoutConfig ? getPrintFooterHTML(layoutConfig) : "";

  const itemsHtml = purchase.items
    .map((item: any, index: number) => {
      const price = itemLifoPrices[item.id] ?? item.salePrice;
      return `<tr>
        <td class="text-center">${index + 1}</td>
        <td>${item.medicineName}</td>
        <td class="text-center">${item.quantity}</td>
        ${!isThermal ? `<td class="text-right">NPR ${price.toLocaleString()}</td>` : ""}
        <td class="text-right">NPR ${item.amount.toLocaleString()}</td>
      </tr>`;
    })
    .join("");

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const dueAmount = Math.max(0, (purchase.netAmount || 0) - paidAmount);

  const paymentsHtml = payments.length > 0 ? `
    <div class="info-section" style="margin-top: 25px;">
      <h3>Payment History:</h3>
      <table class="print-table" style="margin-bottom: 0;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Method</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(p => `
            <tr>
              <td>${new Date(p.paymentDate).toLocaleDateString()}</td>
              <td class="text-center">${p.paymentMethod.toUpperCase()}</td>
              <td class="text-right">NPR ${p.amount.toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head>
  <title>Purchase Receipt - ${purchase.purchaseNo}</title>
  <style>
    @page {
      ${format === "A4_HALF" ? "size: A5 landscape; margin: 0;" : format === "A4" ? "size: A4; margin: 0;" : `size: ${thermalWidth} auto; margin: 0;`}
    }
    ${brandingCSS}
    
    /* Ensure table wrap doesn't show borders */
    .report-wrap { width: 100%; border-collapse: collapse; border: none; }
    .report-wrap td { padding: 0; border: none; }
  </style>
</head>
<body>
  <div class="print-container">
    <table class="report-wrap">
      <thead>
        <tr><td>${headerHTML}</td></tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="content">
              <div class="document-title">
                <h2>Pharmacy Receipt</h2>
                <div class="document-subtitle">Medicine Purchase Record</div>
              </div>

              <div class="info-grid">
                <div class="info-section">
                  <h3>Receipt Detail:</h3>
                  <div class="info-item"><span class="info-label">No:</span><span class="info-value">#${purchase.purchaseNo}</span></div>
                  <div class="info-item"><span class="info-label">Date:</span><span class="info-value">${new Date(purchase.purchaseDate).toLocaleDateString()}</span></div>
                  ${purchase.patientName ? `<div class="info-item"><span class="info-label">Patient:</span><span class="info-value">${purchase.patientName}</span></div>` : ""}
                </div>
              </div>
              
              <table class="print-table">
                <thead>
                  <tr>
                    <th style="width: ${isThermal ? "25px" : "40px"};">S.N.</th>
                    <th>Medicine</th>
                    <th style="width: ${isThermal ? "40px" : "60px"};">Qty</th>
                    ${!isThermal ? `<th style="width: 70px;">Price</th>` : ""}
                    <th style="width: ${isThermal ? "80px" : "120px"};">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div class="summary-container">
                <table class="summary-table">
                  <tr>
                    <td>Subtotal</td>
                    <td class="text-right">NPR ${purchase.total.toLocaleString()}</td>
                  </tr>
                  ${purchase.discount > 0 ? `<tr><td>Discount</td><td class="text-right">- NPR ${purchase.discount.toLocaleString()}</td></tr>` : ""}
                  ${purchase.taxAmount > 0 ? `<tr><td>Tax (${purchase.taxPercentage}%)</td><td class="text-right">NPR ${purchase.taxAmount.toLocaleString()}</td></tr>` : ""}
                  <tr class="total-row">
                    <td>Net Amount</td>
                    <td class="text-right">NPR ${purchase.netAmount.toLocaleString()}</td>
                  </tr>
                  ${payments.length > 0 ? `
                    <tr>
                      <td>Paid Amount</td>
                      <td class="text-right">NPR ${paidAmount.toLocaleString()}</td>
                    </tr>
                    <tr class="font-bold">
                      <td>Balance Due</td>
                      <td class="text-right">NPR ${dueAmount.toLocaleString()}</td>
                    </tr>
                  ` : ""}
                </table>
              </div>

              ${paymentsHtml}

              ${isThermal ? `
              <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #64748b; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
                <p>Thank you for your visit!</p>
                <p>${new Date().toLocaleString()}</p>
              </div>` : ""}
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            ${footerHTML || `
              <footer class="footer-section">
                <p class="footer-text">Get Well Soon</p>
              </footer>
            `}
          </td>
        </tr>
      </tfoot>
    </table>
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
 * Generates HTML content for printing a pathology report
 */
export const generatePathologyReportHTML = (
  test: any,
  clinic: any,
  layoutConfig: PrintLayoutConfig | null,
  allTemplates: any[],
  allParameters: any[],
  options: { hideLetterhead?: boolean } = {},
): string => {
  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig) : "";
  const headerHtml = !options.hideLetterhead && layoutConfig
    ? getPrintHeaderHTML(layoutConfig, clinic)
    : "";
  const footerHtml = !options.hideLetterhead && layoutConfig
    ? getPrintFooterHTML(layoutConfig)
    : "";

  // Group results by template
  const pages: { title: string; categoryName: string; results: any[] }[] = [];

  if (test.testTemplateIds && test.testTemplateIds.length > 0) {
    test.testTemplateIds.forEach((templateId: string) => {
      const template = allTemplates.find(t => t.id === templateId);
      if (template) {
        const templateResults = (test.results || []).filter((r: any) =>
          template.parameters.includes(r.parameterId)
        );
        if (templateResults.length > 0) {
          pages.push({
            title: template.name,
            categoryName: template.categoryName,
            results: templateResults
          });
        }
      }
    });
  } else {
    // Fallback if no templates are linked (legacy data)
    pages.push({
      title: test.testNames?.join(", ") || "Investigation Report",
      categoryName: "General Diagnostics",
      results: test.results || []
    });
  }

  const pagesHtml = pages.map((page, pageIndex) => {
    const parametersRows = page.results
      .filter((res: any) => {
        const paramMeta = allParameters.find((p) => p.id === res.parameterId);
        const isHeader = res.isHeader ?? paramMeta?.isHeader;

        return isHeader || (res.value && res.value.trim() !== "");
      })
      .map((res: any) => {
        const paramMeta = allParameters.find((p) => p.id === res.parameterId);
        const isHeader = res.isHeader ?? paramMeta?.isHeader;
        const indentationLevel =
          res.indentationLevel ?? paramMeta?.indentationLevel;

        if (isHeader) {
          return `<tr>
            <td colspan="4" style="background-color: #f8fafc; padding: 8px 12px; font-weight: 800; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #e2e8f0; letter-spacing: 0.5px; color: #334155;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 3px; height: 12px; background-color: #0d9488; border-radius: 2px;"></div>
                ${res.parameterName}
              </div>
            </td>
          </tr>`;
        }

        const isAbnormal = res.status === "abnormal" || res.status === "critical";
        const isLongText = (res.value || "").length > 15;
        const indentStyle = indentationLevel
          ? `padding-left: ${indentationLevel * 20 + 12}px;`
          : "padding-left: 12px;";

        return `<tr>
          <td class="${isAbnormal ? "font-bold" : ""}" style="${indentStyle}">${res.parameterName || ""}</td>
          <td class="${isLongText ? "" : "text-center"}" style="font-size: 14px; ${isAbnormal ? "font-weight: 800;" : "font-weight: 500;"} ${isLongText ? "text-align: left; white-space: pre-wrap; padding: 8px;" : ""}">
            ${res.value || ""}
            ${res.flag && isAbnormal ? `<span style="font-size: 10px; margin-left: 4px;">(${res.flag})</span>` : ""}
          </td>
          <td class="text-center">${res.referenceRange || ""}</td>
          <td class="text-center" style="color: #64748b; font-size: 11px;">${res.unit || ""}</td>
        </tr>`;
      })
      .join("");

    return `
    <div class="page-container" style="${pageIndex < pages.length - 1 ? "page-break-after: always;" : ""}">
      ${headerHtml}
      
      <div class="content">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;">
          <div class="document-title" style="margin-bottom: 0; text-align: left;">
            <h2 style="font-size: 16px; color: #1e293b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Clinical Investigation Report</h2>
            <div class="document-subtitle" style="font-size: 9px; color: #64748b; margin-top: 1px;">CERTIFIED LABORATORY DIAGNOSTICS</div>
          </div>
          <div style="background: #f8fafc; padding: 4px 12px; border-radius: 4px; border: 1px solid #e2e8f0; text-align: right; min-width: 120px;">
            <p style="margin: 0; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700;">Department</p>
            <p style="margin: 0; font-size: 12px; color: #334155; font-weight: 700;">${page.categoryName || "General Diagnostics"}</p>
          </div>
        </div>

        <div class="info-grid" style="gap: 8px; margin-bottom: 8px;">
          <div class="info-section" style="padding: 6px 10px;">
            <h3 style="font-size: 8px; margin-bottom: 4px;">Patient Information:</h3>
            <div class="info-item" style="margin-bottom: 2px;"><span class="info-label" style="font-size: 11px;">Name:</span><span class="info-value" style="font-size: 11px;"><strong>${test.patientName}</strong></span></div>
            ${(() => {
        const parts = [];
        if (test.patientAge) parts.push(`${test.patientAge} yrs`);
        if (test.patientGender && test.patientGender !== "N/A") parts.push(test.patientGender);
        return `<div class="info-item" style="margin-bottom: 2px;"><span class="info-label" style="font-size: 11px;">Age/Gen:</span><span class="info-value" style="font-size: 11px;">${parts.join(" / ") || "N/A"}</span></div>`;
      })()}
            ${test.patientId ? `<div class="info-item" style="margin-bottom: 2px;"><span class="info-label" style="font-size: 11px;">Patient ID:</span><span class="info-value" style="font-size: 11px;">${test.patientId}</span></div>` : ""}
          </div>
          <div class="info-section" style="padding: 6px 10px;">
            <h3 style="font-size: 8px; margin-bottom: 4px;">Report Detail:</h3>
            <div class="info-item" style="margin-bottom: 2px;"><span class="info-label" style="font-size: 11px;">Investigation:</span><span class="info-value" style="font-size: 11px;"><strong>${page.title}</strong></span></div>
            <div class="info-item" style="margin-bottom: 2px;"><span class="info-label" style="font-size: 11px;">Collected On:</span><span class="info-value" style="font-size: 11px;">${new Date(test.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
            <div class="info-item" style="margin-bottom: 2px;"><span class="info-label" style="font-size: 11px;">Reported On:</span><span class="info-value" style="font-size: 11px;">${new Date(test.updatedAt || test.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
            <div class="info-item" style="margin-bottom: 2px;"><span class="info-label" style="font-size: 11px;">Lab ID:</span><span class="info-value" style="font-size: 11px;">${test.orderNumber || "N/A"}</span></div>
          </div>
        </div>

        <div class="info-section" style="margin-top: 10px; padding: 0; background: transparent; border: none;">
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; font-size: 10px; color: #475569;">Test Results & Observations</h3>
          <table class="print-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th class="text-center">Observation / Result</th>
                <th class="text-center">Reference Range</th>
                <th class="text-center">Unit</th>
              </tr>
            </thead>
            <tbody>
              ${parametersRows}
            </tbody>
          </table>
        </div>

        ${test.isMicrobiology ? `
          <div style="margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; page-break-inside: avoid;">
            <div style="background-color: #f8fafc; padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
              <h3 style="margin: 0; font-size: 11px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">Microbiology Culture & Sensitivity Findings</h3>
            </div>
            <div style="padding: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #fff;">
              <div>
                <p style="margin: 0; font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: 700;">Organism Isolated</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #0f172a; font-weight: 800; letter-spacing: -0.2px;">${test.organismIsolated || "No growth detected after 48 hours of incubation"}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: 700;">Colony Count</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #0f172a; font-weight: 800;">${test.colonyCount || "N/A"}</p>
              </div>
            </div>
            
            ${test.sensitivities && test.sensitivities.length > 0 ? `
              <div style="padding: 12px; border-top: 1px solid #e2e8f0; background: #fff;">
                <p style="margin: 0 0 10px 0; font-size: 10px; color: #334155; font-weight: 800; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                  <span style="width: 10px; height: 10px; background: #0d9488; border-radius: 2px;"></span>
                  Antibiotic Sensitivity Matrix
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0;">
                  <thead>
                    <tr style="background-color: #f8fafc;">
                      <th style="padding: 8px 12px; text-align: left; border: 1px solid #e2e8f0; width: 45%; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 9px;">Antibiotic</th>
                      <th style="padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0; width: 30%; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 9px;">Sensitivity</th>
                      <th style="padding: 8px 12px; text-align: center; border: 1px solid #e2e8f0; width: 25%; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 9px;">Zone (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${test.sensitivities.map((s: any) => `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 700; color: #1e293b;">${s.antibiotic}</td>
                        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; font-weight: 900;">
                          ${s.sensitivity === 'S' ? '<span style="color: #059669; background: #ecfdf5; padding: 2px 6px; rounded: 4px;">S (Sensitive)</span>' : 
                            s.sensitivity === 'I' ? '<span style="color: #d97706; background: #fffbeb; padding: 2px 6px; rounded: 4px;">I (Intermediate)</span>' : 
                            s.sensitivity === 'R' ? '<span style="color: #dc2626; background: #fef2f2; padding: 2px 6px; rounded: 4px;">R (Resistant)</span>' : '-'}
                        </td>
                        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; color: #64748b; font-weight: 600;">${s.zoneOfInhibition || "—"}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
                <div style="margin-top: 12px; display: flex; gap: 15px; font-size: 8px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                  <span style="display: flex; align-items: center; gap: 4px;"><div style="width: 6px; height: 6px; background: #059669; border-radius: 1px;"></div> S: Sensitive</span>
                  <span style="display: flex; align-items: center; gap: 4px;"><div style="width: 6px; height: 6px; background: #d97706; border-radius: 1px;"></div> I: Intermediate</span>
                  <span style="display: flex; align-items: center; gap: 4px;"><div style="width: 6px; height: 6px; background: #dc2626; border-radius: 1px;"></div> R: Resistant</span>
                </div>
              </div>
            ` : ""}
          </div>
        ` : ""}

        <table class="signature-table" style="position: absolute; bottom: 60px; left: 40px; right: 40px; width: calc(100% - 80px); border: none; border-collapse: collapse; background: white; z-index: 10;">
          <tr>
            <td style="width: 60%; vertical-align: bottom; text-align: left; padding: 0;">
              <div style="display: flex; flex-wrap: wrap; gap: 30px; margin-bottom: 10px;">
                ${(() => {
                  const names = test.labTechnicianNames && test.labTechnicianNames.length > 0 
                    ? test.labTechnicianNames 
                    : test.labTechnicianName 
                      ? [test.labTechnicianName] 
                      : [];
                  const sigs = test.labTechnicianSignatureUrls || [];
                  
                  return names.map((name, i) => `
                    <div style="display: inline-block; min-width: 130px; margin-right: 20px; opacity: 0.9;">
                      ${sigs[i] ? `<img src="${sigs[i]}" style="height: 50px; width: auto; max-width: 130px; object-fit: contain; margin-bottom: 4px; mix-blend-mode: multiply;" />` : '<div style="height: 50px; margin-bottom: 4px;"></div>'}
                      <p style="margin: 0; font-weight: 700; font-size: 11px; color: #1e293b; position: relative; z-index: 1;">${name}</p>
                      <p style="margin: 0; font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Laboratory Technician</p>
                    </div>
                  `).join("");
                })()}
              </div>
              <div style="border-top: 1px solid #e2e8f0; width: 200px; padding-top: 5px;">
                <p style="margin: 0; font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Performed By</p>
              </div>
            </td>
            <td style="width: 40%; vertical-align: bottom; text-align: center; padding: 0;">
              ${test.verifiedByName ? `
                <div style="margin-bottom: 8px; text-align: center;">
                  ${test.verifiedBySignatureUrl ? `<img src="${test.verifiedBySignatureUrl}" style="height: 60px; width: auto; max-width: 180px; object-fit: contain; margin-bottom: 4px; mix-blend-mode: multiply; display: block; margin-left: auto; margin-right: auto;" />` : '<div style="height: 60px; margin-bottom: 4px;"></div>'}
                  <p style="margin: 0; font-weight: 700; font-size: 12px; color: #1e293b; position: relative; z-index: 1;">${test.verifiedByName}</p>
                  <p style="margin: 0; font-size: 9px; color: #64748b; text-transform: uppercase;">${test.verifiedByDesignation || "Consultant Pathologist"}</p>
                  <p style="margin: 0; font-size: 8px; color: #94a3b8;">Reg No: ${test.verifiedByRegNo || "--------"}</p>
                </div>
              ` : ""}
              <div style="border-top: 2px solid #1e293b; width: 100%; padding-top: 5px; text-align: center;">
                <p style="margin: 0; font-size: 10px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 1px;">Authorized Signatory</p>
              </div>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="position: absolute; bottom: 0; left: 0; right: 0;">
        ${footerHtml || `
        <footer class="footer-section" style="padding: 10px 0; border-top: 1px solid #f1f5f9;">
          <p class="footer-text" style="font-size: 10px; text-align: center; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Thank you for choosing us</p>
        </footer>
        `}
      </div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <title>Investigation Report - ${test.patientName}</title>
  <style>
    @page { size: A4; margin: 0; }
    ${brandingCSS}
    .page-container { height: 297mm; position: relative; overflow: hidden; box-sizing: border-box; }
    .content { padding: 0 40px 240px 40px; }
    .signature-table { border-collapse: collapse; border: none; width: 100%; }
    .sign-line { border-top: 1px solid #1e293b; width: 200px; padding-top: 8px; font-weight: 700; font-size: 11px; text-transform: uppercase; text-align: center; color: #475569; }
  </style>
</head>
<body>
  <div class="print-container">
    ${pagesHtml}
  </div>
  
  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); window.close(); }, 500);
    }
  </script>
</body>
</html>`;
};
