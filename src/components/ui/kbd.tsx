import React from "react";
import clsx from "clsx";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export const Kbd: React.FC<KbdProps> = ({ className, children, ...rest }) => {
  return (
    <kbd
      className={clsx(
        "inline-flex items-center justify-center rounded border border-mountain-300 bg-mountain-50 px-1.5 py-0.5 text-[11px] font-mono text-mountain-700",
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
};
