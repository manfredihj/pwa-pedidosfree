"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Badge from "@mui/material/Badge";
import { type Tenant } from "@/lib/tenant";
import { useCart } from "@/lib/CartContext";

interface AppHeaderProps {
  tenant: Tenant;
  onCartClick?: () => void;
}

export default function AppHeader({ tenant, onCartClick }: AppHeaderProps) {
  const { itemCount } = useCart();

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {tenant.group.name}
        </Typography>
        <IconButton color="inherit" aria-label="Ver carrito" onClick={onCartClick}>
          <Badge badgeContent={itemCount} color="secondary" showZero={false}>
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
