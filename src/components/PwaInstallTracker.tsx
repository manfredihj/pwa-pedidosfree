"use client";

import { useEffect } from "react";
import { trackPwaInstall } from "@/lib/api";

interface PwaInstallTrackerProps {
  slug: string;
}

export default function PwaInstallTracker({ slug }: PwaInstallTrackerProps) {
  useEffect(() => {
    const handler = () => {
      console.log("[PWA] App installed! Tracking for slug:", slug);
      trackPwaInstall(slug).catch((err) => console.error("[PWA] Track error:", err));
    };
    console.log("[PWA] Install tracker listening for slug:", slug);

    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, [slug]);

  return null;
}
