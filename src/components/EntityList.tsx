import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import type { GroupEntity } from "@/lib/api";

interface EntityListProps {
  entities: GroupEntity[];
}

export default function EntityList({ entities }: EntityListProps) {
  return (
    <Box sx={{ px: 2, py: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Elegí tu local
      </Typography>
      <Grid container spacing={2}>
        {entities.map((entity) => {
          const logo = entity.entityimages.find((img) => img.keyname === "Logo");
          const isOpen = entity.scheduledata.status.isopen;

          return (
            <Grid key={entity.identity} size={{ xs: 12, sm: 6 }}>
              <Card sx={{ display: "flex", alignItems: "center", p: 1.5 }}>
                {logo && (
                  <CardMedia
                    component="img"
                    sx={{ width: 60, height: 60, borderRadius: 1, objectFit: "cover", mr: 2 }}
                    image={logo.path}
                    alt={entity.name}
                  />
                )}
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 }, flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {entity.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {entity.street} {entity.streetnumber}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={isOpen ? "Abierto" : "Cerrado"}
                      size="small"
                      color={isOpen ? "success" : "default"}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
