/**
 * AddDocumentModal — Clinic Clarity, zero HeroUI
 * Replaced: Modal, Button, Textarea, Card, CardBody, Progress (@heroui)
 * Uses createPortal to guarantee full-viewport overlay.
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  IoCloseOutline,
  IoDocumentOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";

import { Button } from "@/components/ui/button";

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    document: any,
    files?: File[],
    onProgress?: (progress: number) => void,
  ) => void;
}

const fmtSize = (b: number) => {
  if (b === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));

  return `${parseFloat((b / Math.pow(1024, i)).toFixed(2))} ${units[i]}`;
};

export default function AddDocumentModal({
  isOpen,
  onClose,
  onSubmit,
}: AddDocumentModalProps) {
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Lock real scroll container
  useEffect(() => {
    if (!isOpen) return;
    const el = (document.getElementById("dashboard-scroll-container") ??
      document.body) as HTMLElement;
    const prev = el.style.overflow;

    el.style.overflow = "hidden";

    return () => {
      el.style.overflow = prev;
    };
  }, [isOpen]);

  const reset = () => {
    setNote("");
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      await onSubmit({ note }, [selectedFile], (p) => setUploadProgress(p));
      reset();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 overflow-hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isUploading) {
          reset();
          onClose();
        }
      }}
    >
      <div
        className="bg-white border border-mountain-200 rounded w-full max-w-lg flex flex-col max-h-[90vh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-mountain-100 shrink-0">
          <h3 className="text-[14px] font-semibold text-mountain-900">
            Add Medical Document
          </h3>
          {!isUploading && (
            <button
              className="text-mountain-400 hover:text-mountain-700"
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* File picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-mountain-700">
                Document File <span className="text-red-500">*</span>
              </label>
              <button
                className="text-[11.5px] font-medium px-2.5 py-1 rounded border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={!!selectedFile || isUploading}
                type="button"
                onClick={() =>
                  document.getElementById("doc-file-input")?.click()
                }
              >
                {selectedFile ? "File Selected" : "Choose File"}
              </button>
            </div>
            <input
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              className="hidden"
              id="doc-file-input"
              type="file"
              onChange={(e) =>
                e.target.files?.[0] && setSelectedFile(e.target.files[0])
              }
            />
            <p className="text-[10.5px] text-mountain-400">
              Supported: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
            </p>

            {/* Selected file card */}
            {selectedFile && (
              <div className="flex items-center gap-3 border border-teal-200 bg-teal-50 rounded px-3 py-2">
                <IoDocumentOutline className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-mountain-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10.5px] text-mountain-400">
                    {fmtSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <button
                    className="text-mountain-400 hover:text-red-500 transition-colors shrink-0"
                    type="button"
                    onClick={() => setSelectedFile(null)}
                  >
                    <IoCloseOutline className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Progress bar */}
            {isUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11.5px] text-mountain-600">
                  <span className="flex items-center gap-1">
                    <IoCloudUploadOutline className="w-3.5 h-3.5 text-teal-600" />{" "}
                    Uploading…
                  </span>
                  <span className="font-semibold">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="h-1.5 bg-mountain-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-mountain-700">
              Note (Optional)
            </label>
            <textarea
              className="w-full px-2.5 py-2 text-[12.5px] border border-mountain-200 rounded bg-white text-mountain-800
                placeholder:text-mountain-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100
                disabled:bg-mountain-50 resize-y"
              disabled={isUploading}
              placeholder="Add an optional note or description for this document…"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-mountain-100 shrink-0">
          <Button
            color="default"
            disabled={isUploading}
            size="sm"
            variant="bordered"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
            size="sm"
            onClick={handleSubmit}
          >
            {isUploading ? "Uploading…" : "Add Document"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
