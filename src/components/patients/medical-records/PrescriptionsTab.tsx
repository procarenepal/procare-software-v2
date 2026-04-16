import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { IoFlaskOutline, IoAddOutline, IoEyeOutline } from "react-icons/io5";

import AddPrescriptionModal from "./AddPrescriptionModal.tsx";

import { MedicalRecord } from "@/types/medical-records";

interface PrescriptionsTabProps {
  prescriptionRecords: MedicalRecord[];
  onAddPrescription: (prescription: any) => void;
}

export default function PrescriptionsTab({
  prescriptionRecords,
  onAddPrescription,
}: PrescriptionsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Prescriptions</h4>
        <Button
          color="primary"
          size="sm"
          startContent={<IoAddOutline />}
          onPress={() => setIsModalOpen(true)}
        >
          Add Prescription
        </Button>
      </div>

      {prescriptionRecords.length === 0 ? (
        <div className="text-center py-12">
          <IoFlaskOutline className="mx-auto text-default-300 text-6xl mb-4" />
          <p className="text-default-500 text-lg mb-2">
            No prescriptions found
          </p>
          <p className="text-default-400 mb-4">
            No prescriptions have been added for this patient yet.
          </p>
        </div>
      ) : (
        prescriptionRecords.map((record) => (
          <Card key={record.id} className="border border-default-200">
            <CardBody className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary-100">
                  <IoFlaskOutline className="text-primary text-xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-lg">{record.title}</h4>
                    <Chip color="primary" size="sm" variant="flat">
                      Prescription
                    </Chip>
                  </div>
                  <p className="text-default-600 mb-3">{record.description}</p>
                  {record.details && (
                    <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-default-50 rounded-lg">
                      <div>
                        <span className="font-medium">Dosage:</span>{" "}
                        {record.details.dosage}
                      </div>
                      <div>
                        <span className="font-medium">Frequency:</span>{" "}
                        {record.details.frequency}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>{" "}
                        {record.details.duration}
                      </div>
                      <div>
                        <span className="font-medium">Instructions:</span>{" "}
                        {record.details.instructions}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-default-500">
                      <p>By: {record.doctorName}</p>
                      <p>Date: {formatDate(record.date)}</p>
                    </div>
                    <Button
                      size="sm"
                      startContent={<IoEyeOutline />}
                      variant="bordered"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))
      )}

      <AddPrescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddPrescription}
      />
    </div>
  );
}
