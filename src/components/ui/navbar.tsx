import React, { createContext, useContext, useState, useMemo } from "react";
import clsx from "clsx";

interface NavbarContextValue {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const NavbarContext = createContext<NavbarContextValue | null>(null);

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  position?: "static" | "sticky" | "fixed";
  height?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  className,
  children,
  maxWidth = "xl",
  position = "static",
  height,
  ...rest
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const ctx = useMemo(
    () => ({
      isMenuOpen,
      toggleMenu: () => setIsMenuOpen((v) => !v),
    }),
    [isMenuOpen],
  );

  const containerMaxWidth =
    maxWidth === "full"
      ? "max-w-full"
      : maxWidth === "2xl"
        ? "max-w-6xl"
        : "max-w-5xl";

  const positionClass =
    position === "sticky"
      ? "sticky top-0 z-40"
      : position === "fixed"
        ? "fixed top-0 z-40"
        : "";

  return (
    <NavbarContext.Provider value={ctx}>
      <nav
        className={clsx(
          "w-full border-b border-mountain-200 bg-white/95 backdrop-blur-md",
          positionClass,
          className,
        )}
        style={height ? { height } : undefined}
        {...rest}
      >
        <div
          className={clsx(
            "mx-auto flex h-full items-center justify-between gap-4 px-4",
            containerMaxWidth,
          )}
        >
          {children}
        </div>
      </nav>
    </NavbarContext.Provider>
  );
};

export interface NavbarSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  justify?: "start" | "center" | "end";
}

export const NavbarContent: React.FC<NavbarSectionProps> = ({
  className,
  justify = "start",
  ...rest
}) => {
  const justifyClass =
    justify === "center"
      ? "justify-center"
      : justify === "end"
        ? "justify-end"
        : "justify-start";

  return (
    <div
      className={clsx("flex items-center gap-4", justifyClass, className)}
      {...rest}
    />
  );
};

export const NavbarBrand: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => <div className={clsx("flex items-center gap-2", className)} {...rest} />;

export const NavbarItem: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => <div className={clsx("flex items-center", className)} {...rest} />;

export interface NavbarMenuToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const NavbarMenuToggle: React.FC<NavbarMenuToggleProps> = ({
  className,
  ...rest
}) => {
  const ctx = useContext(NavbarContext);

  if (!ctx) return null;

  return (
    <button
      aria-label="Toggle navigation menu"
      className={clsx(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-mountain-700 hover:bg-mountain-100 sm:hidden",
        className,
      )}
      type="button"
      onClick={ctx.toggleMenu}
      {...rest}
    >
      <span className="block h-0.5 w-4 bg-current" />
      <span className="mt-0.5 block h-0.5 w-4 bg-current" />
      <span className="mt-0.5 block h-0.5 w-3 bg-current" />
    </button>
  );
};

export interface NavbarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

export const NavbarMenu: React.FC<NavbarMenuProps> = ({
  className,
  ...rest
}) => {
  const ctx = useContext(NavbarContext);

  if (!ctx) return null;

  return (
    <div
      className={clsx(
        "sm:hidden w-full border-t border-mountain-200 bg-white/95 backdrop-blur-md",
        !ctx.isMenuOpen && "hidden",
        className,
      )}
      {...rest}
    />
  );
};

export const NavbarMenuItem: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    className={clsx("flex items-center justify-start", className)}
    {...rest}
  />
);
