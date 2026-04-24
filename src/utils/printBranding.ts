import { PrintLayoutConfig } from "@/types/printLayout";

/**
 * Generates the CSS styles for the centralized clinical branding.
 * Uses the Slate-600 palette and centered-stack layout model.
 */
export const getPrintBrandingCSS = (config: PrintLayoutConfig) => {
  const primaryColor = config.primaryColor || "#0ea5e9";
  const fontSize = config.fontSize || "medium";
  const headerHeight =
    config.headerHeight === "compact" ? 80 :
      config.headerHeight === "expanded" ? 180 : 130;

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
      justify-content: ${config.logoPosition === "center" ? "flex-start" : "center"};
      height: ${config.logoPosition === "center" ? "auto" : "100%"};
      padding: ${config.logoPosition === "center" ? "5px 60px 10px" : "0 60px"};
      font-family: 'Inter', -apple-system, sans-serif;
    }

    .logo-container {
      position: ${config.logoPosition === "center" ? "relative" : "absolute"};
      top: ${config.logoPosition === "center" ? "10px" : "20px"};
      z-index: 100;
      display: flex;
      justify-content: center;
      margin-bottom: ${config.logoPosition === "center" ? "5px" : "0"};
    }

    .logo {
      width: 100%;
      height: auto;
      object-fit: contain;
      display: block;
    }

    .clinic-name {
      font-size: ${fontSize === "small" ? "18px" : fontSize === "large" ? "22px" : "18px"};
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
      margin-top: 6px;
      text-align: center;
    }

    .footer-section {
      border-top: 1px solid #f1f5f9;
      padding: 10px 40px;
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
      transform: translate(${config.logoPos?.x || 0}px, ${config.logoPos?.y || 0}px);
      left: ${config.logoPosition === "left" ? "40px" : (config.logoPosition === "right" ? "auto" : "50%")};
      right: ${config.logoPosition === "right" ? "40px" : "auto"};
      margin-left: ${config.logoPosition === "center" ? `-${(config.logoWidth || 80) / 2}px` : "0px"};
    }
    .pos-clinicName { transform: translate(${(config as any).clinic_name_pos?.x || 0}px, ${(config as any).clinic_name_pos?.y || 0}px); }
    .pos-tagline { transform: translate(${(config as any).tagline_pos?.x || 0}px, ${(config as any).tagline_pos?.y || 0}px); }
    .pos-address { transform: translate(${(config as any).address_pos?.x || 0}px, ${(config as any).address_pos?.y || 0}px); }
    .pos-contacts { transform: translate(${(config as any).contacts_pos?.x || 0}px, ${(config as any).contacts_pos?.y || 0}px); width: 100%; display: flex; justify-content: center; }
    .pos-website { transform: translate(${(config as any).website_pos?.x || 0}px, ${(config as any).website_pos?.y || 0}px); }
  `;
};

/**
 * Generates the HTML for the clinical branding header.
 */
export const getPrintHeaderHTML = (config: PrintLayoutConfig, clinic: any) => {
  const logoWidth = config.logoWidth || 80;
  const logoPosition = config.logoPosition || "center";

  // Center layout is special: logo on top of text
  if (logoPosition === "center") {
    return `
      <div class="header" style="flex-direction: column; align-items: center; justify-content: center; padding: 10px 0;">
        ${config.logoUrl ? `
          <div class="logo-container" style="width: ${logoWidth}px; margin-bottom: 10px;">
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
          <div class="contact-row">
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
        ${logoPosition === "left" && config.logoUrl ? `<img src="${config.logoUrl}" style="width: ${logoWidth}px; height: auto;" />` : ""}
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
        ${logoPosition === "right" && config.logoUrl ? `<img src="${config.logoUrl}" style="width: ${logoWidth}px; height: auto;" />` : ""}
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
