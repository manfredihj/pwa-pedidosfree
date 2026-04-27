"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import CloseIcon from "@mui/icons-material/Close";
import { getOrderDetails, type Order, type OrderItem } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const STATUS_CONFIG: Record<string, { label: string; color: "success" | "warning" | "error" | "default" }> = {
  NEW: { label: "Sin confirmar", color: "warning" },
  CONFIRMED: { label: "Confirmado", color: "success" },
  CANCELED: { label: "Cancelado", color: "error" },
};

interface OrderDetailViewProps {
  order: Order;
  onClose: () => void;
}

export default function OrderDetailView({ order, onClose }: OrderDetailViewProps) {
  const { getValidToken } = useAuth();
  const [details, setDetails] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const statusCfg = STATUS_CONFIG[order.status_detail?.toUpperCase()] || { label: order.status_detail, color: "default" as const };

  useEffect(() => {
    (async () => {
      const token = await getValidToken();
      if (!token) { setLoading(false); return; }
      try {
        const data = await getOrderDetails(order.idorder, token);
        setDetails(data);
      } catch {
        setDetails([]);
      }
      setLoading(false);
    })();
  }, [order.idorder, getValidToken]);

  return (
    <Dialog open fullScreen>
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Detalle de pedido
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: "auto", pb: 4 }}>
        {/* Order header */}
        <Box sx={{ px: 2, py: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              # {order.idorder}
            </Typography>
            <Chip
              label={statusCfg.label}
              color={statusCfg.color}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Cancel reason */}
          {order.status_detail === "CANCELED" && order.reasoncancel && (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              Cancelado por: {order.reasoncancel}
            </Typography>
          )}

          {/* Address (delivery only) */}
          {order.delivery_type_description === "DELIVERY" && order.client_or_address && (
            <InfoRow label="Dirección" value={order.client_or_address} />
          )}
          <InfoRow label="Fecha" value={order.register_date_format} />
          <InfoRow label="Hora" value={order.register_time_format} />
          <InfoRow label="Tipo" value={order.delivery_type_description} />
          <InfoRow label="Pago" value={order.payment_type_string} />
          {order.delivery_description && (
            <InfoRow label="Entrega" value={order.delivery_description} />
          )}
          {order.note && (
            <InfoRow label="Nota" value={order.note} />
          )}
        </Box>

        <Divider />

        {/* Order details */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Detalle del pedido
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            details.map((item, i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  ({item.quantity}) {item.nameproduct}
                </Typography>
                {item.orderdetailgroups?.map((group, gi) => (
                  <Box key={gi} sx={{ pl: 1.5, mt: 0.3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {group.nameproductoptiongroup}
                    </Typography>
                    {group.orderdetailproductoptions?.map((opt, oi) => (
                      <Typography key={oi} variant="caption" color="text.secondary" sx={{ display: "block", pl: 1 }}>
                        {opt.quantity} - {opt.nameoption}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>
            ))
          )}
        </Box>

        <Divider />

        {/* Totals */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <TotalRow label="Subtotal" value={order.subtotalcalculated} />

          {order.orderdiscounts?.map((d, i) => (
            <TotalRow key={`d${i}`} label={d.description} value={-d.amount} />
          ))}

          {order.orderfees?.map((f, i) => (
            <TotalRow key={`f${i}`} label={f.name} value={f.amount} />
          ))}

          <TotalRow label="Costo de envío" value={order.shippingcost} />

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Total
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              ${order.totalcalculated?.toLocaleString("es-AR")}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
      {label}: {value}
    </Typography>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  if (value == null) return null;
  const isNegative = value < 0;
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.3 }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" color={isNegative ? "success.main" : "text.primary"}>
        {isNegative ? "-" : ""}${Math.abs(value).toLocaleString("es-AR")}
      </Typography>
    </Box>
  );
}
