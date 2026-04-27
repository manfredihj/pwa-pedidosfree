"use client";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { useCart, type ServiceType } from "@/lib/CartContext";

const SERVICE_LABELS: Record<ServiceType, string> = {
  DELIVERY: "Delivery",
  "TAKE-AWAY": "Retiro en el local",
};

const SERVICE_ICONS: Record<ServiceType, React.ReactElement> = {
  DELIVERY: <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />,
  "TAKE-AWAY": <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />,
};

interface ServiceTypeTabsProps {
  availableServices: { name: string; active: boolean }[];
}

export default function ServiceTypeTabs({ availableServices }: ServiceTypeTabsProps) {
  const { serviceType, setServiceType } = useCart();

  if (availableServices.length <= 1) return null;

  return (
    <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
      <Tabs
        value={serviceType}
        onChange={(_, v) => setServiceType(v)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          bgcolor: "grey.100",
          borderRadius: 2,
          "& .MuiTabs-indicator": { display: "none" },
        }}
      >
        {availableServices.map((s) => (
          <Tab
            key={s.name}
            value={s.name}
            icon={SERVICE_ICONS[s.name as ServiceType]}
            iconPosition="start"
            label={SERVICE_LABELS[s.name as ServiceType] || s.name}
            sx={{
              minHeight: 36,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              borderRadius: 2,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "white",
                borderRadius: 2,
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
