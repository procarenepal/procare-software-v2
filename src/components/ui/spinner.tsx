import React from "react";
import clsx from "clsx";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "xs" | "sm" | "md" | "lg";
  color?: "primary" | "default" | "danger" | "success" | "warning";
  label?: string;
}

const TRACK_SIZE: Record<NonNullable<SpinnerProps["size"]>, string> = {
  xs: "w-3   h-3   border-[1.5px]",
  sm: "w-4   h-4   border-2",
  md: "w-5   h-5   border-2",
  lg: "w-7   h-7   border-[3px]",
};

const TRACK_COLOR: Record<NonNullable<SpinnerProps["color"]>, string> = {
  primary: "border-teal-200   border-t-teal-700",
  default: "border-mountain-200 border-t-mountain-600",
  danger: "border-red-200    border-t-red-600",
  success: "border-health-200 border-t-health-600",
  warning: "border-saffron-200 border-t-saffron-600",
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "primary",
  label,
  className,
  ...rest
}) => (
  <span
    aria-label={label ?? "Loading"}
    className={clsx("inline-flex items-center gap-2", className)}
    role="status"
    {...rest}
  >
    <span
      className={clsx(
        "inline-block rounded-full animate-spin",
        TRACK_SIZE[size],
        TRACK_COLOR[color],
      )}
    />
    {label && <span className="text-[11px] text-mountain-500">{label}</span>}
  </span>
);
