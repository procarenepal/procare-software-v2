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
  options: { hideLetterhead?: boolean } = {},
): string => {
  const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig) : "";
  const headerHtml = !options.hideLetterhead && layoutConfig
    ? getPrintHeaderHTML(layoutConfig, clinic)
    : "";
  const footerHtml = !options.hideLetterhead && layoutConfig
    ? getPrintFooterHTML(layoutConfig)
    : "";

  const parametersRows = (test.parameters || [])
    .filter((p: any) => p.patientResult && p.patientResult.trim() !== "")
    .map(
      (p: any) =>
        `<tr>
          <td class="font-bold">${p.parameterName || ""}</td>
          <td class="text-center font-bold" style="font-size: 14px;">${p.patientResult || ""}</td>
          <td class="text-center">${p.referenceRange || ""}</td>
          <td class="text-center" style="color: #64748b; font-size: 11px;">${p.unit || ""}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <title>Investigation Report - ${test.testName}</title>
  <style>
    @page { size: A4; margin: 0; }
    ${brandingCSS}
    
    .signature-block { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; }
    .sign-line { border-top: 1px solid #1e293b; width: 200px; margin-top: 40px; padding-top: 8px; font-weight: 700; font-size: 11px; text-transform: uppercase; text-align: center; color: #475569; }
  </style>
</head>
<body>
  <div class="print-container">
    ${headerHtml}
    
    <div class="content">
      <div class="document-title">
        <h2>Clinical Investigation Report</h2>
        <div class="document-subtitle">Certified Laboratory Diagnostics</div>
      </div>

      <div class="info-grid">
        <div class="info-section">
          <h3>Patient Information:</h3>
          <div class="info-item"><span class="info-label">Name:</span><span class="info-value"><strong>${test.patientName}</strong></span></div>
          ${(() => {
            const parts = [];
            if (test.patientAge) parts.push(`${test.patientAge} yrs`);
            if (test.patientGender && test.patientGender !== "N/A") parts.push(test.patientGender);
            if (parts.length === 0) return "";
            return `<div class="info-item"><span class="info-label">Age/Gen:</span><span class="info-value">${parts.join(" / ")}</span></div>`;
          })()}
          ${test.patientId ? `<div class="info-item"><span class="info-label">Patient ID:</span><span class="info-value">${test.patientId}</span></div>` : ""}
        </div>
        <div class="info-section">
          <h3>Report Detail:</h3>
          <div class="info-item"><span class="info-label">Investigation:</span><span class="info-value"><strong>${test.testName}</strong></span></div>
          <div class="info-item"><span class="info-label">Sample Date:</span><span class="info-value">${new Date(test.createdAt).toLocaleDateString()}</span></div>
          <div class="info-item"><span class="info-label">Status:</span><span class="info-value">${test.status?.toUpperCase() || "COMPLETED"}</span></div>
        </div>
      </div>

      <div class="info-section" style="margin-top: 20px;">
        <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">Test Results & Observations</h3>
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

      ${test.notes ? `
      <div class="info-section" style="margin-top: 20px; background: #fff;">
        <h3>Clinical Remarks:</h3>
        <p style="font-size: 13px; color: #1e293b; line-height: 1.6; margin: 0;">${test.notes}</p>
      </div>` : ""}

      <div class="signature-block">
        <div>
          <p style="font-size: 10px; color: #94a3b8;">Report generated via ProCare Platform</p>
          <p style="font-size: 10px; color: #94a3b8;">Timestamp: ${new Date().toLocaleString()}</p>
        </div>
        <div style="text-align: right;">
          ${test.labTechnicianName ? `
            <p style="margin: 0; font-weight: 700; font-size: 14px; color: #1e293b;">${test.labTechnicianName}</p>
            <p style="margin: 0; font-size: 11px; color: #64748b;">Laboratory Technician</p>
          ` : ""}
          <div class="sign-line">Authorized Signatory</div>
        </div>
      </div>
    </div>
    
    ${footerHtml || `
    <footer class="footer-section">
      <p class="footer-text">Certified Diagnostic Results</p>
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
