/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadGoogleMaps, DARK_MAP_STYLE, reverseGeocode } from "@/lib/googleMaps";

interface MapPickerProps {
  initialCenter?: [number, number]; // [lng, lat]
  onConfirm: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
  maxDistanceKm?: number;
  userPosition?: { lat: number; lng: number } | null;
  mode?: "origem" | "destino";
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MapPicker = ({
  initialCenter,
  onConfirm,
  onClose,
  maxDistanceKm = 25,
  userPosition,
  mode = "destino",
}: MapPickerProps) => {
  const isOrigem = mode === "origem";
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [address, setAddress] = useState("Mova o mapa para selecionar");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [distanceText, setDistanceText] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const updateFromCenter = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const name = await reverseGeocode(lat, lng);
      setAddress(name);
    } finally {
      setLoading(false);
    }
    if (userPosition && !isOrigem) {
      const dist = haversineKm(userPosition.lat, userPosition.lng, lat, lng);
      setDistanceText(dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`);
      setBlocked(dist > maxDistanceKm);
    }
  }, [userPosition, maxDistanceKm, isOrigem]);

  useEffect(() => {
    if (!mapContainer.current) return;
    let cancelled = false;

    const center = initialCenter
      ? { lat: initialCenter[1], lng: initialCenter[0] }
      : { lat: -15.7801, lng: -47.9292 };

    loadGoogleMaps().then(() => {
      if (cancelled || !mapContainer.current) return;
      const map = new google.maps.Map(mapContainer.current, {
        center,
        zoom: initialCenter ? 15 : 4,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
        gestureHandling: "greedy",
        styles: DARK_MAP_STYLE,
        clickableIcons: false,
      });
      mapRef.current = map;

      if (initialCenter) updateFromCenter(initialCenter[1], initialCenter[0]);

      map.addListener("idle", () => {
        const c = map.getCenter();
        if (!c) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          updateFromCenter(c.lat(), c.lng());
        }, 400);
      });
    });

    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, []);

  const handleConfirm = () => {
    if (!mapRef.current || blocked) return;
    const c = mapRef.current.getCenter();
    if (!c) return;
    onConfirm(c.lat(), c.lng(), address);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <div className="flex-1 bg-card/90 backdrop-blur-md border border-border rounded-xl px-4 py-2.5 shadow-lg">
          <p className="text-xs text-muted-foreground">Destino selecionado</p>
          <p className="text-sm text-foreground truncate flex items-center gap-1.5">
            {loading ? (
              <Loader2 size={14} className="animate-spin text-primary" />
            ) : (
              <MapPin size={14} className={blocked ? "text-destructive" : "text-primary"} />
            )}
            {address}
          </p>
        </div>
      </div>

      <div ref={mapContainer} className="flex-1 w-full h-full" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="flex flex-col items-center -mt-10">
          <MapPin size={40} className={`drop-shadow-lg ${blocked ? "text-destructive" : "text-primary"}`} />
          <div className="w-2 h-2 rounded-full bg-foreground/30 mt-1" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6">
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground font-medium truncate flex-1">{address}</p>
            {distanceText && (
              <span className={`text-xs font-semibold ml-2 ${blocked ? "text-destructive" : "text-primary"}`}>
                {distanceText}
              </span>
            )}
          </div>
          {blocked && (
            <p className="text-xs text-destructive font-medium">
              Destino acima de {maxDistanceKm} km — indisponível para corrida
            </p>
          )}
          <Button
            onClick={handleConfirm}
            disabled={loading || blocked}
            className="w-full h-12 font-bold text-base"
          >
            <Check size={18} className="mr-2" />
            Confirmar destino
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MapPicker;
