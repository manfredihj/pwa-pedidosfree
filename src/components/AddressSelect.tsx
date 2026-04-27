"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddressSearch, { type ResolvedAddress } from "@/components/AddressSearch";
import AddressMapConfirm from "@/components/AddressMapConfirm";
import AddressDetailForm from "@/components/AddressDetailForm";
import { getUserAddresses, deactivateUserAddress, type UserAddress, type EntityDeliveryZone } from "@/lib/api";
import { checkDeliveryZone } from "@/lib/deliveryZones";
import { useAuth } from "@/lib/AuthContext";

type AddStep = "list" | "search" | "map" | "detail";

interface AddressSelectProps {
  entityDeliveryZones: EntityDeliveryZone[];
  onSelect: (address: UserAddress, identitydeliveryzone: number | null) => void;
  onBack: () => void;
}

export default function AddressSelect({ entityDeliveryZones, onSelect, onBack }: AddressSelectProps) {
  const { user, getValidToken } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>("");
  const [step, setStep] = useState<AddStep>("list");
  const [resolvedAddress, setResolvedAddress] = useState<ResolvedAddress | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const token = await getValidToken();
      if (!token) { setLoading(false); return; }
      try {
        const data = await getUserAddresses(user.id, token);
        setAddresses(data);
        if (data.length > 0) setSelected(String(data[0].iduseraddress));
      } catch {
        setAddresses([]);
      }
      setLoading(false);
    })();
  }, [user, getValidToken]);

  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleConfirm = () => {
    const addr = addresses.find((a) => String(a.iduseraddress) === selected);
    if (!addr) return;

    if (entityDeliveryZones.length > 0 && addr.latitude && addr.longitude) {
      const result = checkDeliveryZone(parseFloat(addr.latitude), parseFloat(addr.longitude), entityDeliveryZones);
      if (!result.isInside) {
        setConfirmError("Esta dirección está fuera de la zona de entrega.");
        return;
      }
      onSelect(addr, result.identitydeliveryzone);
    } else {
      onSelect(addr, null);
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!user) return;
    const token = await getValidToken();
    if (!token) return;
    try {
      await deactivateUserAddress(user.id, addressId, token);
      setAddresses((prev) => prev.filter((a) => a.iduseraddress !== addressId));
      if (selected === String(addressId)) setSelected("");
    } catch {
      // silent fail
    }
  };

  const handleAddressSearchSelect = (address: ResolvedAddress) => {
    setResolvedAddress(address);
    setStep("map");
  };

  const handleMapConfirm = (updated: ResolvedAddress, identitydeliveryzone: number | null) => {
    setResolvedAddress(updated);
    setSelectedZoneId(identitydeliveryzone);
    setStep("detail");
  };

  const handleAddressSaved = (newAddr: UserAddress) => {
    setAddresses((prev) => [...prev, newAddr]);
    setSelected(String(newAddr.iduseraddress));
    // Go directly to selection with the zone we already validated
    onSelect(newAddr, selectedZoneId);
  };

  // Step: Google Places search
  if (step === "search") {
    return (
      <AddressSearch
        onSelect={handleAddressSearchSelect}
        onBack={() => setStep("list")}
      />
    );
  }

  // Step: map confirmation
  if (step === "map" && resolvedAddress) {
    return (
      <AddressMapConfirm
        address={resolvedAddress}
        entityDeliveryZones={entityDeliveryZones}
        onConfirm={handleMapConfirm}
        onBack={() => setStep("search")}
      />
    );
  }

  // Step: detail form (dpto, phone, note)
  if (step === "detail" && resolvedAddress) {
    return (
      <AddressDetailForm
        resolvedAddress={resolvedAddress}
        onSaved={handleAddressSaved}
        onBack={() => setStep("map")}
      />
    );
  }

  // Step: address list
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
          Dirección de entrega
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
          {/* Address list */}
          <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
            {addresses.map((addr) => (
              <Box key={addr.iduseraddress}>
                <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    value={String(addr.iduseraddress)}
                    control={<Radio />}
                    label={
                      <Box>
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
                    }
                    sx={{ flex: 1, mr: 0 }}
                  />
                  <IconButton size="small" color="error" onClick={() => handleDelete(addr.iduseraddress)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Divider sx={{ mx: 2 }} />
              </Box>
            ))}
          </RadioGroup>

          {/* Add address button */}
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

          {/* Zone error */}
          {confirmError && (
            <Alert severity="error" sx={{ mx: 2, mt: 1 }} onClose={() => setConfirmError(null)}>
              {confirmError}
            </Alert>
          )}

          {/* Confirm button */}
          <Box sx={{ px: 2, pt: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              disabled={!selected}
              onClick={handleConfirm}
              sx={{ borderRadius: 6, fontWeight: 700, py: 1.5 }}
            >
              Continuar con esta dirección
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
