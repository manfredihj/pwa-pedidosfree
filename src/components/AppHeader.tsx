"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Badge from "@mui/material/Badge";
import { type Tenant } from "@/lib/tenant";
import { useCart } from "@/lib/CartContext";

interface AppHeaderProps {
  tenant: Tenant;
  title?: string;
  onCartClick?: () => void;
  onBack?: () => void;
}

export default function AppHeader({ tenant, title, onCartClick, onBack }: AppHeaderProps) {
  const { itemCount } = useCart();

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar>
        {onBack && (
          <IconButton color="inherit" aria-label="Volver" edge="start" onClick={onBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {title ?? tenant.group.name}
        </Typography>
        {onCartClick && (
          <IconButton color="inherit" aria-label="Ver carrito" onClick={onCartClick}>
            <Badge badgeContent={itemCount} color="secondary" showZero={false}>
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
}
