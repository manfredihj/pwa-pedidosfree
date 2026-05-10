"use client";

import Box from "@mui/material/Box";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import EntityList from "@/components/EntityList";
import FirebaseMessaging from "@/components/FirebaseMessaging";
import NotificationsBanner from "@/components/NotificationsBanner";
import type { Tenant } from "@/lib/tenant";

interface MultiEntityShellProps {
  tenant: Tenant;
}

export default function MultiEntityShell({ tenant }: MultiEntityShellProps) {
  return (
    <FirebaseMessaging
      topics={[tenant.group.firebasetopic].filter(Boolean)}
      idgroup={tenant.group.idgroup}
    >
      <AppHeader tenant={tenant} />
      <Box component="main" sx={{ flex: 1, pb: 8 }}>
        <NotificationsBanner />
        <EntityList entities={tenant.group.entities} />
      </Box>
      <BottomNav value="menu" onChange={() => {}} />
    </FirebaseMessaging>
  );
}
