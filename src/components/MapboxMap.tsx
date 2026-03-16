import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = "pk.eyJ1IjoiZmlkcml2ZXIiLCJhIjoiY21tcGJjbmtzMG9wZjJ3cHNsZ3oxaTYzZiJ9.TmAp9KCag5_-gQ0FsgOyJw";

interface MapboxMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  style?: string;
  showUserMarker?: boolean;
  showPOIs?: boolean;
  onMapReady?: (map: mapboxgl.Map) => void;
}

const MapboxMap = ({
  className = "w-full h-[400px]",
  center,
  zoom = 12,
  style = "mapbox://styles/mapbox/dark-v11",
  showUserMarker = true,
  onMapReady,
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const initializedRef = useRef(false);

  // Initialize map once (use center if available, otherwise a generic world view)
  useEffect(() => {
    if (!mapContainer.current || initializedRef.current) return;

    const initCenter: [number, number] = center || [0, 0];
    const initZoom = center ? zoom : 2;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center: initCenter,
      zoom: initZoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      onMapReady?.(map);
    });

    mapRef.current = map;
    initializedRef.current = true;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  // Fly to new center when it changes
  useEffect(() => {
    if (!mapRef.current || !center) return;

    mapRef.current.flyTo({ center, zoom, duration: 1500 });

    if (showUserMarker) {
      if (markerRef.current) {
        markerRef.current.setLngLat(center);
      } else {
        const el = document.createElement("div");
        el.className = "user-location-marker";
        el.style.cssText = `
          width: 18px; height: 18px; border-radius: 50%;
          background: hsl(217 91% 60%);
          border: 3px solid white;
          box-shadow: 0 0 0 4px hsl(217 91% 60% / 0.3), 0 2px 8px rgba(0,0,0,0.3);
        `;
        markerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(center)
          .addTo(mapRef.current);
      }
    }
  }, [center?.[0], center?.[1], showUserMarker]);

  return <div ref={mapContainer} className={className} />;
};

export default MapboxMap;
