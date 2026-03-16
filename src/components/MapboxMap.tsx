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
  style = "mapbox://styles/mapbox/navigation-night-v1",
  showUserMarker = true,
  showPOIs = false,
  onMapReady,
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!mapContainer.current || initializedRef.current) return;

    const initCenter: [number, number] = center || [0, 0];
    const initZoom = center ? zoom : 2;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center: initCenter,
      zoom: initZoom,
      attributionControl: false,
      logoPosition: "bottom-left",
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      if (showPOIs) {
        const poiLayers = map.getStyle().layers?.filter(
          (l) => l.id.includes("poi") || l.id.includes("label")
        );
        poiLayers?.forEach((l) => {
          try { map.setLayoutProperty(l.id, "visibility", "visible"); } catch {}
        });
      }
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

  useEffect(() => {
    if (!mapRef.current || !center) return;

    mapRef.current.flyTo({ center, zoom, duration: 1500 });

    if (showUserMarker) {
      if (markerRef.current) {
        markerRef.current.setLngLat(center);
      } else {
        // Uber-style pulsing blue dot
        const el = document.createElement("div");
        el.className = "uber-user-marker";
        el.innerHTML = `
          <div style="
            width: 20px; height: 20px; border-radius: 50%;
            background: #276EF1;
            border: 3px solid white;
            box-shadow: 0 0 0 6px rgba(39,110,241,0.25), 0 2px 12px rgba(0,0,0,0.4);
            position: relative;
          ">
            <div style="
              position: absolute; inset: -6px; border-radius: 50%;
              background: rgba(39,110,241,0.15);
              animation: uber-pulse 2s ease-out infinite;
            "></div>
          </div>
        `;
        markerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(center)
          .addTo(mapRef.current);
      }
    }
  }, [center?.[0], center?.[1], showUserMarker]);

  return (
    <>
      <style>{`
        @keyframes uber-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
      <div ref={mapContainer} className={className} />
    </>
  );
};

export default MapboxMap;
