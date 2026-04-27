"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ServiceTypeTabs from "@/components/ServiceTypeTabs";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { getEntityScheduleStatus, type ScheduleData, type ScheduleItem, type EntityDiscount } from "@/lib/api";
import { getApplicableDiscounts, totalDiscounts } from "@/lib/discounts";

interface CartViewProps {
  entityId: number;
  availableServices: { name: string; active: boolean }[];
  entityDiscounts: EntityDiscount[];
  onBack?: () => void;
  onRequireLogin?: () => void;
  onCheckout?: () => void;
}

export default function CartView({ entityId, availableServices, entityDiscounts, onBack, onRequireLogin, onCheckout }: CartViewProps) {
  const { items, total, serviceType, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState("");

  useEffect(() => {
    getEntityScheduleStatus(entityId)
      .then((data) => {
        setScheduleData(data);
      })
      .catch(() => setScheduleData(null));
  }, [entityId]);

  // Get schedules for current service type
  const currentSchedules: ScheduleItem[] = scheduleData?.schedules?.[serviceType] || [];

  // Auto-select first schedule when service type changes
  useEffect(() => {
    if (currentSchedules.length > 0 && !currentSchedules.find((s) => s.description === selectedSchedule)) {
      setSelectedSchedule(currentSchedules[0].description);
    }
  }, [serviceType, currentSchedules, selectedSchedule]);

  // Get selected schedule identity for discount conditions
  const selectedScheduleItem = currentSchedules.find((s) => s.description === selectedSchedule);
  const identitySchedule = selectedScheduleItem?.identityschedule ?? null;

  // Calculate discounts
  const appliedDiscounts = items.length > 0
    ? getApplicableDiscounts(entityDiscounts, total, items, serviceType, null, identitySchedule)
    : [];
  const discountTotal = totalDiscounts(appliedDiscounts);
  const finalTotal = total - discountTotal;

  if (items.length === 0) {
    return (
      <Box>
        <Box sx={{ px: 1, py: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton onClick={onBack} edge="start">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Tu pedido
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, px: 2 }}>
          <ShoppingCartOutlinedIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Tu carrito está vacío
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Agregá productos desde el menú
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ px: 1, py: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton onClick={onBack} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Tu pedido
        </Typography>
      </Box>
      <Divider />

      {items.map((item, index) => (
        <Box key={index}>
          <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            {/* Quantity badge */}
            <Box
              sx={{
                minWidth: 28,
                height: 28,
                borderRadius: 1,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                flexShrink: 0,
                mt: 0.3,
              }}
            >
              {item.quantity}
            </Box>

            {/* Item info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {item.nameproduct}
              </Typography>

              {/* Selected options */}
              {item.orderdetailgroups.map((group) => (
                <Box key={group.idproductoptiongroup} sx={{ mt: 0.3 }}>
                  {group.orderdetailproductoptions.map((opt) => (
                    <Typography key={opt.idproductoption} variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {opt.quantity > 1 ? `${opt.quantity}x ` : ""}{opt.nameoption}
                      {opt.price > 0 ? ` (+$${opt.price.toLocaleString("es-AR")})` : ""}
                    </Typography>
                  ))}
                </Box>
              ))}

              {item.note && (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", mt: 0.3, display: "block" }}>
                  {item.note}
                </Typography>
              )}
            </Box>

            {/* Price + delete */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                ${item.totaldetail.toLocaleString("es-AR")}
              </Typography>
              <IconButton size="small" onClick={() => removeItem(index)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Divider sx={{ mx: 2 }} />
        </Box>
      ))}

      {/* Subtotal */}
      <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          Subtotal
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          ${total.toLocaleString("es-AR")}
        </Typography>
      </Box>

      {/* Discounts */}
      {appliedDiscounts.map((d, i) => (
        <Box key={i} sx={{ px: 2, py: 0.5, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="success.main">
            {d.description}
          </Typography>
          <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
            -${d.amount.toLocaleString("es-AR")}
          </Typography>
        </Box>
      ))}

      {/* Total with discounts */}
      {appliedDiscounts.length > 0 && (
        <Box sx={{ px: 2, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            Total
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            ${finalTotal.toLocaleString("es-AR")}
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Service type selector */}
      <ServiceTypeTabs availableServices={availableServices} />

      {/* Takeaway notice */}
      {serviceType === "TAKE-AWAY" && (
        <Alert severity="info" sx={{ mx: 2, mt: 1, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Pedido para retirar
          </Typography>
          <Typography variant="caption">
            Acercate al local a buscar tu pedido.
          </Typography>
        </Alert>
      )}

      {/* Schedule selector */}
      {currentSchedules.length > 0 && (
        <Box sx={{ px: 2, pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Horario de entrega</InputLabel>
            <Select
              value={selectedSchedule}
              label="Horario de entrega"
              onChange={(e) => setSelectedSchedule(e.target.value)}
            >
              {currentSchedules.map((s, i) => (
                <MenuItem key={i} value={s.description}>
                  {s.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Floating action button */}
      <Box
        sx={{
          position: "fixed",
          bottom: 64,
          left: 12,
          right: 12,
          zIndex: 1050,
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          sx={{ borderRadius: 6, fontWeight: 700, py: 1.3, boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}
          onClick={() => {
            if (!isAuthenticated && onRequireLogin) {
              onRequireLogin();
              return;
            }
            onCheckout?.();
          }}
        >
          Realizar pedido — ${finalTotal.toLocaleString("es-AR")}
        </Button>
      </Box>
    </Box>
  );
}
