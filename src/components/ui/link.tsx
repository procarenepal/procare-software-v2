import React from "react";
import clsx from "clsx";
import {
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
} from "react-router-dom";

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  color?: "default" | "primary" | "secondary";
  isExternal?: boolean;
  as?: React.ElementType;
}

export const Link: React.FC<LinkProps & Partial<RouterLinkProps>> = ({
  href,
  color = "primary",
  isExternal,
  as,
  className,
  children,
  to,
  ...rest
}) => {
  const colorClasses =
    color === "primary"
      ? "text-nepal-600 hover:text-nepal-700"
      : color === "secondary"
        ? "text-health-600 hover:text-health-700"
        : "text-mountain-700 hover:text-mountain-900";

  const Component: any = as ?? (to ? RouterLink : "a");

  const linkProps: any = {
    className: clsx(
      "inline-flex items-center gap-1 underline-offset-2 hover:underline",
      colorClasses,
      className,
    ),
    ...rest,
  };

  if (to) {
    linkProps.to = to;
  } else if (href) {
    linkProps.href = href;
  }

  if (isExternal && !to) {
    linkProps.target = "_blank";
    linkProps.rel = "noreferrer";
  }

  return <Component {...linkProps}>{children}</Component>;
};
