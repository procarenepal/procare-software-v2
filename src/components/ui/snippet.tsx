import React from "react";
import clsx from "clsx";

export interface SnippetProps extends React.HTMLAttributes<HTMLDivElement> {
  symbol?: string;
}

export const Snippet: React.FC<SnippetProps> = ({
  symbol = ">",
  className,
  children,
  ...rest
}) => {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-md bg-mountain-900 text-mountain-100 px-3 py-2 font-mono text-xs",
        className,
      )}
      {...rest}
    >
      <span className="text-nepal-400 select-none">{symbol}</span>
      <span className="break-all">{children}</span>
    </div>
  );
};
