import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/lib/mapbox";

mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapboxMapProps {
  className?: string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  showUserMarker?: boolean;
  onMapReady?: (map: any) => void;
}

const GoogleMap = ({
  className = "w-full h-[400px]",
  center,
  zoom = 15,
  showUserMarker = true,
  onMapReady,
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initCenter: [number, number] = center || [-47.9292, -15.7801];

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      center: initCenter,
      zoom: center ? zoom : 4,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      mapRef.current = map;
      setLoaded(true);
      onMapReady?.(map as any);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !center || !loaded) return;

    mapRef.current.flyTo({ center, zoom, duration: 800 });

    if (showUserMarker) {
      if (markerRef.current) {
        markerRef.current.setLngLat(center);
      } else {
        // Blue pulsing marker for driver position
        const el = document.createElement("div");
        el.style.width = "18px";
        el.style.height = "18px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#276EF1";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 0 8px rgba(39,110,241,0.6)";
        el.style.animation = "pulse-blue 2s infinite";

        markerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(center)
          .addTo(mapRef.current);
      }
    }
  }, [center?.[0], center?.[1], showUserMarker, loaded]);

  return (
    <>
      <style>{`
        @keyframes pulse-blue {
          0% { box-shadow: 0 0 0 0 rgba(39,110,241,0.5); }
          70% { box-shadow: 0 0 0 12px rgba(39,110,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(39,110,241,0); }
        }
      `}</style>
      <div ref={mapContainer} className={className} />
    </>
  );
};

export default GoogleMap;
