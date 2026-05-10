"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import LogoutIcon from "@mui/icons-material/Logout";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import Switch from "@mui/material/Switch";
import { useNotifications } from "@/components/FirebaseMessaging";
import LoginView from "@/components/LoginView";
import RegisterView from "@/components/RegisterView";
import RecoveryView from "@/components/RecoveryView";
import AddressManager from "@/components/AddressManager";
import { useAuth } from "@/lib/AuthContext";

type AuthScreen = "login" | "register" | "recovery";
type ProfileScreen = "main" | "addresses";

interface ProfileViewProps {
  idgroup: number;
}

export default function ProfileView({ idgroup }: ProfileViewProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { enabled: notificationsEnabled, toggle: toggleNotifications, loading: notificationsLoading } = useNotifications();
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [screen, setScreen] = useState<ProfileScreen>("main");

  if (loading) return null;

  if (!isAuthenticated) {
    if (authScreen === "register") {
      return <RegisterView idgroup={idgroup} onGoToLogin={() => setAuthScreen("login")} />;
    }
    if (authScreen === "recovery") {
      return <RecoveryView idgroup={idgroup} onGoToLogin={() => setAuthScreen("login")} />;
    }
    return (
      <LoginView
        idgroup={idgroup}
        onGoToRegister={() => setAuthScreen("register")}
        onGoToRecovery={() => setAuthScreen("recovery")}
      />
    );
  }

  if (screen === "addresses") {
    return <AddressManager onBack={() => setScreen("main")} />;
  }

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

      {/* Información personal */}
      <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Información personal
        </Typography>
      </Box>
      <List disablePadding>
        <ListItemButton sx={{ px: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <PersonOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Mis datos personales"
            secondary={`${user!.name} ${user!.lastname}`}
          />
          <ChevronRightIcon color="action" />
        </ListItemButton>
        <Divider variant="inset" component="li" />
        <ListItemButton sx={{ px: 2 }} disabled>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <PhoneOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Número de celular"
            secondary={user!.phone || "Sin número"}
          />
        </ListItemButton>
        <Divider variant="inset" component="li" />
        <ListItemButton sx={{ px: 2 }} disabled>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <EmailOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="E-mail"
            secondary={user!.email}
          />
        </ListItemButton>
      </List>
      <Divider sx={{ mt: 1 }} />

      {/* Perfil section */}
      <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Perfil
        </Typography>
      </Box>
      <List disablePadding>
        <ListItemButton sx={{ px: 2 }} onClick={() => setScreen("addresses")}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LocationOnOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Direcciones" />
          <ChevronRightIcon color="action" />
        </ListItemButton>
        <Divider variant="inset" component="li" />
        <ListItemButton
          sx={{ px: 2 }}
          onClick={() => toggleNotifications()}
          disabled={notificationsLoading}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <NotificationsOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Notificaciones"
            secondary={notificationsEnabled ? "Activadas" : "Desactivadas"}
          />
          <Switch checked={notificationsEnabled} disabled={notificationsLoading} />
        </ListItemButton>
      </List>
      <Divider />

      {/* Logout */}
      <Box sx={{ px: 2, py: 3 }}>
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
