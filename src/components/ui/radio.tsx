import React from "react";
import clsx from "clsx";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value: string;
  children?: React.ReactNode;
}

export const Radio: React.FC<RadioProps> = ({
  value,
  children,
  className,
  disabled,
  ...rest
}) => {
  return (
    <label
      className={clsx(
        "inline-flex items-center gap-2 text-sm text-mountain-800",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-mountain-400 bg-white">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-nepal-500 opacity-0 peer-checked:opacity-100 transition-opacity" />
        <input
          {...rest}
          className="peer sr-only"
          disabled={disabled}
          type="radio"
          value={value}
        />
      </span>
      {children && <span>{children}</span>}
    </label>
  );
};

export interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  name?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  name,
}) => {
  const [internal, setInternal] = React.useState<string | undefined>(
    defaultValue,
  );
  const isControlled = typeof value === "string";
  const current = isControlled ? (value as string) : internal;

  const setValue = (val: string) => {
    if (!isControlled) {
      setInternal(val);
    }
    onValueChange?.(val);
  };

  const items = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const val = (child.props as any).value as string | undefined;

    if (!val) return child;

    return React.cloneElement(child as React.ReactElement<any>, {
      name,
      checked: current === val,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(val);
        if (typeof (child.props as any).onChange === "function") {
          (child.props as any).onChange(e);
        }
      },
    });
  });

  return <div className={clsx("flex flex-col gap-2", className)}>{items}</div>;
};
