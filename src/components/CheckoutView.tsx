"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import AddressSelect from "@/components/AddressSelect";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import type { UserAddress, EntityDeliveryZone } from "@/lib/api";

type CheckoutStep = "address" | "summary";

interface CheckoutViewProps {
  entityDeliveryZones: EntityDeliveryZone[];
  onBack: () => void;
}

export default function CheckoutView({ entityDeliveryZones, onBack }: CheckoutViewProps) {
  const { items, total, serviceType, clearCart } = useCart();
  const { user } = useAuth();
  const isDelivery = serviceType === "DELIVERY";

  const [step, setStep] = useState<CheckoutStep>(isDelivery ? "address" : "summary");
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [deliveryZoneId, setDeliveryZoneId] = useState<number | null>(null);

  const handleAddressSelected = (address: UserAddress, identitydeliveryzone: number | null) => {
    setSelectedAddress(address);
    setDeliveryZoneId(identitydeliveryzone);
    setStep("summary");
  };

  const handleConfirmOrder = () => {
    // TODO: POST order to API
    clearCart();
    onBack();
  };

  // Step: select address (delivery only)
  if (step === "address" && isDelivery) {
    return <AddressSelect entityDeliveryZones={entityDeliveryZones} onSelect={handleAddressSelected} onBack={onBack} />;
  }

  // Step: order summary / confirmation
  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={() => isDelivery ? setStep("address") : onBack()} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Confirmar pedido
        </Typography>
      </Box>
      <Divider />

      {/* Takeaway notice */}
      {!isDelivery && (
        <Alert
          severity="info"
          sx={{ mx: 2, mt: 2, borderRadius: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Pedido para retirar
          </Typography>
          <Typography variant="caption">
            Acercate al local a buscar tu pedido.
          </Typography>
        </Alert>
      )}

      {/* Service type info */}
      <Box sx={{ px: 2, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        {isDelivery ? (
          <LocationOnIcon color="primary" />
        ) : (
          <StorefrontIcon color="primary" />
        )}
        <Box>
          <Typography variant="body2" color="text.secondary">
            {isDelivery ? "Envío a" : "Retiro en el local"}
          </Typography>
          {isDelivery && selectedAddress && (
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {selectedAddress.street} {selectedAddress.streetnumber}
              {selectedAddress.streetdpto ? ` - ${selectedAddress.streetdpto}` : ""}
            </Typography>
          )}
          {isDelivery && (
            <Button
              size="small"
              onClick={() => setStep("address")}
              sx={{ textTransform: "none", p: 0, minWidth: 0 }}
            >
              Cambiar
            </Button>
          )}
        </Box>
      </Box>
      <Divider />

      {/* Order items summary */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Resumen del pedido
        </Typography>
        {items.map((item, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
            <Typography variant="body2">
              {item.quantity}x {item.nameproduct}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ${item.totaldetail.toLocaleString("es-AR")}
            </Typography>
          </Box>
        ))}
      </Box>
      <Divider />

      {/* Total */}
      <Box sx={{ px: 2, py: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Total
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ${total.toLocaleString("es-AR")}
        </Typography>
      </Box>

      {/* Confirm */}
      <Box sx={{ px: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          startIcon={<CheckCircleOutlineIcon />}
          onClick={handleConfirmOrder}
          sx={{ borderRadius: 6, fontWeight: 700, py: 1.5 }}
        >
          Enviar pedido
        </Button>
      </Box>
    </Box>
  );
}
