import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { IoCheckmarkCircleOutline } from "react-icons/io5";

import { useDeletionProgress } from "@/context/DeletionProgressContext";

export function DeletionProgressIndicator() {
  const { deletionState } = useDeletionProgress();

  if (!deletionState.isDeleting) {
    return null;
  }

  const timeElapsed = deletionState.startTime
    ? Math.round(
        (new Date().getTime() - deletionState.startTime.getTime()) / 1000,
      )
    : 0;

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-lg">
      <CardBody className="py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-primary">
                🗑️ Deleting "{deletionState.clinicName}"
              </p>
              <span className="text-xs text-primary/70">{timeElapsed}s</span>
            </div>
            <p className="text-xs text-primary/80 mb-1">
              {deletionState.progress}
            </p>
            <p className="text-xs font-medium text-warning">
              ⚠️ Do not close this browser tab during deletion!
            </p>
            <Progress
              isIndeterminate
              className="w-full"
              classNames={{
                base: "max-w-md",
                track: "drop-shadow-md border border-default",
                indicator: "bg-gradient-to-r from-pink-500 to-yellow-500",
                label: "tracking-wider font-medium text-default-600",
                value: "text-foreground/60",
              }}
              color="primary"
              size="sm"
            />
          </div>
        </div>

        {deletionState.deletedCounts && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <IoCheckmarkCircleOutline className="w-4 h-4 text-success" />
              <span className="text-xs font-medium text-success">
                Deletion Summary
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.entries(deletionState.deletedCounts)
                .slice(0, 6)
                .map(([key, count]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-primary/70 capitalize truncate">
                      {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:
                    </span>
                    <span className="font-medium text-primary">{count}</span>
                  </div>
                ))}
            </div>
            {Object.keys(deletionState.deletedCounts).length > 6 && (
              <p className="text-xs text-primary/60 mt-1">
                +{Object.keys(deletionState.deletedCounts).length - 6} more
                categories...
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
