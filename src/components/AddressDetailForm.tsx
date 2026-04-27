"use client";

import { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { createUserAddress, type UserAddress } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import type { ResolvedAddress } from "@/components/AddressSearch";

const NOTE_MAX = 100;
const ADDRESS_TAGS = ["Casa", "Trabajo", "Otro"] as const;

interface AddressDetailFormProps {
  resolvedAddress: ResolvedAddress;
  onSaved: (address: UserAddress) => void;
  onBack: () => void;
}

export default function AddressDetailForm({ resolvedAddress, onSaved, onBack }: AddressDetailFormProps) {
  const { user, getValidToken } = useAuth();
  const [streetdpto, setStreetdpto] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [tag, setTag] = useState<string>("Casa");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const miniMapRef = useRef<HTMLDivElement>(null);

  // Mini map
  useEffect(() => {
    if (!miniMapRef.current || !window.google) return;
    const center = { lat: resolvedAddress.latitude, lng: resolvedAddress.longitude };
    const map = new google.maps.Map(miniMapRef.current, {
      center,
      zoom: 16,
      disableDefaultUI: true,
      gestureHandling: "none",
      draggable: false,
    });
    new google.maps.Marker({ position: center, map });
  }, [resolvedAddress.latitude, resolvedAddress.longitude]);

  const handleNoteChange = (value: string) => {
    if (value.length <= NOTE_MAX) setNote(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!phone.trim()) {
      setError("El número de celular es obligatorio");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        setError("Sesión expirada. Por favor volvé a iniciar sesión.");
        setLoading(false);
        return;
      }
      const res = await createUserAddress(
        {
          userid: user.id,
          street: resolvedAddress.street,
          streetnumber: resolvedAddress.streetnumber,
          streetdpto,
          phone,
          note,
          latitude: String(resolvedAddress.latitude),
          longitude: String(resolvedAddress.longitude),
          fullname: resolvedAddress.fullname,
          areaname: resolvedAddress.areaname,
          placeid: resolvedAddress.placeid,
        },
        token,
      );
      if (res.success) {
        onSaved(res.data);
      } else {
        setError(res.message || "Error al guardar la dirección");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al guardar la dirección");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.paper" }}>
      {/* Header */}
      <Box sx={{ px: 1, pt: 1.5, pb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton onClick={onBack} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Dirección de entrega
        </Typography>
      </Box>
      <Divider />

      <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1, overflowY: "auto", pb: 12 }}>
        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Address section */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Detalles de la dirección
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <LocationOnIcon color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Dirección
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {resolvedAddress.street} {resolvedAddress.streetnumber}
              </Typography>
            </Box>
          </Box>
          <TextField
            label="Piso / Departamento"
            fullWidth
            value={streetdpto}
            onChange={(e) => setStreetdpto(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>
        <Divider sx={{ my: 1.5 }} />

        {/* Mini map */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Punto de entrega
          </Typography>
          <Box
            ref={miniMapRef}
            sx={{
              width: "100%",
              height: 160,
              borderRadius: 2,
              overflow: "hidden",
            }}
          />
        </Box>
        <Divider sx={{ my: 1.5 }} />

        {/* Delivery notes */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Indicaciones para la entrega
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Referencias / Indicaciones para la entrega"
            variant="outlined"
            size="small"
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Ej: dejar pedido en portería.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {note.length}/{NOTE_MAX}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 1.5 }} />

        {/* Phone */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Datos de contacto
          </Typography>
          <TextField
            label="Número de celular *"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            variant="outlined"
            size="small"
            placeholder="Ej: 11 1234-5678"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            Te contactaremos solo en caso de ser necesario.
          </Typography>
        </Box>
        <Divider sx={{ my: 1.5 }} />

        {/* Address tag */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            ¿Qué nombre le damos a esta dirección?
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {ADDRESS_TAGS.map((t) => (
              <Chip
                key={t}
                label={t}
                variant={tag === t ? "filled" : "outlined"}
                color={tag === t ? "primary" : "default"}
                onClick={() => setTag(t)}
                clickable
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Fixed bottom button */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Button
          type="submit"
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          disabled={loading}
          onClick={handleSubmit}
          sx={{ borderRadius: 6, fontWeight: 700, py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Guardar dirección"}
        </Button>
      </Box>
    </Box>
  );
}
