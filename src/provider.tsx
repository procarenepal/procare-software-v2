import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { DeletionProgressProvider } from "./context/DeletionProgressContext";
import { ThemeProvider } from "./context/ThemeContext";
// Custom toast — replaces HeroUI ToastProvider
import { ToastProvider } from "./components/ui/toast";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function BaseProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <ThemeProvider>
      {/* HeroUIProvider is still needed for any remaining HeroUI components (Select, Modal, etc.)
          but theming is now handled entirely by our custom CSS variables + ThemeContext.
          ToastProvider is our custom implementation — no longer HeroUI's. */}
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        <ToastProvider>{children}</ToastProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DeletionProgressProvider>{children}</DeletionProgressProvider>
    </AuthProvider>
  );
}

// Backward compatibility: full Provider including auth
export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <ThemeProvider>
      <AuthProvider>
        <DeletionProgressProvider>
          <HeroUIProvider navigate={navigate} useHref={useHref}>
            <ToastProvider>{children}</ToastProvider>
          </HeroUIProvider>
        </DeletionProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
