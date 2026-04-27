"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

export interface ResolvedAddress {
  street: string;
  streetnumber: string;
  fullname: string;
  areaname: string;
  latitude: number;
  longitude: number;
  placeid: string;
}

interface AddressSearchProps {
  countryCode?: string;
  onSelect: (address: ResolvedAddress) => void;
  onBack: () => void;
}

export default function AddressSearch({ countryCode = "AR", onSelect, onBack }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
    }
    // Focus input on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const searchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input,
        types: ["geocode"],
        componentRestrictions: { country: countryCode },
      },
      (results, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      },
    );
  }, [countryCode]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPredictions(value), 300);
  };

  const getAddressComponent = (
    result: google.maps.GeocoderResult,
    type: string,
  ): string | null => {
    for (const component of result.address_components) {
      if (component.types.includes(type)) {
        return component.short_name || component.long_name;
      }
    }
    return null;
  };

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!geocoder.current) return;

    setResolving(true);
    geocoder.current.geocode({ placeId: prediction.place_id }, (results, status) => {
      setResolving(false);
      if (status !== window.google.maps.GeocoderStatus.OK || !results || results.length === 0) return;

      const result = results[0];
      const street = getAddressComponent(result, "route") || "";
      const streetnumber = getAddressComponent(result, "street_number") || "";
      const areaname = getAddressComponent(result, "locality")
        || getAddressComponent(result, "administrative_area_level_2")
        || getAddressComponent(result, "political")
        || "";
      const location = result.geometry.location;

      onSelect({
        street,
        streetnumber,
        fullname: result.formatted_address,
        areaname,
        latitude: location.lat(),
        longitude: location.lng(),
        placeid: prediction.place_id,
      });
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.paper" }}>
      {/* Header with search input */}
      <Box sx={{ px: 1, pt: 1.5, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
          <IconButton onClick={onBack} edge="start">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Agregar dirección
          </Typography>
        </Box>

        {/* Search input */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mx: 1,
            px: 2,
            py: 0.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "grey.50",
          }}
        >
          <InputBase
            inputRef={inputRef}
            placeholder="Ej: Av. Corrientes 1234"
            fullWidth
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            sx={{ fontSize: "1rem" }}
          />
          {query && (
            <IconButton size="small" onClick={() => { setQuery(""); setPredictions([]); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Loading */}
      {(loading || resolving) && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {/* Predictions list */}
      {!resolving && predictions.length > 0 && (
        <List disablePadding>
          {predictions.map((prediction) => (
            <ListItemButton
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              sx={{ px: 3, py: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LocationOnOutlinedIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary={prediction.structured_formatting.main_text}
                secondary={prediction.structured_formatting.secondary_text}
              />
            </ListItemButton>
          ))}
        </List>
      )}

      {/* No results */}
      {!loading && !resolving && query.length >= 3 && predictions.length === 0 && (
        <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No se encontraron resultados para "{query}"
          </Typography>
        </Box>
      )}
    </Box>
  );
}
