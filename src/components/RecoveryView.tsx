"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import { useAuth } from "@/lib/AuthContext";

interface RecoveryViewProps {
  idgroup?: number;
  onGoToLogin: () => void;
}

export default function RecoveryView({ idgroup, onGoToLogin }: RecoveryViewProps) {
  const { recoverPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await recoverPassword(email, idgroup);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
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
          <MailOutlineIcon sx={{ color: "white" }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Recuperar contraseña
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
          Te enviaremos un email con las instrucciones para restablecer tu contraseña
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success ? (
        <>
          <Alert severity="success" sx={{ mb: 3 }}>
            Revisá tu email. Te enviamos las instrucciones para restablecer tu contraseña.
          </Alert>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={onGoToLogin}
            sx={{ borderRadius: 6, fontWeight: 700, py: 1.5 }}
          >
            Volver a iniciar sesión
          </Button>
        </>
      ) : (
        <>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              autoComplete="email"
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
              {loading ? <CircularProgress size={24} color="inherit" /> : "Enviar"}
            </Button>
          </Box>

          <Button fullWidth onClick={onGoToLogin} sx={{ textTransform: "none" }}>
            Volver a iniciar sesión
          </Button>
        </>
      )}
    </Box>
  );
}
