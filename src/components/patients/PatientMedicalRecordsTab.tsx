/**
 * PatientMedicalRecordsTab — Clinic Clarity, zero HeroUI
 * Replaced: Card, Chip, Spinner, Divider, Tabs, Tab, addToast (heroui)
 * Sub-tabs for Documents and X-rays rendered via custom inline tab strip.
 */
import { useState, useEffect } from "react";
import { IoDocumentsOutline, IoImageOutline } from "react-icons/io5";

import DocumentsTab from "./medical-records/DocumentsTab";
import XraysTab from "./medical-records/XraysTab";

import { useAuth } from "@/hooks/useAuth";
import { addToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { MedicalDocument, XrayRecord } from "@/types/models";
import { MedicalRecordsService } from "@/services/medicalRecordsService";

interface PatientMedicalRecordsTabProps {
  patientId: string;
}

const SUB_TABS = [
  {
    key: "documents",
    label: "Documents",
    icon: <IoDocumentsOutline className="w-3.5 h-3.5" />,
  },
  {
    key: "xrays",
    label: "X-rays",
    icon: <IoImageOutline className="w-3.5 h-3.5" />,
  },
];

export default function PatientMedicalRecordsTab({
  patientId,
}: PatientMedicalRecordsTabProps) {
  const { clinicId, currentUser } = useAuth();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [xrays, setXrays] = useState<XrayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("documents");
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );
  const [deletingXrayId, setDeletingXrayId] = useState<string | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const [docs, rays] = await Promise.all([
        MedicalRecordsService.getDocumentsByPatient(patientId, clinicId),
        MedicalRecordsService.getXraysByPatient(patientId, clinicId),
      ]);

      setDocuments(docs);
      setXrays(rays);
    } catch {
      addToast({
        title: "Error",
        description: "Failed to load medical records.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [patientId, clinicId]);

  const handleAddDocument = async (
    data: any,
    files?: File[],
    onProgress?: (p: number) => void,
  ) => {
    if (!clinicId || !currentUser) return;
    const file = files?.[0];

    await MedicalRecordsService.createDocumentWithProgress(
      patientId,
      clinicId,
      data.note,
      currentUser.uid,
      file,
      onProgress,
    );
    const updated = await MedicalRecordsService.getDocumentsByPatient(
      patientId,
      clinicId,
    );

    setDocuments(updated);
    addToast({ title: "Document added", color: "success" });
  };

  const handleAddXray = async (
    data: any,
    files?: File[],
    onProgress?: (p: number) => void,
  ) => {
    if (!clinicId || !currentUser) return;
    const file = files?.[0];

    await MedicalRecordsService.createXrayRecordWithProgress(
      patientId,
      clinicId,
      data.note,
      currentUser.uid,
      file,
      onProgress,
    );
    const updated = await MedicalRecordsService.getXraysByPatient(
      patientId,
      clinicId,
    );

    setXrays(updated);
    addToast({ title: "X-ray added", color: "success" });
  };

  const handleDeleteDocument = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Delete this medical document? This cannot be undone."))
      return;
    setDeletingDocumentId(id);
    try {
      await MedicalRecordsService.deleteDocument(id);
      setDocuments((p) => p.filter((d) => d.id !== id));
      addToast({ title: "Document deleted", color: "success" });
    } catch {
      addToast({
        title: "Error",
        description: "Failed to delete document.",
        color: "danger",
      });
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleDeleteXray = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Delete this X-ray record? This cannot be undone."))
      return;
    setDeletingXrayId(id);
    try {
      await MedicalRecordsService.deleteXrayRecord(id);
      setXrays((p) => p.filter((x) => x.id !== id));
      addToast({ title: "X-ray deleted", color: "success" });
    } catch {
      addToast({
        title: "Error",
        description: "Failed to delete X-ray.",
        color: "danger",
      });
    } finally {
      setDeletingXrayId(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Loading records…" size="lg" />
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-section-title text-mountain-900">
          Medical Records
        </h2>
        <p className="text-[12.5px] text-mountain-400">
          Documents and X-ray imaging records
        </p>
      </div>

      {/* Card shell */}
      <div className="bg-white border border-mountain-200 rounded overflow-hidden">
        {/* Sub-tab strip */}
        <div className="flex border-b border-mountain-100 bg-mountain-25 overflow-x-auto">
          {SUB_TABS.map((t) => {
            const count =
              t.key === "documents" ? documents.length : xrays.length;
            const active = subTab === t.key;

            return (
              <button
                key={t.key}
                className={`flex items-center gap-1.5 px-5 py-3 text-[12.5px] font-medium whitespace-nowrap border-b-2 transition-colors
                  ${
                    active
                      ? "border-teal-700 text-teal-700 bg-white"
                      : "border-transparent text-mountain-500 hover:text-teal-600 hover:bg-mountain-50"
                  }`}
                type="button"
                onClick={() => setSubTab(t.key)}
              >
                {t.icon}
                {t.label}
                <span
                  className={`ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border
                  ${
                    active
                      ? "bg-teal-100 text-teal-700 border-teal-200"
                      : "bg-mountain-100 text-mountain-500 border-mountain-200"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {subTab === "documents" && (
            <DocumentsTab
              deletingDocumentId={deletingDocumentId}
              documentRecords={documents}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}
          {subTab === "xrays" && (
            <XraysTab
              deletingXrayId={deletingXrayId}
              xrayRecords={xrays}
              onAddXray={handleAddXray}
              onDeleteXray={handleDeleteXray}
            />
          )}
        </div>
      </div>
    </div>
  );
}
