import React, { useEffect, useState } from "react";

import PrintLayoutTemplate from "./PrintLayoutTemplate";

import { useAuthContext } from "@/context/AuthContext";
import { clinicService } from "@/services/clinicService";
import {
  PrintLayoutConfig,
  createPrintLayoutConfig,
} from "@/types/printLayout";

interface PrintLayoutProps {
  documentTitle: string;
  documentSubtitle?: string;
  documentNumber?: string;
  documentDate?: string;
  children: React.ReactNode;
  showInPrint?: boolean;
  className?: string;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({
  documentTitle,
  documentSubtitle,
  documentNumber,
  documentDate,
  children,
  showInPrint = false,
  className = "",
}) => {
  const { clinicId } = useAuthContext();
  const [layoutConfig, setLayoutConfig] = useState<PrintLayoutConfig | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLayoutConfig = async () => {
      if (!clinicId) return;

      try {
        const config = await clinicService.getPrintLayoutConfig(clinicId);

        if (config) {
          // Ensure clinic name is set from the config or fetch it if missing
          const clinic = await clinicService.getClinicById(clinicId);

          setLayoutConfig({
            ...config,
            clinicName: config.clinicName || clinic?.name || "Clinic Name",
          });
        } else {
          // Use default layout if no configuration found
          const clinic = await clinicService.getClinicById(clinicId);

          if (clinic) {
            setLayoutConfig(
              createPrintLayoutConfig(clinicId, "", {
                clinicName: clinic.name || "Clinic Name",
                city: clinic.city || "",
                phone: clinic.phone || "",
                email: clinic.email || "",
              }),
            );
          }
        }
      } catch (error) {
        console.error("Error loading print layout config:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLayoutConfig();
  }, [clinicId]);

  if (loading || !layoutConfig) {
    return (
      <div className={`${showInPrint ? "print:block" : "print-only"} p-6`}>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <PrintLayoutTemplate
      className={className}
      clinicName={layoutConfig.clinicName}
      documentDate={documentDate}
      documentNumber={documentNumber}
      documentSubtitle={documentSubtitle}
      documentTitle={documentTitle}
      layoutConfig={layoutConfig}
      showInPrint={showInPrint}
    >
      {children}
    </PrintLayoutTemplate>
  );
};

export default PrintLayout;
