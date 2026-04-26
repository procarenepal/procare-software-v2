import { PrintLayoutConfig } from "@/types/printLayout";

/**
 * Generates the CSS styles for the centralized clinical branding.
 * Uses the Slate-600 palette and centered-stack layout model.
 */
export const getPrintBrandingCSS = (config: PrintLayoutConfig, isThermal: boolean = false) => {
  const primaryColor = config.primaryColor || "#0ea5e9";
  const fontSize = config.fontSize || "medium";
  const headerHeight = isThermal ? "auto" : (
    config.headerHeight === "compact" ? 80 :
      config.headerHeight === "expanded" ? 180 : 130
  );

  const effectiveLogoPosition = isThermal ? "center" : (config.logoPosition || "center");

  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

    .header {
      position: relative;
      width: 100%;
      min-height: ${headerHeight}px;
      background: #fff;
      flex-shrink: 0;
      z-index: 10;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Identity Stack Styling */
    .identity-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: ${effectiveLogoPosition === "center" ? "flex-start" : "center"};
      height: ${effectiveLogoPosition === "center" ? "auto" : "100%"};
      padding: ${isThermal ? "5px 10px" : (effectiveLogoPosition === "center" ? "5px 60px 10px" : "0 60px")};
      font-family: 'Inter', -apple-system, sans-serif;
    }

    .logo-container {
      position: ${effectiveLogoPosition === "center" ? "relative" : "absolute"};
      top: ${effectiveLogoPosition === "center" ? (isThermal ? "5px" : "10px") : "20px"};
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
      font-size: ${isThermal ? "16px" : (fontSize === "small" ? "18px" : fontSize === "large" ? "22px" : "18px")};
      font-weight: 400;
      color: #475569;
      margin: 0;
      line-height: 1.1;
      letter-spacing: -0.01em;
      text-align: center;
    }

    .tagline {
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin: 2px 0 0 0;
      text-align: center;
    }

    .address-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 8px;
    }

    .address {
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
      white-space: pre-wrap;
      text-align: center;
    }

    .city-info {
      font-size: 10px;
      color: #475569;
      margin-top: 1px;
      text-align: center;
    }

    .contact-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
      width: 100%;
      max-width: 400px;
      justify-content: center;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .contact-label {
      font-size: 8px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .contact-value {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }

    .website {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-decoration: none;
      margin-top: ${isThermal ? "2px" : "6px"};
      text-align: center;
    }

    .footer-section {
      border-top: 1px solid #f1f5f9;
      padding: ${isThermal ? "10px 5px" : "10px 40px"};
      text-align: center;
      background: #fff;
      margin-top: 20px;
    }

    .footer-text {
      font-size: 8px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      margin: 0;
    }

    /* Coordinate Overrides */
    .pos-rel { position: relative; }
    .pos-logo { 
      transform: ${isThermal ? "none" : `translate(${config.logoPos?.x || 0}px, ${config.logoPos?.y || 0}px)`};
      left: ${effectiveLogoPosition === "left" ? "40px" : (effectiveLogoPosition === "right" ? "auto" : "50%")};
      right: ${effectiveLogoPosition === "right" ? "40px" : "auto"};
      margin-left: ${effectiveLogoPosition === "center" ? `-${(config.logoWidth || 80) / 2}px` : "0px"};
    }
    .pos-clinicName { transform: ${isThermal ? "none" : `translate(${config.clinicNamePos?.x || 0}px, ${config.clinicNamePos?.y || 0}px)`}; }
    .pos-tagline { transform: ${isThermal ? "none" : `translate(${config.taglinePos?.x || 0}px, ${config.taglinePos?.y || 0}px)`}; }
    .pos-address { transform: ${isThermal ? "none" : `translate(${config.addressPos?.x || 0}px, ${config.addressPos?.y || 0}px)`}; }
    .pos-contacts { transform: ${isThermal ? "none" : `translate(${config.phonePos?.x || 0}px, ${config.phonePos?.y || 0}px)`}; width: 100%; display: flex; justify-content: center; }
    .pos-website { transform: ${isThermal ? "none" : `translate(${config.websitePos?.x || 0}px, ${config.websitePos?.y || 0}px)`}; }
  `;
};

/**
 * Generates the HTML for the clinical branding header.
 */
export const getPrintHeaderHTML = (config: PrintLayoutConfig, clinic: any, isThermal: boolean = false) => {
  const logoWidth = config.logoWidth || 80;
  const effectiveLogoPosition = isThermal ? "center" : (config.logoPosition || "center");

  // Center layout is special: logo on top of text
  if (effectiveLogoPosition === "center") {
    return `
      <div class="header" style="flex-direction: column; align-items: center; justify-content: center; padding: ${isThermal ? "5px 0" : "10px 0"}; border-bottom-style: ${isThermal ? "dashed" : "solid"};">
        ${config.logoUrl ? `
          <div class="logo-container" style="width: ${isThermal ? Math.min(logoWidth, 150) : logoWidth}px; margin-bottom: 5px;">
            <img src="${config.logoUrl}" class="logo" />
          </div>
        ` : ""}
        <div class="identity-stack" style="padding: 0;">
          <div class="pos-rel pos-clinicName">
            <h1 class="clinic-name">${config.clinicName || clinic?.name || "Clinic Name"}</h1>
          </div>
          ${config.tagline ? `<p class="tagline">${config.tagline}</p>` : ""}
          <div class="address-container">
            <div class="address">${config.address}</div>
            <div class="city-info">
              ${clinic?.city || config.city}${config.state ? `, ${config.state}` : ""} ${config.zipCode} • ${config.country}
            </div>
          </div>
          <div class="contact-row" style="${isThermal ? "flex-direction: column; gap: 4px; margin-top: 5px; padding-top: 5px;" : ""}">
            ${config.phone ? `<div class="contact-item"><span class="contact-label">Phone:</span><span class="contact-value">${config.phone}</span></div>` : ""}
            ${config.email ? `<div class="contact-item"><span class="contact-label">Email:</span><span class="contact-value">${config.email}</span></div>` : ""}
          </div>
          ${config.website ? `<div class="website">${config.website}</div>` : ""}
        </div>
      </div>
    `;
  }

  // Side layouts: logo on left or right, text centered in the remaining space
  return `
    <div class="header" style="flex-direction: row; align-items: center; padding: 0 40px;">
      <!-- Left Slot -->
      <div style="flex: 0 0 ${logoWidth}px; display: flex; justify-content: flex-start;">
        ${effectiveLogoPosition === "left" && config.logoUrl ? `<img src="${config.logoUrl}" style="width: ${logoWidth}px; height: auto;" />` : ""}
      </div>

      <!-- Center Slot (Identity) -->
      <div class="identity-stack" style="flex: 1; padding: 0 20px;">
        <h1 class="clinic-name">${config.clinicName || clinic?.name || "Clinic Name"}</h1>
        ${config.tagline ? `<p class="tagline">${config.tagline}</p>` : ""}
        <div class="address-container">
          <div class="address">${config.address}</div>
          <div class="city-info">
            ${clinic?.city || config.city}${config.state ? `, ${config.state}` : ""} ${config.zipCode} • ${config.country}
          </div>
        </div>
        <div class="contact-row">
          ${config.phone ? `<div class="contact-item"><span class="contact-label">Phone:</span><span class="contact-value">${config.phone}</span></div>` : ""}
          ${config.email ? `<div class="contact-item"><span class="contact-label">Email:</span><span class="contact-value">${config.email}</span></div>` : ""}
        </div>
        ${config.website ? `<div class="website">${config.website}</div>` : ""}
      </div>

      <!-- Right Slot -->
      <div style="flex: 0 0 ${logoWidth}px; display: flex; justify-content: flex-end;">
        ${effectiveLogoPosition === "right" && config.logoUrl ? `<img src="${config.logoUrl}" style="width: ${logoWidth}px; height: auto;" />` : ""}
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
