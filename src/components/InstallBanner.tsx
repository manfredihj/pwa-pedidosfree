"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import GetAppIcon from "@mui/icons-material/GetApp";
import CloseIcon from "@mui/icons-material/Close";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useState } from "react";

interface InstallBannerProps {
  slug: string;
}

export default function InstallBanner({ slug }: InstallBannerProps) {
  const { canInstall, isIOS, isInstalled, installApp } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`pf_install_dismissed_${slug}`) === "true";
  });

  if (isInstalled || dismissed) return null;

  // iOS: show manual instructions
  if (isIOS) {
    return (
      <Box
        sx={{
          position: "fixed",
          bottom: 76,
          left: 12,
          right: 12,
          zIndex: 1049,
          bgcolor: "primary.main",
          color: "white",
          borderRadius: 3,
          p: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        }}
      >
        <GetAppIcon />
        <Typography variant="body2" sx={{ flex: 1, fontSize: "0.8rem" }}>
          Instalá la app: tocá Compartir y luego &quot;Agregar a pantalla de inicio&quot;
        </Typography>
        <IconButton size="small" sx={{ color: "white" }} onClick={() => {
          setDismissed(true);
          localStorage.setItem(`pf_install_dismissed_${slug}`, "true");
        }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  // Android/Desktop: show install button
  if (!canInstall) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 76,
        left: 12,
        right: 12,
        zIndex: 1049,
        bgcolor: "primary.main",
        color: "white",
        borderRadius: 3,
        p: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1,
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
      }}
    >
      <GetAppIcon />
      <Typography variant="body2" sx={{ flex: 1, fontSize: "0.8rem", fontWeight: 600 }}>
        Instalá la app para una mejor experiencia
      </Typography>
      <Button
        size="small"
        variant="contained"
        color="secondary"
        sx={{ borderRadius: 4, textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
        onClick={installApp}
      >
        Instalar
      </Button>
      <IconButton size="small" sx={{ color: "white" }} onClick={() => {
        setDismissed(true);
        localStorage.setItem(`pf_install_dismissed_${slug}`, "true");
      }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
