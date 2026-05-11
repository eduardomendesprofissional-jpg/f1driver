import { useEffect, useRef, useState, useCallback } from "react";
import { Crosshair } from "lucide-react";
import { loadGoogleMaps, DARK_MAP_STYLE } from "@/lib/googleMaps";

interface GoogleMapProps {
  className?: string;
  center?: [number, number]; // [lng, lat] — mantido para compatibilidade
  zoom?: number;
  showUserMarker?: boolean;
  onMapReady?: (map: google.maps.Map) => void;
}

const GoogleMap = ({
  className = "w-full h-[400px]",
  center,
  zoom = 15,
  showUserMarker = true,
  onMapReady,
}: GoogleMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const initialCenterDone = useRef(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    let cancelled = false;

    const initCenter = center
      ? { lat: center[1], lng: center[0] }
      : { lat: -15.7801, lng: -47.9292 };

    loadGoogleMaps().then(() => {
      if (cancelled || !mapContainer.current) return;
      const map = new google.maps.Map(mapContainer.current, {
        center: initCenter,
        zoom: center ? zoom : 4,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
        gestureHandling: "greedy",
        styles: DARK_MAP_STYLE,
        clickableIcons: false,
        backgroundColor: "#1a1a1a",
      });
      mapRef.current = map;
      setLoaded(true);
      onMapReady?.(map);
    });

    return () => {
      cancelled = true;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
    };
  }, []);

  // Center + marker updates
  useEffect(() => {
    if (!mapRef.current || !center || !loaded) return;
    const pos = { lat: center[1], lng: center[0] };

    if (!initialCenterDone.current) {
      mapRef.current.panTo(pos);
      mapRef.current.setZoom(zoom);
      initialCenterDone.current = true;
    }

    if (showUserMarker) {
      if (markerRef.current) {
        markerRef.current.setPosition(pos);
      } else {
        markerRef.current = new google.maps.Marker({
          position: pos,
          map: mapRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#276EF1",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });
      }
    }
  }, [center?.[0], center?.[1], showUserMarker, loaded]);

  const handleRecenter = useCallback(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.panTo({ lat: center[1], lng: center[0] });
    mapRef.current.setZoom(zoom);
  }, [center, zoom]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={className} />
      {center && loaded && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-20 right-3 z-30 p-2.5 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg hover:bg-card transition-colors cursor-pointer"
          title="Centralizar no mapa"
          type="button"
        >
          <Crosshair size={20} className="text-primary" />
        </button>
      )}
    </div>
  );
};

export default GoogleMap;
