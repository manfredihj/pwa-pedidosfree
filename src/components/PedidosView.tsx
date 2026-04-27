"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginView from "@/components/LoginView";
import RegisterView from "@/components/RegisterView";
import RecoveryView from "@/components/RecoveryView";
import OrderHistory from "@/components/OrderHistory";
import { useAuth } from "@/lib/AuthContext";

type AuthScreen = "login" | "register" | "recovery";

interface PedidosViewProps {
  idgroup: number;
}

export default function PedidosView({ idgroup }: PedidosViewProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");

  if (loading) return null;

  // Not logged in → show auth screens
  if (!isAuthenticated) {
    if (authScreen === "register") {
      return (
        <RegisterView
          idgroup={idgroup}
          onGoToLogin={() => setAuthScreen("login")}
        />
      );
    }
    if (authScreen === "recovery") {
      return (
        <RecoveryView
          idgroup={idgroup}
          onGoToLogin={() => setAuthScreen("login")}
        />
      );
    }
    return (
      <LoginView
        idgroup={idgroup}
        onGoToRegister={() => setAuthScreen("register")}
        onGoToRecovery={() => setAuthScreen("recovery")}
      />
    );
  }

  // Logged in → show profile + order history
  return (
    <Box sx={{ pb: 10 }}>
      {/* Profile header */}
      <Box sx={{ px: 2, py: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontSize: "1.4rem", fontWeight: 700 }}>
          {user!.name.charAt(0)}{user!.lastname.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {user!.name} {user!.lastname}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user!.email}
          </Typography>
        </Box>
      </Box>
      <Divider />

      {/* Order history */}
      <OrderHistory idgroup={idgroup} />

      <Divider />

      {/* Logout */}
      <Box sx={{ px: 2, py: 2 }}>
        <Button
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={logout}
          sx={{ borderRadius: 6 }}
        >
          Cerrar sesión
        </Button>
      </Box>
    </Box>
  );
}
