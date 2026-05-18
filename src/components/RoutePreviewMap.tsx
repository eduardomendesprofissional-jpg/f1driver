/// <reference types="google.maps" />
import { useEffect, useRef } from "react";
import { loadGoogleMaps, DARK_MAP_STYLE } from "@/lib/googleMaps";

interface RoutePreviewMapProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  className?: string;
}

const RoutePreviewMap = ({ origin, destination, className = "w-full h-56" }: RoutePreviewMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const fallbackLineRef = useRef<google.maps.Polyline | null>(null);
  const originMarkerRef = useRef<google.maps.Marker | null>(null);
  const destMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !containerRef.current) return;

      const map = new google.maps.Map(containerRef.current, {
        center: origin,
        zoom: 13,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        styles: DARK_MAP_STYLE,
        clickableIcons: false,
        backgroundColor: "#1a1a1a",
      });
      mapRef.current = map;

      // Origin marker (blue dot)
      originMarkerRef.current = new google.maps.Marker({
        position: origin,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#1E90FF",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });

      // Destination marker (pin)
      destMarkerRef.current = new google.maps.Marker({
        position: destination,
        map,
        icon: {
          path: "M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z",
          fillColor: "#1E90FF",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: new google.maps.Point(12, 22),
        },
      });

      const renderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        preserveViewport: false,
        polylineOptions: {
          strokeColor: "#1E90FF",
          strokeOpacity: 0.95,
          strokeWeight: 5,
        },
      });
      rendererRef.current = renderer;

      const service = new google.maps.DirectionsService();
      service.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (cancelled) return;
          if (status === google.maps.DirectionsStatus.OK && result) {
            renderer.setDirections(result);
          } else {
            // Fallback: straight line + fit bounds
            fallbackLineRef.current = new google.maps.Polyline({
              path: [origin, destination],
              map,
              strokeColor: "#1E90FF",
              strokeOpacity: 0.9,
              strokeWeight: 4,
            });
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            map.fitBounds(bounds, 60);
          }
        }
      );
    });

    return () => {
      cancelled = true;
      rendererRef.current?.setMap(null);
      fallbackLineRef.current?.setMap(null);
      originMarkerRef.current?.setMap(null);
      destMarkerRef.current?.setMap(null);
      rendererRef.current = null;
      fallbackLineRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
      mapRef.current = null;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  return <div ref={containerRef} className={className} />;
};

export default RoutePreviewMap;
