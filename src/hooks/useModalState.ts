import { useState, useCallback, useRef } from "react";

interface UseModalStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  forceClose: () => void;
  preventClose: (duration?: number) => void;
  handleDropdownInteraction: () => void;
}

export const useModalState = (
  initialState: boolean = false,
): UseModalStateReturn => {
  const [isOpen, setIsOpen] = useState(initialState);
  const preventCloseRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    preventCloseRef.current = false;
  }, []);

  const close = useCallback(() => {
    if (preventCloseRef.current) {
      return;
    }
    setIsOpen(false);
  }, []);

  const forceClose = useCallback(() => {
    preventCloseRef.current = false;
    setIsOpen(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const preventClose = useCallback((duration: number = 300) => {
    preventCloseRef.current = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      preventCloseRef.current = false;
      timeoutRef.current = null;
    }, duration);
  }, []);

  const handleDropdownInteraction = useCallback(() => {
    preventClose(500); // Prevent modal close for 500ms during dropdown interaction
  }, [preventClose]);

  return {
    isOpen,
    open,
    close,
    forceClose,
    preventClose,
    handleDropdownInteraction,
  };
};
