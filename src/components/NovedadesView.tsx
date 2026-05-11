"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import NewReleasesOutlinedIcon from "@mui/icons-material/NewReleasesOutlined";
import { fetchNovedades, type Novedad } from "@/lib/api";

interface NovedadesViewProps {
  entityId: number;
  basepathimage: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function NovedadesView({ entityId, basepathimage }: NovedadesViewProps) {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchNovedades(entityId)
      .then((data) => {
        if (!cancelled) setNovedades(data);
      })
      .catch(() => {
        if (!cancelled) setNovedades([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [entityId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (novedades.length === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, px: 2 }}>
        <NewReleasesOutlinedIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Novedades
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          No hay novedades.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {novedades.map((n) => (
        <Card key={n.idnotification} elevation={2}>
          {n.imagepath && (
            <CardMedia
              component="img"
              image={n.imagepath}
              alt={n.title}
              sx={{ maxHeight: 300, objectFit: "cover" }}
            />
          )}
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold">
              {n.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {n.description}
            </Typography>
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 1, textAlign: "right" }}>
              {formatDate(n.insertdate)}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
