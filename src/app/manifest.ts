import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PedidosFree",
    short_name: "PedidosFree",
    description: "Pedidos online para tu restaurante",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d32f2f",
    icons: [
      {
        src: "/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-192x192.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
