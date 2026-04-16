import React from "react";
import clsx from "clsx";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  className,
  ...rest
}) => (
  <div
    aria-orientation={orientation}
    className={clsx(
      orientation === "horizontal"
        ? "w-full h-px bg-mountain-200 dark:bg-zinc-800 my-1"
        : "h-full w-px bg-mountain-200 dark:bg-zinc-800 mx-1",
      className,
    )}
    role="separator"
    {...rest}
  />
);
