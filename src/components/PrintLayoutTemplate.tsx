import React from "react";

import { PrintLayoutConfig } from "@/types/printLayout";

interface PrintLayoutTemplateProps {
  layoutConfig: PrintLayoutConfig;
  clinicName?: string;
  documentTitle?: string;
  documentSubtitle?: string;
  documentNumber?: string;
  documentDate?: string;
  children: React.ReactNode;
  showInPrint?: boolean;
  className?: string;
}

export const PrintLayoutTemplate: React.FC<PrintLayoutTemplateProps> = ({
  layoutConfig,
  clinicName,
  documentTitle,
  documentSubtitle,
  documentNumber,
  documentDate,
  children,
  showInPrint = false,
  className = "",
}) => {
  // Inject print-specific CSS to remove default page margins
  const printStyles = `
    @page { margin: 0; size: auto; }
    @media print {
      html, body { margin: 0; padding: 0; }
    }
  `;
  const containerClasses = showInPrint ? "block" : "print-only";

  return (
    <>
      <style>{printStyles}</style>
      <div
        className={`${containerClasses} bg-white flex flex-col relative w-full h-full m-0 p-0 ${className}`}
        style={{
          border: showInPrint ? "none" : "1px solid #e4e4e7",
          borderRadius: showInPrint ? "0" : "8px",
          boxShadow: showInPrint ? "none" : "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          padding: showInPrint ? "0" : "16px",
        }}
      >
        {/* Header - Unified structure */}
        <div
          className={`border-b border-gray-300 ${showInPrint ? "p-2" : "p-4"} ${
            layoutConfig.headerHeight === "compact"
              ? "pb-2"
              : layoutConfig.headerHeight === "expanded"
                ? "pb-6"
                : "pb-4"
          }`}
        >
          <div className="flex justify-between items-start gap-4">
            <div
              className={`flex items-center gap-4 ${
                layoutConfig.logoPosition === "center"
                  ? "justify-center text-center"
                  : layoutConfig.logoPosition === "right"
                    ? "justify-end text-right"
                    : "justify-start text-left"
              }`}
            >
              {layoutConfig.logoUrl && (
                <img
                  alt="Logo"
                  className={`object-contain ${
                    layoutConfig.logoSize === "small"
                      ? "h-8 w-auto"
                      : layoutConfig.logoSize === "large"
                        ? "h-16 w-auto"
                        : "h-12 w-auto"
                  }`}
                  src={layoutConfig.logoUrl}
                />
              )}
              <div
                className={
                  layoutConfig.logoPosition === "center" ? "text-center" : ""
                }
              >
                <h1
                  className={`font-bold text-gray-900 ${
                    layoutConfig.fontSize === "small"
                      ? "text-lg"
                      : layoutConfig.fontSize === "large"
                        ? "text-2xl"
                        : "text-xl"
                  }`}
                  style={{ color: layoutConfig.primaryColor }}
                >
                  {clinicName || layoutConfig.clinicName || "Clinic Name"}
                </h1>
                {layoutConfig.tagline && (
                  <p className="text-sm text-gray-600 mt-1">
                    {layoutConfig.tagline}
                  </p>
                )}
                <div
                  className={`text-gray-700 mt-2 ${
                    layoutConfig.fontSize === "small"
                      ? "text-xs"
                      : layoutConfig.fontSize === "large"
                        ? "text-sm"
                        : "text-xs"
                  }`}
                >
                  <p>{layoutConfig.address}</p>
                  <p>
                    {layoutConfig.city}
                    {layoutConfig.state ? `, ${layoutConfig.state}` : ""}
                    {layoutConfig.zipCode ? ` ${layoutConfig.zipCode}` : ""}
                  </p>
                  {layoutConfig.website && (
                    <p>Website: {layoutConfig.website}</p>
                  )}
                </div>
              </div>
            </div>
            <div
              className={`text-right ${
                layoutConfig.fontSize === "small"
                  ? "text-xs"
                  : layoutConfig.fontSize === "large"
                    ? "text-sm"
                    : "text-xs"
              }`}
            >
              <p className="text-gray-700">
                <strong>Phone:</strong> {layoutConfig.phone}
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong> {layoutConfig.email}
              </p>
            </div>
          </div>
        </div>

        {/* Document Title - Only show if provided */}
        {(documentTitle ||
          documentSubtitle ||
          documentNumber ||
          documentDate) && (
          <div className="text-center my-4">
            {documentTitle && (
              <h2
                className={`font-semibold text-gray-900 ${
                  layoutConfig.fontSize === "small"
                    ? "text-base"
                    : layoutConfig.fontSize === "large"
                      ? "text-xl"
                      : "text-lg"
                }`}
              >
                {documentTitle.toUpperCase()}
              </h2>
            )}
            {documentSubtitle && (
              <p className="text-sm text-gray-600 mt-1">{documentSubtitle}</p>
            )}
            {(documentNumber || documentDate) && (
              <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                {documentNumber && <span>{documentNumber}</span>}
                {documentDate && <span>Date: {documentDate}</span>}
              </div>
            )}
          </div>
        )}

        {/* Document Content */}
        <div className={`flex-1 ${showInPrint ? "p-2" : "p-4"}`}>
          {children}
        </div>

        {/* Footer - Only show if enabled and has text */}
        {layoutConfig.showFooter && layoutConfig.footerText && (
          <div
            className={`border-t border-gray-300 text-center mt-auto ${showInPrint ? "p-2" : "p-4"}`}
          >
            <p
              className={`text-gray-600 ${
                layoutConfig.fontSize === "small"
                  ? "text-xs"
                  : layoutConfig.fontSize === "large"
                    ? "text-sm"
                    : "text-xs"
              }`}
            >
              {layoutConfig.footerText}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default PrintLayoutTemplate;
