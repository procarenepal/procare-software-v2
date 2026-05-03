import { PrintLayoutConfig } from "@/types/printLayout";

/**
 * Generates the CSS styles for the centralized clinical branding.
 * Uses the Slate-600 palette and centered-stack layout model.
 */
export const getPrintBrandingCSS = (config: PrintLayoutConfig, isThermal: boolean = false, paperWidth: string = "100%") => {
  const primaryColor = config.primaryColor || "#0ea5e9";
  const fontSize = config.fontSize || "medium";
  const headerHeight = isThermal ? "auto" : (
    config.headerHeight === "compact" ? 180 :
      config.headerHeight === "expanded" ? 300 : 240
  );

  const effectiveLogoPosition = isThermal ? "center" : (config.logoPosition || "center");
  const actualPaperWidth = isThermal ? (paperWidth === "100%" ? "80mm" : paperWidth) : "210mm";

  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    @page {
      size: ${isThermal ? "80mm auto" : "A4"};
      margin: 0;
    }

    * { box-sizing: border-box; }
    
    html, body {
      margin: 0;
      padding: 0;
      background: #f8fafc; /* Subtle background for preview */
      -webkit-print-color-adjust: exact;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
    }

    @media print {
      body {
        background: white;
        margin: 0;
        padding: 0;
      }
    }

    /* Global Print Container */
    .print-container {
      width: ${actualPaperWidth};
      min-width: ${actualPaperWidth};
      margin: 0 auto;
      background: white;
      display: flex;
      flex-direction: column;
      min-height: ${isThermal ? "auto" : "100vh"};
      box-sizing: border-box;
      padding: 0;
      box-shadow: ${isThermal ? "0 0 20px rgba(0,0,0,0.05)" : "none"};
    }

    @media print {
      body { background: white; }
      .info-section { page-break-inside: avoid; }
      .print-table tr { page-break-inside: avoid; }
      .summary-container { page-break-inside: avoid; }
      
      ${isThermal ? `
        /* Ensure continuous printing for thermal */
        html, body, .print-container {
          height: auto !important;
          min-height: 0 !important;
        }
      ` : ""}
    }

    .content {
      padding: ${isThermal ? "4mm 4mm" : "0 15mm"};
      min-height: 0;
    }

    /* Shared Document Elements */
    .document-title {
      text-align: center;
      margin: ${isThermal ? "2px 0" : "5px 0 10px 0"};
    }
    .document-title h2 {
      font-size: ${isThermal ? "14px" : "16px"};
      font-weight: 800;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #475569;
    }
    .document-subtitle {
      font-size: ${isThermal ? "10px" : "10px"};
      color: #64748b;
      margin: 0;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Standard Info Sections (Bill To, Meta Boxes) */
    .info-grid {
      display: grid;
      grid-template-columns: ${isThermal ? "1fr" : "1fr 1fr"};
      gap: ${isThermal ? "8px" : "10px"};
      margin-bottom: 12px;
    }

    .info-section {
      padding: ${isThermal ? "5px" : "8px 10px"};
      background-color: #f8fafc;
      border-radius: 4px;
      border: 1px solid #f1f5f9;
    }

    .info-section h3 {
      margin: 0 0 4px 0;
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 3px;
    }

    .info-item {
      margin-bottom: 3px;
      display: flex;
      font-size: ${isThermal ? "11px" : "12px"};
      line-height: 1.3;
    }

    .info-label {
      font-weight: 600;
      color: #64748b;
      width: ${isThermal ? "60px" : "80px"};
      flex-shrink: 0;
    }

    .info-value {
      color: #1e293b;
      font-weight: 500;
      word-break: break-word;
    }

    /* Standard Tables */
    .report-wrap {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
      margin: 0;
      padding: 0;
    }

    .report-wrap thead, .report-wrap tfoot {
      height: 1px;
    }

    .report-wrap tbody td {
      vertical-align: top !important;
    }

    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }

    .print-table th, .print-table td {
      border: 1px solid #e2e8f0;
      padding: ${isThermal ? "4px 4px" : "6px 8px"};
      font-size: ${isThermal ? "10px" : "11px"};
      color: #475569;
    }

    .print-table th {
      background-color: #f8fafc;
      font-weight: 700;
      text-align: center;
      color: #475569;
      text-transform: uppercase;
      font-size: ${isThermal ? "8px" : "10px"};
      letter-spacing: 0.05em;
    }

    /* Summary Layout */
    .summary-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }

    .summary-table {
      width: ${isThermal ? "100%" : "280px"};
      border-collapse: collapse;
    }

    .summary-table td {
      padding: ${isThermal ? "3px 4px" : "4px 8px"};
      border-bottom: 1px solid #f1f5f9;
      font-size: ${isThermal ? "11px" : "12px"};
      color: #475569;
    }

    .summary-table tr.total-row td {
      font-weight: 800;
      color: #1e293b;
      font-size: ${isThermal ? "12px" : "14px"};
      border-bottom: 2px solid #e2e8f0;
      padding-top: 8px;
    }

    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
    .font-bold { font-weight: 700; }

    .header {
      position: relative;
      width: 100%;
      height: 100%;
      background: #fff;
      flex-shrink: 0;
      z-index: 10;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center; /* Matches PrintLayoutTemplate.tsx */
      padding: 0 15mm;
    }

    /* Identity Stack Styling */
    .identity-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${isThermal ? "8px 2mm 16px 2mm" : "0 15mm"};
      font-family: 'Inter', -apple-system, sans-serif;
      gap: 4px;
    }

    .logo-container {
      position: ${effectiveLogoPosition === "center" ? "relative" : "absolute"};
      top: ${effectiveLogoPosition === "center" ? (isThermal ? "5px" : "0") : "40px"};
      left: ${effectiveLogoPosition === "left" ? "40px" : (effectiveLogoPosition === "right" ? "auto" : "50%")};
      right: ${effectiveLogoPosition === "right" ? "40px" : "auto"};
      transform: ${effectiveLogoPosition === "center" ? "translateX(-50%)" : "none"};
      z-index: 100;
      display: flex;
      justify-content: center;
      margin-bottom: ${effectiveLogoPosition === "center" ? "5px" : "0"};
    }

    .logo {
      width: 100%;
      height: auto;
      object-fit: contain;
      display: block;
    }

    .clinic-name {
      font-size: ${isThermal ? "16px" : (config.fieldSizes?.clinicName ? `${config.fieldSizes.clinicName}px` : (fontSize === "small" ? "20px" : fontSize === "large" ? "24px" : "20px"))};
      font-weight: ${config.boldFields?.includes("clinicName") ? "700" : "400"};
      color: ${config.fieldColors?.clinicName || "#475569"};
      margin: 0;
      line-height: 1.2;
      letter-spacing: -0.01em;
      text-align: center;
    }

    .tagline {
      font-size: ${config.fieldSizes?.tagline ? `${config.fieldSizes.tagline}px` : "11px"};
      font-weight: 600;
      color: ${config.fieldColors?.tagline || "#475569"};
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin: 4px 0 0 0;
      text-align: center;
    }

    .address-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 4px;
    }

    .address {
      font-size: ${config.fieldSizes?.address ? `${config.fieldSizes.address}px` : "11px"};
      font-weight: ${config.boldFields?.includes("address") ? "700" : "400"};
      color: ${config.fieldColors?.address || "#475569"};
      line-height: 1.4;
      white-space: pre-wrap;
      text-align: center;
      margin: 4px 0 0 0;
    }

    .city-info {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      text-align: center;
    }

    .contact-row {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      width: 100%;
      max-width: 448px;
      justify-content: center;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .contact-label {
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .contact-value {
      font-size: ${config.fieldSizes?.phone ? `${config.fieldSizes.phone}px` : "12px"};
      font-weight: 700;
      color: ${config.fieldColors?.phone || "#475569"};
    }

    .website {
      font-size: ${config.fieldSizes?.website ? `${config.fieldSizes.website}px` : "12px"};
      font-weight: 700;
      color: ${config.fieldColors?.website || "#475569"};
      text-decoration: none;
      margin-top: 8px;
      text-align: center;
    }

    .footer-section {
      border-top: 1px solid #e2e8f0;
      padding: ${isThermal ? "10px 5px" : "20px 40px"};
      text-align: center;
      background: #fff;
      margin-top: 10px;
      width: 100%;
      page-break-inside: avoid;
      page-break-after: avoid;
    }

    .footer-text {
      font-size: ${config.fieldSizes?.footerText ? `${config.fieldSizes.footerText}px` : "9px"};
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      margin: 0;
    }

    /* Coordinate Overrides */
    .pos-rel { position: relative; }
    .pos-logo { 
      transform: ${isThermal ? "none" : `translate(${config.logoPos?.x || 0}px, ${config.logoPos?.y || 0}px)${effectiveLogoPosition === "center" ? " translateX(-50%)" : ""}`};
      ${effectiveLogoPosition !== "center" ? `
        left: ${effectiveLogoPosition === "left" ? "40px" : "auto"};
        right: ${effectiveLogoPosition === "right" ? "40px" : "auto"};
      ` : `
        left: 50%;
        right: auto;
      `}
    }
    .pos-clinicName { transform: ${isThermal ? "none" : `translate(${config.clinicNamePos?.x || 0}px, ${config.clinicNamePos?.y || 0}px)`}; width: fit-content; }
    .pos-tagline { transform: ${isThermal ? "none" : `translate(${config.taglinePos?.x || 0}px, ${config.taglinePos?.y || 0}px)`}; width: fit-content; }
    .pos-address { transform: ${isThermal ? "none" : `translate(${config.addressPos?.x || 0}px, ${config.addressPos?.y || 0}px)`}; width: fit-content; }
    .pos-contacts { transform: ${isThermal ? "none" : `translate(${config.phonePos?.x || 0}px, ${config.phonePos?.y || 0}px)`}; width: fit-content; display: flex; justify-content: center; }
    .pos-website { transform: ${isThermal ? "none" : `translate(${config.websitePos?.x || 0}px, ${config.websitePos?.y || 0}px)`}; width: fit-content; }
  `;
};

/**
 * Generates the HTML for the clinical branding header.
 * Uses a unified model that honors coordinate overrides from the Studio.
 */
export const getPrintHeaderHTML = (config: PrintLayoutConfig, clinic: any, isThermal: boolean = false) => {
  const logoWidth = config.logoWidth || 80;
  const effectiveLogoPosition = isThermal ? "center" : (config.logoPosition || "center");

  // Prioritize clinic?.name to match PrintLayoutTemplate.tsx
  const clinicName = clinic?.name || config.clinicName || "Clinic Name";

  return `
    <div class="header" style="height: ${isThermal ? "auto" : (config.headerHeight === "compact" ? "180px" : config.headerHeight === "expanded" ? "300px" : "240px")}; border-bottom-style: ${isThermal ? "dashed" : "solid"};">
      
      <!-- LOGO -->
      ${config.logoUrl ? `
        <div class="logo-container pos-logo" style="width: ${isThermal ? Math.min(logoWidth, 150) : logoWidth}px;">
          <img src="${config.logoUrl}" class="logo" />
        </div>
      ` : ""}

      <!-- IDENTITY STACK -->
      <div class="identity-stack">
        
        <div class="pos-rel pos-clinicName">
          <h1 class="clinic-name">${clinicName}</h1>
        </div>

        ${config.tagline ? `
          <div class="pos-rel pos-tagline">
            <p class="tagline">${config.tagline}</p>
          </div>
        ` : ""}

        <div class="pos-rel pos-address">
          <div class="address-container">
            <div class="address">${config.address}</div>
            <div class="city-info">
              ${clinic?.city || config.city}${config.state ? `, ${config.state}` : ""} ${config.zipCode} • ${config.country}
            </div>
          </div>
        </div>

        <div class="pos-rel pos-contacts">
          <div class="contact-row" style="${isThermal ? "flex-direction: column; gap: 4px; margin-top: 5px; padding-top: 5px;" : ""}">
            ${config.phone ? `<div class="contact-item"><span class="contact-label">Phone:</span><span class="contact-value">${config.phone}</span></div>` : ""}
            ${config.email ? `<div class="contact-item"><span class="contact-label">Email:</span><span class="contact-value">${config.email}</span></div>` : ""}
          </div>
        </div>

        ${config.website ? `
          <div class="pos-rel pos-website">
            <div class="website">${config.website}</div>
          </div>
        ` : ""}
        
      </div>
    </div>
  `;
};

/**
 * Generates the HTML for the clinical branding footer.
 */
export const getPrintFooterHTML = (config: PrintLayoutConfig) => {
  if (!config.showFooter || !config.footerText) return "";

  return `
    <footer class="footer-section">
      <p class="footer-text">${config.footerText}</p>
    </footer>
  `;
};
