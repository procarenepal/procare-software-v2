import React from "react";
import clsx from "clsx";

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {}

export const Code: React.FC<CodeProps> = ({ className, children, ...rest }) => {
  return (
    <code
      className={clsx(
        "rounded bg-mountain-100 px-1.5 py-0.5 font-mono text-xs text-mountain-800",
        className,
      )}
      {...rest}
    >
      {children}
    </code>
  );
};
