"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddressSearch, { type ResolvedAddress } from "@/components/AddressSearch";
import AddressMapConfirm from "@/components/AddressMapConfirm";
import AddressDetailForm from "@/components/AddressDetailForm";
import { getUserAddresses, deactivateUserAddress, type UserAddress, type EntityDeliveryZone } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

type Step = "list" | "search" | "map" | "detail";

interface AddressManagerProps {
  onBack: () => void;
}

export default function AddressManager({ onBack }: AddressManagerProps) {
  const { user, getValidToken } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("list");
  const [resolvedAddress, setResolvedAddress] = useState<ResolvedAddress | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const token = await getValidToken();
      if (!token) { setLoading(false); return; }
      try {
        const data = await getUserAddresses(user.id, token);
        setAddresses(data);
      } catch {
        setAddresses([]);
      }
      setLoading(false);
    })();
  }, [user, getValidToken]);

  const handleDelete = async (addressId: number) => {
    if (!user) return;
    const token = await getValidToken();
    if (!token) return;
    try {
      await deactivateUserAddress(user.id, addressId, token);
      setAddresses((prev) => prev.filter((a) => a.iduseraddress !== addressId));
    } catch {
      // silent
    }
  };

  const handleSearchSelect = (address: ResolvedAddress) => {
    setResolvedAddress(address);
    setStep("map");
  };

  const handleMapConfirm = (updated: ResolvedAddress) => {
    setResolvedAddress(updated);
    setStep("detail");
  };

  const handleSaved = (newAddr: UserAddress) => {
    setAddresses((prev) => [...prev, newAddr]);
    setStep("list");
  };

  if (step === "search") {
    return <AddressSearch onSelect={handleSearchSelect} onBack={() => setStep("list")} />;
  }

  if (step === "map" && resolvedAddress) {
    return (
      <AddressMapConfirm
        address={resolvedAddress}
        entityDeliveryZones={[]}
        onConfirm={handleMapConfirm}
        onBack={() => setStep("search")}
      />
    );
  }

  if (step === "detail" && resolvedAddress) {
    return (
      <AddressDetailForm
        resolvedAddress={resolvedAddress}
        onSaved={handleSaved}
        onBack={() => setStep("map")}
      />
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ px: 1, py: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton onClick={onBack} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Mis direcciones
        </Typography>
      </Box>
      <Divider />

      {addresses.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, px: 2 }}>
          <LocationOnOutlinedIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No tenés direcciones guardadas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setStep("search")}
            sx={{ borderRadius: 6 }}
          >
            Agregar dirección
          </Button>
        </Box>
      ) : (
        <>
          {addresses.map((addr) => (
            <Box key={addr.iduseraddress}>
              <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                <LocationOnOutlinedIcon color="action" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {addr.street} {addr.streetnumber}
                  </Typography>
                  {addr.streetdpto && (
                    <Typography variant="caption" color="text.secondary">
                      Dpto: {addr.streetdpto}
                    </Typography>
                  )}
                  {addr.note && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {addr.note}
                    </Typography>
                  )}
                </Box>
                <IconButton size="small" color="error" onClick={() => handleDelete(addr.iduseraddress)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mx: 2 }} />
            </Box>
          ))}

          <Box sx={{ px: 2, py: 1.5 }}>
            <Button
              variant="text"
              startIcon={<AddIcon />}
              onClick={() => setStep("search")}
              sx={{ textTransform: "none" }}
            >
              Agregar nueva dirección
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
