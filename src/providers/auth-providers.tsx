import React from "react";

import { AuthProvider } from "@/context/AuthContext";
import { DeletionProgressProvider } from "@/context/DeletionProgressContext";

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DeletionProgressProvider>{children}</DeletionProgressProvider>
    </AuthProvider>
  );
}

export default AuthProviders;
