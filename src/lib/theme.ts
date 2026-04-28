"use client";

import { createTheme, type Theme } from "@mui/material/styles";

export function createAppTheme(primaryColor = "#d32f2f", secondaryColor = "#ff6659"): Theme {
  return createTheme({
    palette: {
      primary: {
        main: primaryColor,
      },
      secondary: {
        main: secondaryColor,
      },
      background: {
        default: "#fafafa",
      },
    },
    typography: {
      fontFamily: "var(--font-geist-sans), Roboto, Arial, sans-serif",
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
          },
        },
      },
    },
  });
}

const theme = createAppTheme();
export default theme;
