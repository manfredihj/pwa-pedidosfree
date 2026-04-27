import Box from "@mui/material/Box";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import EntityList from "@/components/EntityList";
import AppShell from "@/components/AppShell";
import { getTenant } from "@/lib/tenant";
import { getEntitySections } from "@/lib/api";

export default async function Page() {
  const tenant = await getTenant();
  const { group } = tenant;

  // Multiple entities → show entity selector
  if (group.multipleentities) {
    return (
      <>
        <AppHeader tenant={tenant} />
        <Box component="main" sx={{ flex: 1, pb: 8 }}>
          <EntityList entities={group.entities} />
        </Box>
        <BottomNav value="menu" onChange={() => {}} />
      </>
    );
  }

  // Single entity → app shell with tab navigation
  const entity = group.entities[0];
  const sections = await getEntitySections(entity.identity);

  return <AppShell tenant={tenant} sections={sections} entity={entity} />;
}
