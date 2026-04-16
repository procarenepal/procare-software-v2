import React from "react";
import clsx from "clsx";

type ChipColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";
type ChipVariant = "solid" | "flat" | "bordered" | "light";
type ChipSize = "sm" | "md" | "lg";

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: ChipColor;
  variant?: ChipVariant;
  size?: ChipSize;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  onClose?: () => void;
  isCloseable?: boolean;
}

const baseChip =
  "inline-flex items-center gap-1 rounded-full text-xs font-medium transition-colors";

const sizeMap: Record<ChipSize, string> = {
  sm: "px-2 py-0.5",
  md: "px-3 py-1",
  lg: "px-4 py-1.5 text-sm",
};

const solidMap: Record<ChipColor, string> = {
  default: "bg-mountain-100 text-mountain-800",
  primary: "bg-nepal-100 text-nepal-800",
  secondary: "bg-health-100 text-health-800",
  success: "bg-health-100 text-health-800",
  warning: "bg-saffron-100 text-saffron-800",
  danger: "bg-red-100 text-red-700",
};

const flatMap: Record<ChipColor, string> = {
  default: "bg-mountain-50 text-mountain-800",
  primary: "bg-nepal-50 text-nepal-700",
  secondary: "bg-health-50 text-health-700",
  success: "bg-health-50 text-health-700",
  warning: "bg-saffron-50 text-saffron-700",
  danger: "bg-red-50 text-red-700",
};

const borderedMap: Record<ChipColor, string> = {
  default: "border border-mountain-200 text-mountain-800",
  primary: "border border-nepal-400 text-nepal-700",
  secondary: "border border-health-400 text-health-700",
  success: "border border-health-400 text-health-700",
  warning: "border border-saffron-400 text-saffron-700",
  danger: "border border-red-400 text-red-700",
};

export const Chip: React.FC<ChipProps> = ({
  color = "default",
  variant = "solid",
  size = "md",
  startContent,
  endContent,
  onClose,
  isCloseable,
  className,
  children,
  ...rest
}) => {
  const colorClasses =
    variant === "solid"
      ? solidMap[color]
      : variant === "flat"
        ? flatMap[color]
        : variant === "bordered"
          ? borderedMap[color]
          : flatMap[color];

  return (
    <div
      className={clsx(baseChip, sizeMap[size], colorClasses, className)}
      {...rest}
    >
      {startContent && (
        <span className="inline-flex items-center">{startContent}</span>
      )}
      <span>{children}</span>
      {endContent && (
        <span className="inline-flex items-center">{endContent}</span>
      )}
      {(isCloseable || onClose) && (
        <button
          className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full text-[10px] text-mountain-600 hover:bg-mountain-200"
          type="button"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
};
