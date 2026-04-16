import React from "react";
import clsx from "clsx";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  radius?: "none" | "sm" | "md" | "lg" | "full";
}

const radiusMap: Record<NonNullable<ImageProps["radius"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export const Image: React.FC<ImageProps> = ({
  radius = "md",
  className,
  ...rest
}) => {
  return (
    <img
      {...rest}
      className={clsx("object-cover", radiusMap[radius], className)}
    />
  );
};
