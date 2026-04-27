"use client";

import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { getUserOrders, type Order } from "@/lib/api";
import OrderDetailView from "@/components/OrderDetailView";
import { useAuth } from "@/lib/AuthContext";

const STATUS_CONFIG: Record<string, { label: string; color: "success" | "warning" | "error" | "default" }> = {
  NEW: { label: "Sin confirmar", color: "warning" },
  CONFIRMED: { label: "Confirmado", color: "success" },
  CANCELED: { label: "Cancelado", color: "error" },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status?.toUpperCase()] || { label: status, color: "default" as const };
}

interface OrderHistoryProps {
  idgroup: number;
}

export default function OrderHistory({ idgroup }: OrderHistoryProps) {
  const { user, getValidToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const LIMIT = 20;

  const fetchOrders = useCallback(async (start: number) => {
    if (!user) return [];
    const token = await getValidToken();
    if (!token) return [];
    try {
      return await getUserOrders(user.id, idgroup, token, start, LIMIT);
    } catch {
      return [];
    }
  }, [user, idgroup, getValidToken]);

  useEffect(() => {
    (async () => {
      const data = await fetchOrders(0);
      setOrders(data);
      setHasMore(data.length >= LIMIT);
      setLoading(false);
    })();
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const data = await fetchOrders(0);
    setOrders(data);
    setHasMore(data.length >= LIMIT);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const data = await fetchOrders(orders.length);
    setOrders((prev) => [...prev, ...data]);
    setHasMore(data.length >= LIMIT);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (orders.length === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, px: 2 }}>
        <ReceiptLongIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Tus pedidos
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          Todavía no hiciste ningún pedido
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with refresh */}
      <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Mis pedidos
        </Typography>
        <IconButton onClick={handleRefresh} disabled={refreshing} color="primary" size="small">
          {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Box>
      <Divider />

      {orders.map((order) => {
        const statusCfg = getStatusConfig(order.status_detail);
        return (
          <Box key={order.idorder} onClick={() => setSelectedOrder(order)} sx={{ cursor: "pointer", "&:active": { bgcolor: "action.selected" } }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              {/* Entity name + status */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {order.entityname}
                </Typography>
                <Chip
                  label={statusCfg.label}
                  color={statusCfg.color}
                  size="small"
                  sx={{ fontSize: "0.7rem", height: 22, fontWeight: 600 }}
                />
              </Box>

              {/* Date + time */}
              <Typography variant="body2" color="text.secondary">
                {order.register_date_format} | {order.register_time_format}
              </Typography>

              {/* Delivery type */}
              {order.delivery_type_description && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {order.delivery_type_description}
                </Typography>
              )}

              {/* Payment type */}
              {order.payment_type_string && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {order.payment_type_string}
                </Typography>
              )}

              {/* Order number + total */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Pedido #{order.idorder}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  ${(order.totalcalculated ?? order.total)?.toLocaleString("es-AR")}
                </Typography>
              </Box>
            </Box>
            <Divider />
          </Box>
        );
      })}

      {/* Load more */}
      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <Button onClick={loadMore} disabled={loadingMore} sx={{ textTransform: "none" }}>
            {loadingMore ? <CircularProgress size={20} /> : "Ver más pedidos"}
          </Button>
        </Box>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailView order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </Box>
  );
}
