import React, { useState, useEffect } from "react";
import { 
  IoAddOutline, 
  IoSearchOutline, 
  IoCreateOutline, 
  IoTrashOutline, 
  IoImageOutline,
  IoCallOutline,
  IoMailOutline,
  IoShieldCheckmarkOutline,
  IoCloseOutline,
  IoPersonOutline,
  IoBriefcaseOutline
} from "react-icons/io5";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { addToast } from "@/components/ui/toast";
import { PathologySignatory } from "@/types/models";
import { pathologySignatoryService } from "@/services/pathologySignatoryService";
import { uploadImage } from "@/services/appwriteStorageService";
import { useAuthContext } from "@/context/AuthContext";
import { useModalState } from "@/hooks/useModalState";

interface PathologySignatoryManagementProps {
  clinicId: string;
  branchId: string;
  onRefresh?: () => Promise<void>;
}

export default function PathologySignatoryManagement({
  clinicId,
  branchId,
  onRefresh,
}: PathologySignatoryManagementProps) {
  const { currentUser } = useAuthContext();
  const [signatories, setSignatories] = useState<PathologySignatory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const modalState = useModalState();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    designation: "Consultant Pathologist",
    registrationNumber: "",
    phone: "",
    email: "",
    signatureUrl: "",
    isActive: true,
  });

  const loadSignatories = async () => {
    try {
      setLoading(true);
      const data = await pathologySignatoryService.getSignatoriesByClinic(clinicId, branchId);
      setSignatories(data);
    } catch (error) {
      console.error("Error loading signatories:", error);
      addToast({ title: "Error", description: "Failed to load signatories", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId && branchId) {
      loadSignatories();
    }
  }, [clinicId, branchId]);

  const filteredSignatories = signatories.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      name: "",
      designation: "Consultant Pathologist",
      registrationNumber: "",
      phone: "",
      email: "",
      signatureUrl: "",
      isActive: true,
    });
    setIsEditing(false);
    setSelectedId(null);
  };

  const handleEdit = (s: PathologySignatory) => {
    setForm({
      name: s.name,
      designation: s.designation,
      registrationNumber: s.registrationNumber,
      phone: s.phone || "",
      email: s.email || "",
      signatureUrl: s.signatureUrl || "",
      isActive: s.isActive,
    });
    setSelectedId(s.id);
    setIsEditing(true);
    modalState.open();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete signatory "${name}"?`)) return;
    
    try {
      await pathologySignatoryService.deleteSignatory(id);
      addToast({ title: "Success", description: "Signatory deleted successfully", color: "success" });
      loadSignatories();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting signatory:", error);
      addToast({ title: "Error", description: "Failed to delete signatory", color: "danger" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSubmitting(true);
      const result = await uploadImage(file, `signatory-sig-${Date.now()}-${file.name}`, 400, 200);
      setForm(prev => ({ ...prev, signatureUrl: result.fileUrl }));
      addToast({ title: "Success", description: "Signature uploaded successfully", color: "success" });
    } catch (error) {
      console.error("Upload error:", error);
      addToast({ title: "Error", description: "Failed to upload signature", color: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSubmitting(true);
      if (isEditing && selectedId) {
        await pathologySignatoryService.updateSignatory(selectedId, {
          ...form,
        });
        addToast({ title: "Success", description: "Signatory updated successfully", color: "success" });
      } else {
        await pathologySignatoryService.createSignatory({
          ...form,
          clinicId,
          branchId,
          createdBy: currentUser.uid,
        });
        addToast({ title: "Success", description: "Signatory added successfully", color: "success" });
      }
      modalState.close();
      loadSignatories();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Submit error:", error);
      addToast({ title: "Error", description: "Failed to save signatory", color: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" label="Loading signatories..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mountain-400" />
          <input
            className="w-full h-[32px] pl-9 pr-3 border border-mountain-200 rounded text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
            placeholder="Search signatories..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          color="primary" 
          startContent={<IoAddOutline />} 
          onClick={() => { resetForm(); modalState.open(); }}
        >
          Add Authorized Signatory
        </Button>
      </div>

      {filteredSignatories.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="clarity-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-mountain-50 border-b border-mountain-200">
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Signatory Details</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Professional Credentials</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Contact</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Signature</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-mountain-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignatories.map((s) => (
                <tr key={s.id} className="hover:bg-mountain-50/40 border-b border-mountain-100 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-semibold text-xs border border-teal-100">
                        {s.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-mountain-900">{s.name}</p>
                        <p className="text-[11.5px] text-mountain-500">{s.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[12px] text-mountain-600">
                      <IoShieldCheckmarkOutline className="w-3.5 h-3.5 text-teal-600" />
                      <span className="font-medium">{s.registrationNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-[12px] text-mountain-600">
                          <IoCallOutline className="w-3.5 h-3.5" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1.5 text-[12px] text-mountain-600">
                          <IoMailOutline className="w-3.5 h-3.5" />
                          <span>{s.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.signatureUrl ? (
                      <img 
                        src={s.signatureUrl} 
                        alt="Signature" 
                        className="h-10 w-auto object-contain border border-mountain-100 rounded bg-mountain-50/50" 
                      />
                    ) : (
                      <span className="text-[11px] text-mountain-400 italic">No signature</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<IoCreateOutline />}
                        variant="flat"
                        onClick={() => handleEdit(s)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<IoTrashOutline />}
                        variant="flat"
                        onClick={() => handleDelete(s.id, s.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-mountain-50/30 rounded-xl border border-dashed border-mountain-200">
          <IoShieldCheckmarkOutline className="w-12 h-12 text-mountain-200 mb-3" />
          <p className="text-mountain-500 text-[14px] font-medium">
            {searchQuery ? "No matching signatories found" : "No authorized signatories registered yet"}
          </p>
          <p className="text-mountain-400 text-[12px] mt-1">
            {searchQuery ? "Try adjusting your search terms" : "Click the button above to add a pathologist or clinical director"}
          </p>
        </div>
      )}

      {/* Form Modal */}
      {modalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-mountain-900/60 backdrop-blur-sm" onClick={modalState.close} />
          <div className="relative z-10 bg-white border border-mountain-200 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-mountain-100 bg-mountain-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-mountain-900">
                  {isEditing ? "Edit Signatory Details" : "Add Authorized Signatory"}
                </h2>
                <p className="text-[12px] text-mountain-500 mt-0.5">
                  Enter professional designation and medical registration details
                </p>
              </div>
              <button className="p-2 hover:bg-mountain-100 rounded-full transition-colors" onClick={modalState.close}>
                <IoCloseOutline className="w-5 h-5 text-mountain-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 md:col-span-1">
                  <Input
                    isRequired
                    label="Full Name"
                    placeholder="e.g. Dr. Anjali Joshi"
                    value={form.name}
                    onValueChange={(v) => setForm(prev => ({ ...prev, name: v }))}
                    startContent={<IoPersonOutline className="text-mountain-400" />}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <Input
                    isRequired
                    label="Designation"
                    placeholder="e.g. Consultant Pathologist"
                    value={form.designation}
                    onValueChange={(v) => setForm(prev => ({ ...prev, designation: v }))}
                    startContent={<IoBriefcaseOutline className="text-mountain-400" />}
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <Input
                    isRequired
                    label="Registration Number (e.g. NMC)"
                    placeholder="e.g. NMC-12345"
                    value={form.registrationNumber}
                    onValueChange={(v) => setForm(prev => ({ ...prev, registrationNumber: v }))}
                    startContent={<IoShieldCheckmarkOutline className="text-mountain-400" />}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <Input
                    label="Phone Number"
                    placeholder="e.g. 98XXXXXXXX"
                    value={form.phone}
                    onValueChange={(v) => setForm(prev => ({ ...prev, phone: v }))}
                    startContent={<IoCallOutline className="text-mountain-400" />}
                  />
                </div>

                <div className="col-span-2">
                  <Input
                    label="Email Address"
                    placeholder="e.g. pathologist@clinic.com"
                    type="email"
                    value={form.email}
                    onValueChange={(v) => setForm(prev => ({ ...prev, email: v }))}
                    startContent={<IoMailOutline className="text-mountain-400" />}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-mountain-700 block mb-2">Digital Signature</label>
                  <div className="flex items-start gap-4 p-4 border border-dashed border-mountain-200 rounded-lg bg-mountain-50/50">
                    <div className="shrink-0">
                      {form.signatureUrl ? (
                        <div className="relative group">
                          <img 
                            src={form.signatureUrl} 
                            alt="Preview" 
                            className="h-20 w-40 object-contain bg-white border border-mountain-200 rounded p-1 shadow-sm" 
                          />
                          <button 
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setForm(prev => ({ ...prev, signatureUrl: "" }))}
                          >
                            <IoCloseOutline className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 w-40 border border-mountain-200 rounded bg-white flex flex-col items-center justify-center text-mountain-300">
                          <IoImageOutline className="w-8 h-8" />
                          <span className="text-[10px] mt-1">Preview</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-mountain-500 mb-3">
                        Upload a clear PNG/JPG image of the signatory's signature. This will be used as the authorized signature on pathology reports.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="signatory-signature-upload"
                        onChange={handleFileUpload}
                        disabled={submitting}
                      />
                      <label 
                        htmlFor="signatory-signature-upload"
                        className={`inline-flex items-center px-4 py-2 border border-mountain-200 rounded-md bg-white text-[12px] font-medium text-mountain-700 hover:bg-mountain-50 cursor-pointer transition-all active:scale-95 ${submitting ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <IoImageOutline className="mr-2 w-4 h-4 text-teal-600" />
                        {submitting ? "Uploading..." : form.signatureUrl ? "Change Signature" : "Upload Signature"}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pb-2">
                <Button variant="flat" color="default" onClick={modalState.close} isDisabled={submitting}>
                  Cancel
                </Button>
                <Button color="primary" type="submit" isLoading={submitting}>
                  {isEditing ? "Save Changes" : "Register Signatory"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
