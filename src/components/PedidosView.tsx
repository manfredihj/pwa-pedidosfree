"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import OrderHistory from "@/components/OrderHistory";
import { useAuth } from "@/lib/AuthContext";

interface PedidosViewProps {
  idgroup: number;
}

export default function PedidosView({ idgroup }: PedidosViewProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, px: 2 }}>
        <ReceiptLongIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Tus pedidos
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          Iniciá sesión desde tu perfil para ver tu historial
        </Typography>
      </Box>
    );
  }

  return <OrderHistory idgroup={idgroup} />;
}
