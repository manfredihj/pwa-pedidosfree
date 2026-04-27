"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import type { ResolvedAddress } from "@/components/AddressSearch";
import type { EntityDeliveryZone } from "@/lib/api";
import { checkDeliveryZone } from "@/lib/deliveryZones";

interface AddressMapConfirmProps {
  address: ResolvedAddress;
  entityDeliveryZones: EntityDeliveryZone[];
  onConfirm: (updated: ResolvedAddress, identitydeliveryzone: number | null) => void;
  onBack: () => void;
}

export default function AddressMapConfirm({ address, entityDeliveryZones, onConfirm, onBack }: AddressMapConfirmProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  const [currentAddress, setCurrentAddress] = useState<ResolvedAddress>(address);
  const [showTip, setShowTip] = useState(true);
  const [zoneResult, setZoneResult] = useState(() =>
    checkDeliveryZone(address.latitude, address.longitude, entityDeliveryZones),
  );
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  const updateZone = useCallback((lat: number, lng: number) => {
    setZoneResult(checkDeliveryZone(lat, lng, entityDeliveryZones));
  }, [entityDeliveryZones]);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!geocoder.current) geocoder.current = new google.maps.Geocoder();
    geocoder.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const result = results[0];
          const getComp = (type: string) => {
            for (const c of result.address_components) {
              if (c.types.includes(type)) return c.short_name || c.long_name;
            }
            return "";
          };
          setCurrentAddress({
            street: getComp("route"),
            streetnumber: getComp("street_number"),
            fullname: result.formatted_address,
            areaname: getComp("locality") || getComp("administrative_area_level_2") || getComp("political"),
            latitude: lat,
            longitude: lng,
            placeid: result.place_id,
          });
        }
      },
    );
    updateZone(lat, lng);
  }, [updateZone]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const center = { lat: address.latitude, lng: address.longitude };

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 16,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
    });

    // Draw delivery zone polygons
    for (const zone of entityDeliveryZones) {
      const coords = zone.polygondrawarray.split(";").map((pair) => {
        const [latStr, lngStr] = pair.split(",");
        return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
      });
      new google.maps.Polygon({
        paths: coords,
        map: mapInstance.current,
        strokeColor: "#1976d2",
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: "#1976d2",
        fillOpacity: 0.08,
      });
    }

    markerInstance.current = new google.maps.Marker({
      position: center,
      map: mapInstance.current,
      draggable: true,
    });

    markerInstance.current.addListener("dragend", () => {
      const pos = markerInstance.current?.getPosition();
      if (pos) {
        reverseGeocode(pos.lat(), pos.lng());
      }
    });
  }, [address.latitude, address.longitude, entityDeliveryZones, reverseGeocode]);

  const isOutside = entityDeliveryZones.length > 0 && !zoneResult.isInside;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "background.paper" }}>
      {/* Back button over map */}
      <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
        <IconButton
          onClick={onBack}
          sx={{ bgcolor: "background.paper", boxShadow: 2, "&:hover": { bgcolor: "grey.100" } }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      {/* Map */}
      <Box
        ref={mapRef}
        sx={{ flex: 1, minHeight: 0, position: "relative" }}
      />

      {/* Tip or warning banner */}
      {(showTip || isOutside) && (
        <Box
          sx={{
            position: "absolute",
            bottom: 200,
            left: 16,
            right: 16,
            zIndex: 10,
          }}
        >
          {isOutside ? (
            <Alert
              severity="error"
              icon={<ErrorOutlineIcon />}
              sx={{ borderRadius: 2, boxShadow: 2 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Fuera de la zona de entrega
              </Typography>
              <Typography variant="caption">
                La dirección seleccionada está fuera del área de cobertura. Podés ajustar el pin dentro de la zona.
              </Typography>
            </Alert>
          ) : showTip ? (
            <Alert
              severity="info"
              icon={<InfoOutlinedIcon />}
              onClose={() => setShowTip(false)}
              sx={{ borderRadius: 2, boxShadow: 2 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ¿El pin está bien ubicado?
              </Typography>
              <Typography variant="caption">
                Si no coincide con tu dirección, ajustalo manualmente.
              </Typography>
            </Alert>
          ) : null}
        </Box>
      )}

      {/* Bottom panel */}
      <Box
        sx={{
          px: 2,
          py: 2.5,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, textAlign: "center" }}>
          Confirmá tu dirección
        </Typography>

        {/* Address display */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Typography variant="body1" sx={{ flex: 1 }}>
            {currentAddress.street} {currentAddress.streetnumber}
            {currentAddress.street ? "" : currentAddress.fullname}
          </Typography>
          <SearchIcon color="action" />
        </Box>

        <Button
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          disabled={isOutside}
          onClick={() => onConfirm(currentAddress, zoneResult.identitydeliveryzone)}
          sx={{ borderRadius: 6, fontWeight: 700, py: 1.5 }}
        >
          {isOutside ? "Fuera de zona de entrega" : "Confirmar"}
        </Button>
      </Box>
    </Box>
  );
}
