import { ImageResponse } from "next/og";
import { getTenant } from "@/lib/tenant";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  let iconUrl = "";

  try {
    const tenant = await getTenant();
    const pwaIcon = tenant.group.groupimages.find(
      (img) => img.keyname === "icon_192_x_192_pwa"
    );
    if (pwaIcon?.path) iconUrl = pwaIcon.path;
  } catch {
    // Fallback
  }

  if (iconUrl) {
    return new ImageResponse(
      (
        <img
          src={iconUrl}
          width="32"
          height="32"
          style={{ borderRadius: "6px" }}
        />
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#d32f2f",
          borderRadius: "6px",
          color: "white",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
