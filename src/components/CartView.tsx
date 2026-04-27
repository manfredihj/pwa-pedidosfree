"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ServiceTypeTabs from "@/components/ServiceTypeTabs";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";

interface CartViewProps {
  availableServices: { name: string; active: boolean }[];
  onRequireLogin?: () => void;
  onCheckout?: () => void;
}

export default function CartView({ availableServices, onRequireLogin, onCheckout }: CartViewProps) {
  const { items, total, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (items.length === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, px: 2 }}>
        <ShoppingCartOutlinedIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Tu carrito está vacío
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          Agregá productos desde el menú
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ px: 2, py: 1.5 }}>
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

      {/* Service type selector */}
      <ServiceTypeTabs availableServices={availableServices} />

      {/* Total */}
      <Box sx={{ px: 2, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Total
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ${total.toLocaleString("es-AR")}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ px: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          sx={{ borderRadius: 6, fontWeight: 700, py: 1.5 }}
          onClick={() => {
            if (!isAuthenticated && onRequireLogin) {
              onRequireLogin();
              return;
            }
            onCheckout?.();
          }}
        >
          Confirmar pedido
        </Button>
        <Button variant="outlined" color="inherit" fullWidth size="small" onClick={clearCart} sx={{ borderRadius: 6 }}>
          Vaciar carrito
        </Button>
      </Box>
    </Box>
  );
}
