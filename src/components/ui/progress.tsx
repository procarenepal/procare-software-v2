import React from "react";
import clsx from "clsx";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
}

const colorMap: Record<NonNullable<ProgressProps["color"]>, string> = {
  primary: "bg-nepal-500",
  secondary: "bg-health-500",
  success: "bg-health-500",
  warning: "bg-saffron-500",
  danger: "bg-red-500",
};

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  color = "primary",
  className,
  ...rest
}) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      className={clsx(
        "w-full h-2 rounded-full bg-mountain-100 overflow-hidden",
        className,
      )}
      {...rest}
    >
      <div
        className={clsx("h-full rounded-full transition-all", colorMap[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};
