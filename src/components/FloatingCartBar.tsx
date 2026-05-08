"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useCart } from "@/lib/CartContext";

interface FloatingCartBarProps {
  onClick: () => void;
}

export default function FloatingCartBar({ onClick }: FloatingCartBarProps) {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 76,
        left: 12,
        right: 12,
        zIndex: 1050,
      }}
    >
      <Button
        onClick={onClick}
        fullWidth
        variant="contained"
        color="secondary"
        sx={{
          borderRadius: 6,
          py: 1.3,
          px: 2,
          display: "flex",
          justifyContent: "space-between",
          textTransform: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShoppingCartIcon sx={{ fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: "inherit" }}>
            {itemCount} {itemCount === 1 ? "producto" : "productos"}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ fontWeight: 700, color: "inherit" }}>
          Ver carrito
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "inherit" }}>
          ${total.toLocaleString("es-AR")}
        </Typography>
      </Button>
    </Box>
  );
}
