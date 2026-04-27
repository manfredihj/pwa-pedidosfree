import { headers } from "next/headers";
import { getGroup, type Group } from "./api";

export interface Tenant {
  slug: string;
  group: Group;
}

// Hardcoded for now — will be resolved dynamically per subdomain later
const GROUP_ID = 20;

export async function getTenant(): Promise<Tenant> {
  const headersList = await headers();
  const slug = headersList.get("x-tenant") || "";

  const group = await getGroup(GROUP_ID);

  return { slug, group };
}
