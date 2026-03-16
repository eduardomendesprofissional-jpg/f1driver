import { useEffect, useRef, useState } from "react";
import { getGoogleMapsLoader } from "@/lib/google-maps";

interface GoogleMapProps {
  className?: string;
  center?: [number, number]; // [lng, lat] to maintain same interface
  zoom?: number;
  showUserMarker?: boolean;
  onMapReady?: (map: google.maps.Map) => void;
}

const GoogleMap = ({
  className = "w-full h-[400px]",
  center,
  zoom = 12,
  showUserMarker = true,
  onMapReady,
}: GoogleMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const pulseOverlayRef = useRef<google.maps.OverlayView | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const loader = getGoogleMapsLoader();
    
    loader.importLibrary("maps").then(() => {
      loader.importLibrary("marker").then(() => {
        if (!mapContainer.current || mapRef.current) return;

        const initCenter = center 
          ? { lat: center[1], lng: center[0] } 
          : { lat: -15.7801, lng: -47.9292 }; // Brasilia default

        const map = new google.maps.Map(mapContainer.current, {
          center: initCenter,
          zoom: center ? zoom : 4,
          disableDefaultUI: true,
          zoomControl: true,
          mapId: "f1driver_dark_map",
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
            { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
            { featureType: "land", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
            { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
          ],
        });

        mapRef.current = map;
        setLoaded(true);
        onMapReady?.(map);
      });
    });

    return () => {
      mapRef.current = null;
      markerRef.current = null;
      pulseOverlayRef.current = null;
    };
  }, []);

  // Update center and marker
  useEffect(() => {
    if (!mapRef.current || !center || !loaded) return;

    const pos = { lat: center[1], lng: center[0] };
    mapRef.current.panTo(pos);
    mapRef.current.setZoom(zoom);

    if (showUserMarker) {
      if (markerRef.current) {
        markerRef.current.position = pos;
      } else {
        // Create pulsing blue dot marker
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="position:relative;width:20px;height:20px;">
            <div style="
              width:20px;height:20px;border-radius:50%;
              background:#276EF1;
              border:3px solid white;
              box-shadow:0 0 0 6px rgba(39,110,241,0.25), 0 2px 12px rgba(0,0,0,0.4);
              position:relative;z-index:2;
            "></div>
            <div style="
              position:absolute;inset:-6px;border-radius:50%;
              background:rgba(39,110,241,0.15);
              animation:gmap-pulse 2s ease-out infinite;
              z-index:1;
            "></div>
          </div>
        `;

        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: pos,
          content: el,
        });
      }
    }
  }, [center?.[0], center?.[1], showUserMarker, loaded]);

  return (
    <>
      <style>{`
        @keyframes gmap-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
      <div ref={mapContainer} className={className} />
    </>
  );
};

export default GoogleMap;
