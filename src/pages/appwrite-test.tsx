import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Progress,
  Divider,
  Snippet,
  Chip,
} from "@heroui/react";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { addToast } from "@heroui/toast";

import {
  uploadImage,
  deleteFile,
  UploadResult,
} from "@/services/appwriteStorageService";

const AppwriteTestPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Show upload progress toast
      addToast({
        title: "Uploading...",
        description: "Uploading image to Appwrite storage...",
        color: "primary",
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);

            return prev;
          }

          return prev + 10;
        });
      }, 200);

      // Upload with image optimization (max 800px width)
      const result = await uploadImage(selectedFile, undefined, 800);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to uploaded files list
      setUploadedFiles((prev) => [result, ...prev]);

      // Success toast
      addToast({
        title: "Upload successful!",
        description: `File ID: ${result.fileId}`,
        color: "success",
      });

      // Reset form
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Upload failed:", error);
      addToast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        color: "danger",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      addToast({
        title: "Deleting...",
        description: "Deleting file from Appwrite storage...",
        color: "warning",
      });

      await deleteFile(fileId);

      // Remove from uploaded files list
      setUploadedFiles((prev) => prev.filter((file) => file.fileId !== fileId));

      addToast({
        title: "File deleted successfully!",
        color: "success",
      });
    } catch (error) {
      console.error("Delete failed:", error);
      addToast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        color: "danger",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Appwrite Image Upload Test</h1>
        <p className="text-default-600">
          Test the Appwrite image upload system without authentication. Upload,
          view, and delete images to verify the storage integration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Upload Image</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-default-300 hover:border-default-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-default-400" />
              <p className="text-default-600 mb-2">
                Drag & drop an image here, or click to select
              </p>
              <input
                accept="image/*"
                className="hidden"
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <Button
                as="label"
                className="cursor-pointer"
                color="primary"
                htmlFor="file-upload"
                variant="flat"
              >
                Choose File
              </Button>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="p-4 bg-default-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{selectedFile.name}</span>
                  <Chip color="primary" size="sm" variant="flat">
                    {formatFileSize(selectedFile.size)}
                  </Chip>
                </div>
                <div className="text-sm text-default-600 mb-3">
                  Type: {selectedFile.type}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress
                      className="mb-2"
                      color="primary"
                      value={uploadProgress}
                    />
                    <p className="text-sm text-default-600">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  color="primary"
                  disabled={uploading}
                  onClick={handleUpload}
                >
                  {uploading ? "Uploading..." : "Upload to Appwrite"}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Configuration Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <h2 className="text-lg font-semibold">Appwrite Configuration</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-default-600">
                  Endpoint
                </label>
                <Snippet className="w-full" size="sm">
                  {import.meta.env.VITE_APPWRITE_ENDPOINT || "Not configured"}
                </Snippet>
              </div>

              <div>
                <label className="text-sm font-medium text-default-600">
                  Project ID
                </label>
                <Snippet className="w-full" size="sm">
                  {import.meta.env.VITE_APPWRITE_PROJECT_ID || "Not configured"}
                </Snippet>
              </div>

              <div>
                <label className="text-sm font-medium text-default-600">
                  Bucket ID
                </label>
                <Snippet className="w-full" size="sm">
                  {import.meta.env.VITE_APPWRITE_BUCKET_ID || "Not configured"}
                </Snippet>
              </div>
            </div>

            <Divider />

            <div className="flex items-center gap-2">
              <Chip
                color={uploadedFiles.length > 0 ? "success" : "default"}
                size="sm"
                variant="flat"
              >
                {uploadedFiles.length > 0 ? "Connected" : "Ready"}
              </Chip>
              <span className="text-sm text-default-600">
                {uploadedFiles.length} file(s) uploaded
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Uploaded Files</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.fileId} className="border rounded-lg p-4">
                  <div className="aspect-square mb-3 bg-default-100 rounded-lg overflow-hidden">
                    <img
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                      src={file.fileUrl}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden",
                        );
                      }}
                    />
                    <div className="hidden w-full h-full bg-default-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-default-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-sm truncate">
                      {file.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-default-600">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{file.mimeType}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        startContent={<ExternalLink className="w-3 h-3" />}
                        variant="flat"
                        onClick={() => window.open(file.fileUrl, "_blank")}
                      >
                        View
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<Trash2 className="w-3 h-3" />}
                        variant="flat"
                        onClick={() => handleDelete(file.fileId)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default AppwriteTestPage;
