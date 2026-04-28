import { headers } from "next/headers";
import { getGroup, getTenantBySlug, type Group } from "./api";

export interface Tenant {
  slug: string;
  group: Group;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
}

export async function getTenant(): Promise<Tenant> {
  const headersList = await headers();
  const slug = headersList.get("x-tenant") || "";

  if (!slug) {
    throw new Error("No tenant found. Access via subdomain (e.g. army.pedidosfree.com)");
  }

  const tenantData = await getTenantBySlug(slug);
  const group = await getGroup(tenantData.idgroup);

  return {
    slug,
    group,
    theme: tenantData.theme,
  };
}
