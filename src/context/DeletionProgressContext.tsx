import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { addToast } from "@heroui/toast";

interface DeletionProgressState {
  isDeleting: boolean;
  clinicName: string;
  progress: string;
  deletedCounts?: Record<string, number>;
  startTime?: Date;
}

interface DeletionProgressContextType {
  deletionState: DeletionProgressState;
  startDeletion: (clinicName: string) => void;
  updateProgress: (progress: string) => void;
  setDeletionResults: (results: Record<string, number>) => void;
  completeDeletion: () => void;
  cancelDeletion: () => void;
}

const initialState: DeletionProgressState = {
  isDeleting: false,
  clinicName: "",
  progress: "",
  deletedCounts: undefined,
  startTime: undefined,
};

const DeletionProgressContext = createContext<
  DeletionProgressContextType | undefined
>(undefined);

export function DeletionProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [deletionState, setDeletionState] =
    useState<DeletionProgressState>(initialState);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateToastContent = useCallback(
    (title: string, description: string) => {
      // Since we can't dismiss/update the toast, we'll just create a new one
      // The toast system should handle duplicate/similar toasts appropriately
      addToast({
        title,
        description,
      });
    },
    [],
  );

  const startDeletion = useCallback(
    (clinicName: string) => {
      // Clear any existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Create initial persistent toast
      updateToastContent(
        `🗑️ Deleting "${clinicName}"`,
        "⚠️ Starting comprehensive clinic deletion... DO NOT close this browser tab!",
      );

      setDeletionState({
        isDeleting: true,
        clinicName,
        progress: "Starting clinic deletion...",
        deletedCounts: undefined,
        startTime: new Date(),
      });
    },
    [updateToastContent],
  );

  const updateProgress = useCallback(
    (progress: string) => {
      setDeletionState((prev) => {
        if (prev.isDeleting) {
          // Update the single persistent toast with new progress
          updateToastContent(
            `🔄 Deleting "${prev.clinicName}"`,
            `${progress} - ⚠️ Do not close this tab!`,
          );

          return {
            ...prev,
            progress,
          };
        }

        return prev;
      });
    },
    [updateToastContent],
  );

  const setDeletionResults = useCallback((results: Record<string, number>) => {
    setDeletionState((prev) => ({
      ...prev,
      deletedCounts: results,
    }));
  }, []);

  const completeDeletion = useCallback(() => {
    // Clear the progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setDeletionState((prev) => {
      const totalDeleted = prev.deletedCounts
        ? Object.values(prev.deletedCounts).reduce(
            (sum, count) => sum + count,
            0,
          )
        : 0;

      const duration = prev.startTime
        ? Math.round((new Date().getTime() - prev.startTime.getTime()) / 1000)
        : 0;

      // Update toast to show final success
      updateToastContent(
        "✅ Clinic Deleted Successfully",
        `"${prev.clinicName}" and all related data (${totalDeleted} records) have been permanently deleted in ${duration} seconds.`,
      );

      return initialState;
    });
  }, [updateToastContent]);

  const cancelDeletion = useCallback(() => {
    // Clear the progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setDeletionState((prev) => {
      // Update toast to show error/cancellation
      updateToastContent(
        "❌ Deletion Failed",
        `Deletion of "${prev.clinicName}" was cancelled or failed.`,
      );

      return initialState;
    });
  }, [updateToastContent]);

  const contextValue: DeletionProgressContextType = {
    deletionState,
    startDeletion,
    updateProgress,
    setDeletionResults,
    completeDeletion,
    cancelDeletion,
  };

  return (
    <DeletionProgressContext.Provider value={contextValue}>
      {children}
    </DeletionProgressContext.Provider>
  );
}

export function useDeletionProgress() {
  const context = useContext(DeletionProgressContext);

  if (context === undefined) {
    throw new Error(
      "useDeletionProgress must be used within a DeletionProgressProvider",
    );
  }

  return context;
}
