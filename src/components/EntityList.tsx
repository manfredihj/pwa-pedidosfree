"use client";

import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import type { GroupEntity } from "@/lib/api";

interface EntityListProps {
  entities: GroupEntity[];
  groupImages?: { name: string; path: string; keyname: string; category?: string }[];
  onSelect: (entity: GroupEntity) => void;
}

export default function EntityList({ entities, groupImages, onSelect }: EntityListProps) {
  return (
    <Box sx={{ px: 2, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Elegí tu local
      </Typography>
      {entities.map((entity) => {
        const logo = entity.entityimages.find((img) => img.keyname === "Logo");
        const headerImg =
          entity.entityimages.find((img) => img.keyname === "header_mobile") ??
          groupImages?.find((img) => img.keyname === "header_mobile") ??
          logo;
        const isOpen = entity.scheduledata.status.isopen;
        const hasOnlinePayment = entity.attributesbuilder.typeofpayment?.some(
          (p) => p.subtype === "PAYMENT-ONLINE" && p.active !== false,
        );

        return (
          <Card key={entity.identity} sx={{ borderRadius: 3, overflow: "hidden" }} elevation={2}>
            <CardActionArea onClick={() => onSelect(entity)}>
              {/* Header image */}
              <Box
                sx={{
                  height: 160,
                  backgroundImage: headerImg ? `url(${headerImg.path})` : undefined,
                  backgroundColor: headerImg ? undefined : "grey.300",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                }}
              >
                {/* Status chip over image */}
                <Chip
                  label={isOpen ? "Abierto" : "Cerrado"}
                  size="small"
                  color={isOpen ? "success" : "error"}
                  variant="filled"
                  sx={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    fontWeight: 600,
                  }}
                />
                {hasOnlinePayment && (
                  <Chip
                    label="Pago online"
                    size="small"
                    color="primary"
                    variant="filled"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>

              {/* Info section */}
              <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5 }}>
                {logo && (
                  <Avatar
                    src={logo.path}
                    alt={entity.name}
                    variant="rounded"
                    sx={{
                      width: 48,
                      height: 48,
                      mr: 1.5,
                      border: "2px solid",
                      borderColor: "divider",
                      mt: -4,
                      backgroundColor: "background.paper",
                    }}
                  />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {entity.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {entity.street} {entity.streetnumber} · {entity.area.name}
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}
