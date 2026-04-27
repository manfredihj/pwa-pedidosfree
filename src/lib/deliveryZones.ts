import type { EntityDeliveryZone } from "./api";

interface ZoneResult {
  isInside: boolean;
  identitydeliveryzone: number | null;
  shippingcost: number;
}

/**
 * Check if a lat/lng point falls inside any of the entity's delivery zones.
 * Uses Google Maps geometry library.
 */
export function checkDeliveryZone(
  lat: number,
  lng: number,
  zones: EntityDeliveryZone[],
): ZoneResult {
  if (!window.google?.maps?.geometry) {
    return { isInside: false, identitydeliveryzone: null, shippingcost: 0 };
  }

  const location = new google.maps.LatLng(lat, lng);

  for (const zone of zones) {
    const coords = zone.polygondrawarray.split(";").map((pair) => {
      const [latStr, lngStr] = pair.split(",");
      return new google.maps.LatLng(parseFloat(latStr), parseFloat(lngStr));
    });

    const polygon = new google.maps.Polygon({ paths: coords });

    if (google.maps.geometry.poly.containsLocation(location, polygon)) {
      return {
        isInside: true,
        identitydeliveryzone: zone.identitydeliveryzone,
        shippingcost: zone.shippingcost ?? 0,
      };
    }
  }

  return { isInside: false, identitydeliveryzone: null, shippingcost: 0 };
}
