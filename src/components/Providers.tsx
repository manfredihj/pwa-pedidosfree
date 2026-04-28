"use client";

import { useMemo, type ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";
import { createAppTheme } from "@/lib/theme";

interface ProvidersProps {
  children: ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function Providers({ children, primaryColor, secondaryColor }: ProvidersProps) {
  const theme = useMemo(
    () => createAppTheme(primaryColor, secondaryColor),
    [primaryColor, secondaryColor],
  );

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
