"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import GetAppIcon from "@mui/icons-material/GetApp";
import OpenInBrowserIcon from "@mui/icons-material/OpenInBrowser";
import CloseIcon from "@mui/icons-material/Close";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useState } from "react";

interface InstallBannerProps {
  slug: string;
}

export default function InstallBanner({ slug }: InstallBannerProps) {
  const { canInstall, isIOS, isInstalled, isInAppBrowser, installApp } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`pf_install_dismissed_${slug}`) === "true";
  });

  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`pf_install_dismissed_${slug}`, "true");
  };

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
          p: 2,
          boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
        }}
      >
        <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, color: "rgba(255,255,255,0.7)" }} onClick={handleDismiss}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <GetAppIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              Instalá la app
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Tocá Compartir y luego &quot;Agregar a pantalla de inicio&quot;
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // In-app browser (Instagram, Facebook, etc.): show open in browser message
  if (isInAppBrowser && !canInstall) {
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
          p: 2,
          boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
        }}
      >
        <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, color: "rgba(255,255,255,0.7)" }} onClick={handleDismiss}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <OpenInBrowserIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              Instalá la app
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Tocá los tres puntos (⋮) y elegí &quot;Abrir en navegador&quot; para poder instalar
            </Typography>
          </Box>
        </Box>
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
        p: 2,
        boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
      }}
    >
      <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4, color: "rgba(255,255,255,0.7)" }} onClick={handleDismiss}>
        <CloseIcon fontSize="small" />
      </IconButton>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <GetAppIcon sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            Instalá la app
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Accedé más rápido y recibí notificaciones
          </Typography>
        </Box>
      </Box>
      <Button
        fullWidth
        variant="contained"
        color="secondary"
        size="large"
        onClick={installApp}
        sx={{ borderRadius: 6, fontWeight: 700, py: 1.2, textTransform: "none", fontSize: "1rem" }}
      >
        Instalar ahora
      </Button>
    </Box>
  );
}
