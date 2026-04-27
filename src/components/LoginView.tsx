"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuth } from "@/lib/AuthContext";

interface LoginViewProps {
  idgroup?: number;
  onGoToRegister: () => void;
  onGoToRecovery: () => void;
}

export default function LoginView({ idgroup, onGoToRegister, onGoToRecovery }: LoginViewProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await login(email, password, idgroup);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <Box sx={{ px: 3, py: 4, maxWidth: 400, mx: "auto" }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1.5,
          }}
        >
          <LockOutlinedIcon sx={{ color: "white" }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Iniciar sesión
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
          autoComplete="email"
        />
        <TextField
          label="Contraseña"
          type="password"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ borderRadius: 6, fontWeight: 700, py: 1.5, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Ingresar"}
        </Button>
      </Box>

      <Button fullWidth onClick={onGoToRecovery} sx={{ textTransform: "none", mb: 1 }}>
        ¿Olvidaste tu contraseña?
      </Button>
      <Button fullWidth onClick={onGoToRegister} sx={{ textTransform: "none" }}>
        ¿No tenés cuenta? Registrate
      </Button>
    </Box>
  );
}
