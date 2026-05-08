import type { MetadataRoute } from "next";
import { getTenant } from "@/lib/tenant";

function getImageType(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/svg+xml";
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = "PedidosFree";
  let description = "Pedidos online para tu restaurante";
  let themeColor = "#d32f2f";
  let icon192 = "/icon-192x192.svg";
  let icon512 = "/icon-192x192.svg";

  try {
    const tenant = await getTenant();
    name = tenant.group.name || name;
    description = tenant.group.description || description;
    themeColor = tenant.theme.primaryColor || themeColor;

    const pwaIcon192 = tenant.group.groupimages.find(
      (img) => img.keyname === "icon_192_x_192_pwa"
    );
    const pwaIcon512 = tenant.group.groupimages.find(
      (img) => img.keyname === "icon_512_x_512_pwa"
    );
    if (pwaIcon192?.path) icon192 = pwaIcon192.path;
    if (pwaIcon512?.path) icon512 = pwaIcon512.path;
  } catch {
    // Fallback to defaults
  }

  return {
    name,
    short_name: name,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themeColor,
    icons: [
      {
        src: icon192,
        sizes: "192x192",
        type: getImageType(icon192),
      },
      {
        src: icon512,
        sizes: "512x512",
        type: getImageType(icon512),
      },
    ],
  };
}
