import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { nearbyGooglePlaces } from "@/lib/googleMaps";

const CATEGORIES = [
  { value: "restaurant", label: "Restaurantes", icon: "🍽️", googleType: "restaurant" },
  { value: "gas_station", label: "Postos", icon: "⛽", googleType: "gas_station" },
  { value: "pharmacy", label: "Farmácias", icon: "💊", googleType: "pharmacy" },
  { value: "shopping_mall", label: "Lojas", icon: "🛒", googleType: "shopping_mall" },
  { value: "hospital", label: "Hospitais", icon: "🏥", googleType: "hospital" },
  { value: "bank", label: "Bancos", icon: "🏦", googleType: "bank" },
];

interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  category: string;
  center: [number, number];
  distance?: string;
}

interface NearbyPlacesProps {
  userPosition?: { lat: number; lng: number } | null;
  onSelectPlace?: (place: NearbyPlace) => void;
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

const NearbyPlaces = ({ userPosition, onSelectPlace }: NearbyPlacesProps) => {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const searchNearby = useCallback(async (category: string) => {
    if (!userPosition) return;
    if (activeCategory === category) {
      setActiveCategory(null);
      setPlaces([]);
      return;
    }
    setActiveCategory(category);
    setLoading(true);

    const cat = CATEGORIES.find(c => c.value === category);
    try {
      const results = await nearbyGooglePlaces(cat?.googleType || category, userPosition.lat, userPosition.lng, 5000);
      const mapped: NearbyPlace[] = results.map((r) => ({
        id: r.id,
        name: r.displayName || r.formattedAddress,
        address: r.formattedAddress,
        category,
        center: [r.lng, r.lat],
        distance: getDistance(userPosition.lat, userPosition.lng, r.lat, r.lng),
      }));
      setPlaces(mapped);
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [userPosition, activeCategory]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estabelecimentos próximos</p>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => searchNearby(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeCategory === cat.value
                ? "bg-foreground text-background border-foreground"
                : "bg-secondary text-foreground border-border hover:bg-muted"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-3">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {places.length > 0 && (
        <div className="space-y-1 max-h-[180px] overflow-y-auto">
          {places.map((place) => (
            <button
              key={place.id}
              onClick={() => onSelectPlace?.(place)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0">
                {CATEGORIES.find((c) => c.value === place.category)?.icon || "📍"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{place.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{place.address}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{place.distance}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyPlaces;
