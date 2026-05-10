import AppShell from "@/components/AppShell";
import MultiEntityShell from "@/components/MultiEntityShell";
import Providers from "@/components/Providers";
import { getTenant } from "@/lib/tenant";
import { getEntitySections } from "@/lib/api";

export default async function Page() {
  const tenant = await getTenant();
  const { group, theme } = tenant;

  // Multiple entities → show entity selector
  if (group.multipleentities) {
    return (
      <Providers primaryColor={theme.primaryColor} secondaryColor={theme.secondaryColor}>
        <MultiEntityShell tenant={tenant} />
      </Providers>
    );
  }

  // Single entity → app shell with tab navigation
  const entity = group.entities[0];
  const sections = await getEntitySections(entity.identity);

  return (
    <Providers primaryColor={theme.primaryColor} secondaryColor={theme.secondaryColor}>
      <AppShell tenant={tenant} sections={sections} entity={entity} />
    </Providers>
  );
}
