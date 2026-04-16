import { FC } from "react";
import { Button } from "@heroui/button";
import clsx from "clsx";
import { IoCheckmarkOutline, IoSparklesOutline } from "react-icons/io5";

import { useTheme, ThemeVariant } from "@/context/ThemeContext";

interface ThemeSelectorProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

export const ThemeSelector: FC<ThemeSelectorProps> = ({
  className,
  size = "md",
  showLabels = true,
}) => {
  const { currentTheme, themes, setTheme } = useTheme();

  const previewW = size === "sm" ? "w-14" : size === "lg" ? "w-28" : "w-20";
  const previewH = size === "sm" ? "h-10" : size === "lg" ? "h-20" : "h-14";

  // Theme ordering: new themes first, then legacy
  const orderedThemeIds: ThemeVariant[] = [
    "light",
    "dark",
    "rose-clinic",
    "violet-clinical",
    "carbon-dark",
    "arctic",
    "medical",
    "nature",
    "ocean",
    "sunset",
  ];

  return (
    <div className={clsx("space-y-3", className)}>
      {showLabels && (
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Interface Theme
          </h3>
          <p className="text-xs text-foreground-500 mt-0.5">
            All themes use the flat Clinic Clarity design language
          </p>
        </div>
      )}

      {/* New themes section */}
      <div>
        {showLabels && (
          <div className="flex items-center gap-1.5 mb-2">
            <IoSparklesOutline className="w-3 h-3 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-400">
              Clinic Clarity
            </span>
          </div>
        )}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {orderedThemeIds
            .filter((id) => themes[id]?.isNew)
            .map((themeId) => {
              const theme = themes[themeId];

              if (!theme) return null;
              const isActive = currentTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  className={clsx(
                    "relative group flex flex-col items-center gap-1.5 p-1 rounded transition-all duration-100",
                    isActive
                      ? "ring-1 ring-primary ring-offset-1"
                      : "hover:bg-content2",
                  )}
                  onClick={() => setTheme(theme.id as ThemeVariant)}
                >
                  {/* Theme color preview — flat, no shadow */}
                  <div
                    className={clsx(
                      "relative overflow-hidden border",
                      previewW,
                      previewH,
                      "rounded",
                      isActive ? "border-primary" : "border-divider",
                    )}
                  >
                    {/* Background */}
                    <div
                      className={clsx(
                        "absolute inset-0",
                        theme.preview.background,
                      )}
                    />
                    {/* Mini sidebar strip */}
                    <div
                      className={clsx(
                        "absolute inset-y-0 left-0 w-1/4",
                        theme.preview.primary,
                      )}
                    />
                    {/* Card area */}
                    <div
                      className={clsx(
                        "absolute right-1 top-1 bottom-1 left-[30%] rounded-sm",
                        theme.preview.card,
                      )}
                    />
                    {/* Selected checkmark */}
                    {isActive && (
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <IoCheckmarkOutline className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  {showLabels && (
                    <div className="text-center w-full">
                      <p
                        className={clsx(
                          "text-xs font-medium leading-tight truncate",
                          isActive ? "text-primary" : "text-foreground",
                        )}
                      >
                        {theme.name}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Legacy themes section */}
      {showLabels && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-400">
              Classic
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {orderedThemeIds
              .filter((id) => !themes[id]?.isNew)
              .map((themeId) => {
                const theme = themes[themeId];

                if (!theme) return null;
                const isActive = currentTheme === theme.id;

                return (
                  <button
                    key={theme.id}
                    className={clsx(
                      "relative group flex flex-col items-center gap-1 p-1 rounded transition-all duration-100",
                      isActive
                        ? "ring-1 ring-primary ring-offset-1"
                        : "hover:bg-content2",
                    )}
                    onClick={() => setTheme(theme.id as ThemeVariant)}
                  >
                    <div
                      className={clsx(
                        "relative overflow-hidden border w-14 h-9 rounded",
                        isActive ? "border-primary" : "border-divider",
                      )}
                    >
                      <div
                        className={clsx(
                          "absolute inset-0",
                          theme.preview.background,
                        )}
                      />
                      <div
                        className={clsx(
                          "absolute inset-y-0 left-0 w-1/4",
                          theme.preview.primary,
                        )}
                      />
                      <div
                        className={clsx(
                          "absolute right-1 top-1 bottom-1 left-[30%] rounded-sm",
                          theme.preview.card,
                        )}
                      />
                      {isActive && (
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center">
                          <IoCheckmarkOutline className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <p
                      className={clsx(
                        "text-xs leading-tight truncate w-full text-center",
                        isActive
                          ? "text-primary font-medium"
                          : "text-foreground-500",
                      )}
                    >
                      {theme.name}
                    </p>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Active theme info strip */}
      {showLabels && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-content2 border border-divider rounded text-xs">
          <div
            className={clsx(
              "w-2.5 h-2.5 rounded-full flex-shrink-0",
              themes[currentTheme]?.preview.primary,
            )}
          />
          <span className="font-medium text-foreground">
            {themes[currentTheme]?.name}
          </span>
          <span className="text-foreground-400">—</span>
          <span className="text-foreground-500 truncate">
            {themes[currentTheme]?.description}
          </span>
        </div>
      )}
    </div>
  );
};

// ── Compact header/navbar version ─────────────────────────────────────────────
export const CompactThemeSelector: FC = () => {
  const { currentTheme, themes, setTheme } = useTheme();

  const themeIds: ThemeVariant[] = [
    "light",
    "dark",
    "rose-clinic",
    "violet-clinical",
    "carbon-dark",
    "arctic",
  ];

  return (
    <div className="flex items-center gap-1">
      {themeIds.map((id) => {
        const theme = themes[id];

        if (!theme) return null;
        const isActive = currentTheme === id;

        return (
          <Button
            key={id}
            isIconOnly
            className="w-7 h-7 min-w-7 p-0"
            color={isActive ? "primary" : "default"}
            size="sm"
            title={theme.name}
            variant={isActive ? "solid" : "light"}
            onPress={() => setTheme(id as ThemeVariant)}
          >
            <div
              className={clsx(
                "w-3.5 h-3.5 rounded-full",
                theme.preview.primary,
              )}
            />
          </Button>
        );
      })}
    </div>
  );
};
