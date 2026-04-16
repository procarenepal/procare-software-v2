import { FC, useState, useEffect } from "react";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";
import { useTheme } from "@/context/ThemeContext";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { setTheme, isDark } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="w-8 h-8" />;

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={clsx(
        "w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200",
        "bg-mountain-50 dark:bg-mountain-900/40 border border-mountain-200 dark:border-mountain-800",
        "text-mountain-500 dark:text-mountain-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-700",
        className,
      )}
      type="button"
      onClick={handleToggle}
    >
      {isDark ? (
        <MoonFilledIcon
          className="transition-transform duration-300 rotate-0"
          size={18}
        />
      ) : (
        <SunFilledIcon
          className="transition-transform duration-300 rotate-0"
          size={18}
        />
      )}
    </button>
  );
};
