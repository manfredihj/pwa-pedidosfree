"use client";

import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Paper from "@mui/material/Paper";

export type TabValue = "menu" | "carrito" | "pedidos";

interface BottomNavProps {
  value: TabValue;
  onChange: (tab: TabValue) => void;
}

export default function BottomNav({ value, onChange }: BottomNavProps) {
  return (
    <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1100 }} elevation={3}>
      <BottomNavigation
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        showLabels
      >
        <BottomNavigationAction value="menu" label="Menu" icon={<RestaurantMenuIcon />} />
        <BottomNavigationAction value="carrito" label="Carrito" icon={<ShoppingCartIcon />} />
        <BottomNavigationAction value="pedidos" label="Pedidos" icon={<ReceiptLongIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
