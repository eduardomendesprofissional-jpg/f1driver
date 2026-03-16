import { useEffect, useRef, useState } from "react";
import { loadMapsLibrary } from "@/lib/google-maps";

interface GoogleMapProps {
  className?: string;
  center?: [number, number]; // [lng, lat]
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
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    loadMapsLibrary().then(() => {
      if (!mapContainer.current || mapRef.current) return;

      const initCenter = center
        ? { lat: center[1], lng: center[0] }
        : { lat: -15.7801, lng: -47.9292 };

      const map = new google.maps.Map(mapContainer.current, {
        center: initCenter,
        zoom: center ? zoom : 4,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#0a0f1e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0a0f1e" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a2744" }] },
          { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#1e3a6e" }] },
          { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0d47a1" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#001133" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
          { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#4fc3f7" }] },
        ],
      });

      mapRef.current = map;
      setLoaded(true);
      onMapReady?.(map);
    });

    return () => {
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !center || !loaded) return;

    const pos = { lat: center[1], lng: center[0] };
    mapRef.current.panTo(pos);
    mapRef.current.setZoom(zoom);

    if (showUserMarker) {
      if (markerRef.current) {
        markerRef.current.setPosition(pos);
      } else {
        markerRef.current = new google.maps.Marker({
          map: mapRef.current,
          position: pos,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <circle cx="12" cy="12" r="8" fill="#276EF1" stroke="white" stroke-width="3"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          },
        });
      }
    }
  }, [center?.[0], center?.[1], showUserMarker, loaded]);

  return <div ref={mapContainer} className={className} />;
};

export default GoogleMap;
