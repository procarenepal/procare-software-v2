/**
 * Clinic Clarity — Custom Dropdown
 * Fully custom, zero HeroUI dependency.
 * Flat design: border-only, no shadow, compact.
 */
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

// ── Placement ─────────────────────────────────────────────────────────────────
type Placement =
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "top"
  | "top-start"
  | "top-end";

// ── Context ───────────────────────────────────────────────────────────────────
interface DropdownCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  placement: Placement;
}

const Ctx = createContext<DropdownCtx>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  menuRef: { current: null },
  placement: "bottom-end",
});

// ── Dropdown (root) ───────────────────────────────────────────────────────────
export interface DropdownProps {
  children: ReactNode;
  placement?: Placement;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  children,
  placement = "bottom-end",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const isOutsideTrigger =
        triggerRef.current && !triggerRef.current.contains(e.target as Node);
      const isOutsideMenu =
        menuRef.current && !menuRef.current.contains(e.target as Node);

      if (isOutsideTrigger && isOutsideMenu) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <Ctx.Provider value={{ open, setOpen, triggerRef, menuRef, placement }}>
      <div className={clsx("relative inline-flex", className)}>{children}</div>
    </Ctx.Provider>
  );
};

// ── DropdownTrigger ───────────────────────────────────────────────────────────
export interface DropdownTriggerProps {
  children: ReactNode;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  children,
}) => {
  const { open, setOpen, triggerRef } = useContext(Ctx);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  return (
    <div
      ref={triggerRef}
      aria-expanded={open}
      aria-haspopup="menu"
      className="inline-flex cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(!open);
        }
      }}
    >
      {children}
    </div>
  );
};

// ── DropdownMenu ──────────────────────────────────────────────────────────────
export interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
  /** aria-label for accessibility */
  "aria-label"?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  className,
  "aria-label": ariaLabel,
}) => {
  const { open, setOpen, triggerRef, menuRef, placement } = useContext(Ctx);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;
    const gap = 4; // spacing

    switch (placement) {
      case "bottom-start":
        top = triggerRect.bottom + gap;
        left = triggerRect.left;
        break;
      case "bottom-end":
        top = triggerRect.bottom + gap;
        left = triggerRect.right - menuRect.width;
        break;
      case "bottom":
        top = triggerRect.bottom + gap;
        left = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
        break;
      case "top-start":
        top = triggerRect.top - menuRect.height - gap;
        left = triggerRect.left;
        break;
      case "top-end":
        top = triggerRect.top - menuRect.height - gap;
        left = triggerRect.right - menuRect.width;
        break;
      case "top":
        top = triggerRect.top - menuRect.height - gap;
        left = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
        break;
    }

    setCoords({ top, left });
  }, [placement]);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    } else {
      setCoords(null);
    }
  }, [open, updatePosition, children]);

  useEffect(() => {
    if (!open) return;
    const handleScrollOrResize = () => updatePosition();

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, updatePosition]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      aria-label={ariaLabel}
      className={clsx(
        "z-[9999] min-w-[160px]",
        "bg-white border border-mountain-200 rounded shadow-lg",
        "py-1 overflow-hidden",
        "animate-in fade-in-0 zoom-in-95 duration-100",
        className,
      )}
      role="menu"
      style={{
        position: "fixed",
        top: coords ? coords.top : -9999,
        left: coords ? coords.left : -9999,
        opacity: coords ? 1 : 0,
      }}
      onClick={() => setOpen(false)}
    >
      {children}
    </div>,
    document.body,
  );
};

// ── DropdownItem ──────────────────────────────────────────────────────────────
export interface DropdownItemProps {
  children: ReactNode;
  key?: string;
  color?: "default" | "danger" | "primary" | "warning";
  className?: string;
  startContent?: ReactNode;
  endContent?: ReactNode;
  isDisabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPress?: () => void;
  href?: string;
  description?: string;
}

const ITEM_COLOR: Record<NonNullable<DropdownItemProps["color"]>, string> = {
  default: "text-mountain-800 hover:bg-mountain-50",
  primary: "text-teal-700 hover:bg-teal-50",
  danger: "text-red-600 hover:bg-red-50",
  warning: "text-saffron-700 hover:bg-saffron-50",
};

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  color = "default",
  className,
  startContent,
  endContent,
  isDisabled,
  onClick,
  onPress,
  href,
  description,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) return;
    onClick?.(e);
    if (!e.defaultPrevented) onPress?.();
  };

  const commonClass = clsx(
    "w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium",
    "transition-colors duration-75 cursor-pointer select-none",
    "focus:outline-none focus:bg-mountain-50",
    ITEM_COLOR[color],
    isDisabled && "opacity-40 cursor-not-allowed pointer-events-none",
    className,
  );

  const content = (
    <>
      {startContent && (
        <span className="shrink-0 text-current opacity-70">{startContent}</span>
      )}
      <span className="flex-1">
        {children}
        {description && (
          <span className="block text-[10px] text-mountain-400 mt-0.5 font-normal">
            {description}
          </span>
        )}
      </span>
      {endContent && (
        <span className="shrink-0 text-mountain-400">{endContent}</span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        className={commonClass}
        href={href}
        role="menuitem"
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={commonClass}
      disabled={isDisabled}
      role="menuitem"
      tabIndex={0}
      type="button"
      onClick={handleClick}
    >
      {content}
    </button>
  );
};

// ── DropdownSection ───────────────────────────────────────────────────────────
export interface DropdownSectionProps {
  children: ReactNode;
  title?: string;
  className?: string;
  showDivider?: boolean;
}

export const DropdownSection: React.FC<DropdownSectionProps> = ({
  children,
  title,
  className,
  showDivider,
}) => (
  <div
    className={clsx(
      "py-1",
      showDivider && "border-b border-mountain-100",
      className,
    )}
  >
    {title && (
      <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-mountain-400">
        {title}
      </div>
    )}
    {children}
  </div>
);
