import React from "react";
import clsx from "clsx";

export interface TableProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  "aria-label"?: string;
}

export const Table: React.FC<TableProps> = ({
  className,
  children,
  "aria-label": ariaLabel,
  ...rest
}) => {
  return (
    <div
      className={clsx(
        "relative w-full overflow-x-auto rounded-lg border border-mountain-100 bg-white",
        className,
      )}
      {...rest}
    >
      <table
        aria-label={ariaLabel}
        className="min-w-full text-left text-sm text-mountain-900"
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ className, ...rest }) => (
  <thead className={clsx("bg-mountain-50", className)} {...rest} />
);

export const TableBody: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement> & {
    emptyContent?: React.ReactNode;
    isLoading?: boolean;
  }
> = ({ className, children, emptyContent, isLoading, ...rest }) => {
  const hasRows = React.Children.count(children) > 0;

  return (
    <tbody className={className} {...rest}>
      {isLoading ? (
        <tr>
          <td
            className="px-4 py-6 text-center text-sm text-mountain-500"
            colSpan={100}
          >
            Loading...
          </td>
        </tr>
      ) : hasRows ? (
        children
      ) : emptyContent ? (
        <tr>
          <td
            className="px-4 py-6 text-center text-sm text-mountain-500"
            colSpan={100}
          >
            {emptyContent}
          </td>
        </tr>
      ) : null}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...rest
}) => (
  <tr
    className={clsx(
      "border-b border-mountain-100 last:border-b-0 hover:bg-mountain-50/60",
      className,
    )}
    {...rest}
  />
);

export const TableColumn: React.FC<
  React.ThHTMLAttributes<HTMLTableCellElement>
> = ({ className, ...rest }) => (
  <th
    className={clsx(
      "px-4 py-2 text-xs font-semibold uppercase tracking-wide text-mountain-600",
      className,
    )}
    {...rest}
  />
);

export const TableCell: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement>
> = ({ className, ...rest }) => (
  <td
    className={clsx(
      "px-4 py-2 align-middle text-sm text-mountain-900",
      className,
    )}
    {...rest}
  />
);
