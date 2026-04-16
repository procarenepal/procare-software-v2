/**
 * DocumentsTab — Clinic Clarity, zero HeroUI
 * Replaced: Card, CardBody, Button (@heroui)
 */
import { useState } from "react";
import {
  IoDocumentTextOutline,
  IoAddOutline,
  IoEyeOutline,
  IoDownloadOutline,
  IoTrashOutline,
} from "react-icons/io5";

import AddDocumentModal from "./AddDocumentModal.tsx";

import { Button } from "@/components/ui/button";
import { MedicalDocument } from "@/types/models";
import { MedicalRecordsService } from "@/services/medicalRecordsService";

interface DocumentsTabProps {
  documentRecords: MedicalDocument[];
  onAddDocument: (
    document: any,
    files?: File[],
    onProgress?: (progress: number) => void,
  ) => void;
  onDeleteDocument: (documentId: string) => void;
  deletingDocumentId?: string | null;
}

export default function DocumentsTab({
  documentRecords,
  onAddDocument,
  onDeleteDocument,
  deletingDocumentId,
}: DocumentsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleDownload = (fileId: string) => {
    try {
      const url = MedicalRecordsService.getFileDownloadUrl(fileId);
      const a = document.createElement("a");

      a.href = url;
      a.download = `document-${fileId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    }
  };

  const handleView = (fileId: string) => {
    try {
      window.open(MedicalRecordsService.getFileViewUrl(fileId), "_blank");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[13px] font-semibold text-mountain-800">
            Documents
          </h4>
          <p className="text-[11.5px] text-mountain-400">
            {documentRecords.length}{" "}
            {documentRecords.length === 1 ? "file" : "files"} attached
          </p>
        </div>
        <Button
          color="primary"
          size="sm"
          startContent={<IoAddOutline className="w-3.5 h-3.5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Document
        </Button>
      </div>

      {/* Empty state */}
      {documentRecords.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-mountain-200 rounded">
          <IoDocumentTextOutline className="mx-auto w-10 h-10 text-mountain-300 mb-3" />
          <p className="text-[13px] font-medium text-mountain-600 mb-1">
            No documents
          </p>
          <p className="text-[12px] text-mountain-400 mb-4">
            No medical documents have been added yet.
          </p>
          <Button
            color="primary"
            size="sm"
            startContent={<IoAddOutline className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
          >
            Add First Document
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {documentRecords.map((record) => (
            <div
              key={record.id}
              className="flex items-start gap-3 border border-mountain-200 rounded px-3 py-3 hover:bg-mountain-25 transition-colors"
            >
              {/* Icon */}
              <div className="p-2 bg-teal-50 border border-teal-100 rounded shrink-0">
                <IoDocumentTextOutline className="w-4 h-4 text-teal-600" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[12.5px] font-semibold text-mountain-800">
                    Medical Document
                  </p>
                  <p className="text-[11px] text-mountain-400 shrink-0">
                    {fmtDate(record.createdAt)}
                  </p>
                </div>

                {record.note && (
                  <p className="text-[12px] text-mountain-500 bg-mountain-50 border border-mountain-100 rounded px-2 py-1.5 mb-2 line-clamp-2">
                    {record.note}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {record.file ? (
                    <>
                      <Button
                        color="default"
                        size="sm"
                        startContent={<IoEyeOutline className="w-3 h-3" />}
                        variant="bordered"
                        onClick={() => handleView(record.file!)}
                      >
                        View
                      </Button>
                      <Button
                        color="default"
                        size="sm"
                        startContent={<IoDownloadOutline className="w-3 h-3" />}
                        variant="bordered"
                        onClick={() => handleDownload(record.file!)}
                      >
                        Download
                      </Button>
                    </>
                  ) : (
                    <span className="text-[11.5px] text-mountain-400">
                      No file attached
                    </span>
                  )}
                  <Button
                    color="danger"
                    disabled={deletingDocumentId === record.id}
                    isLoading={deletingDocumentId === record.id}
                    size="sm"
                    startContent={<IoTrashOutline className="w-3 h-3" />}
                    variant="bordered"
                    onClick={() => onDeleteDocument(record.id)}
                  >
                    {deletingDocumentId === record.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddDocument}
      />
    </div>
  );
}
