"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import { useAuth } from "@/lib/AuthContext";

interface RegisterViewProps {
  idgroup?: number;
  onGoToLogin: () => void;
}

export default function RegisterView({ idgroup, onGoToLogin }: RegisterViewProps) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    const err = await register(name, lastname, email, password, idgroup);
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
          <PersonAddOutlinedIcon sx={{ color: "white" }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Crear cuenta
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Nombre"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
          autoComplete="given-name"
        />
        <TextField
          label="Apellido"
          fullWidth
          required
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          sx={{ mb: 2 }}
          autoComplete="family-name"
        />
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
          sx={{ mb: 2 }}
          autoComplete="new-password"
        />
        <TextField
          label="Confirmar contraseña"
          type="password"
          fullWidth
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 3 }}
          autoComplete="new-password"
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
          {loading ? <CircularProgress size={24} color="inherit" /> : "Registrarme"}
        </Button>
      </Box>

      <Button fullWidth onClick={onGoToLogin} sx={{ textTransform: "none" }}>
        ¿Ya tenés cuenta? Iniciá sesión
      </Button>
    </Box>
  );
}
