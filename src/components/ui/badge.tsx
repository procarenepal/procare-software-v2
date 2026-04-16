import React from "react";
import clsx from "clsx";

type BadgeColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";
type BadgeVariant = "solid" | "flat" | "bordered";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  variant?: BadgeVariant;
}

const baseBadge =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

const solidMap: Record<BadgeColor, string> = {
  default: "bg-mountain-100 text-mountain-800",
  primary: "bg-nepal-100 text-nepal-800",
  secondary: "bg-health-100 text-health-800",
  success: "bg-health-100 text-health-800",
  warning: "bg-saffron-100 text-saffron-800",
  danger: "bg-red-100 text-red-700",
};

const flatMap: Record<BadgeColor, string> = {
  default: "bg-mountain-50 text-mountain-800",
  primary: "bg-nepal-50 text-nepal-700",
  secondary: "bg-health-50 text-health-700",
  success: "bg-health-50 text-health-700",
  warning: "bg-saffron-50 text-saffron-700",
  danger: "bg-red-50 text-red-700",
};

const borderedMap: Record<BadgeColor, string> = {
  default: "border border-mountain-200 text-mountain-800",
  primary: "border border-nepal-400 text-nepal-700",
  secondary: "border border-health-400 text-health-700",
  success: "border border-health-400 text-health-700",
  warning: "border border-saffron-400 text-saffron-700",
  danger: "border border-red-400 text-red-700",
};

export const Badge: React.FC<BadgeProps> = ({
  color = "default",
  variant = "solid",
  className,
  children,
  ...rest
}) => {
  const colorClasses =
    variant === "solid"
      ? solidMap[color]
      : variant === "flat"
        ? flatMap[color]
        : borderedMap[color];

  return (
    <span className={clsx(baseBadge, colorClasses, className)} {...rest}>
      {children}
    </span>
  );
};
