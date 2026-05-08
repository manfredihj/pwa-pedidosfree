"use client";

import { useEffect } from "react";
import { trackPwaInstall } from "@/lib/api";

interface PwaInstallTrackerProps {
  slug: string;
}

export default function PwaInstallTracker({ slug }: PwaInstallTrackerProps) {
  useEffect(() => {
    const handler = () => {
      trackPwaInstall(slug).catch(() => {});
    };

    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, [slug]);

  return null;
}
