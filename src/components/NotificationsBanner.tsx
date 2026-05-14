"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import { useNotifications } from "@/components/FirebaseMessaging";

export default function NotificationsBanner() {
  const { enabled, toggle, loading } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || enabled || dismissed) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
        px: 2,
        py: 1.5,
        bgcolor: "error.main",
        color: "white",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <NotificationsActiveIcon />
      <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, fontSize: "0.8rem" }}>
        Activá las notificaciones para recibir ofertas y el estado de tus pedidos
      </Typography>
      <Button
        size="small"
        variant="contained"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        onClick={toggle}
        sx={{
          bgcolor: "white",
          color: "error.main",
          borderRadius: 4,
          textTransform: "none",
          fontWeight: 700,
          whiteSpace: "nowrap",
          "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
        }}
      >
        Activar
      </Button>
      <IconButton size="small" sx={{ color: "white", p: 0.3 }} onClick={() => setDismissed(true)}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
