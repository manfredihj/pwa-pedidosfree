import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import MultiEntityShell from "@/components/MultiEntityShell";
import Providers from "@/components/Providers";
import { getTenant } from "@/lib/tenant";
import { getEntitySections } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  const description = `Pedí online en ${tenant.group.name}`;
  const icon512 = tenant.group.groupimages.find((img) => img.keyname === "icon_512_x_512_pwa");
  const icon192 = tenant.group.groupimages.find((img) => img.keyname === "icon_192_x_192_pwa");
  const ogImage = icon512?.path || icon192?.path;

  return {
    title: tenant.group.name,
    description,
    icons: {
      icon: icon192?.path || "/icon-192x192.png",
      apple: icon192?.path || "/icon-192x192.png",
    },
    openGraph: {
      title: tenant.group.name,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
    },
  };
}

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
