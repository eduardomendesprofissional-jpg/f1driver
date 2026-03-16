import { useState, useCallback } from "react";
import { Search, Loader2, MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmlkcml2ZXIiLCJhIjoiY21tcGJjbmtzMG9wZjJ3cHNsZ3oxaTYzZiJ9.TmAp9KCag5_-gQ0FsgOyJw";

interface POIResult {
  id: string;
  name: string;
  address: string;
  category: string;
  center: [number, number];
}

const CATEGORIES = [
  { value: "gas_station", label: "Postos", icon: "⛽" },
  { value: "pharmacy", label: "Farmácias", icon: "💊" },
  { value: "restaurant", label: "Restaurantes", icon: "🍽️" },
  { value: "hospital", label: "Hospitais", icon: "🏥" },
  { value: "shopping", label: "Shopping", icon: "🛒" },
  { value: "hotel", label: "Hotéis", icon: "🏨" },
];

interface MapboxPOISearchProps {
  map: mapboxgl.Map | null;
  center?: [number, number];
}

const MapboxPOISearch = ({ map, center }: MapboxPOISearchProps) => {
  const [results, setResults] = useState<POIResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);

  const clearMarkers = useCallback(() => {
    markers.forEach((m) => m.remove());
    setMarkers([]);
  }, [markers]);

  const searchCategory = useCallback(
    async (category: string) => {
      if (!map || !center) return;

      if (activeCategory === category) {
        clearMarkers();
        setResults([]);
        setActiveCategory(null);
        return;
      }

      setLoading(true);
      setActiveCategory(category);
      clearMarkers();

      try {
        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          language: "pt-BR",
          country: "BR",
          limit: "10",
          types: "poi",
          proximity: `${center[0]},${center[1]}`,
        });

        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(category)}.json?${params}`
        );
        const data = await res.json();

        const pois: POIResult[] = (data.features || []).map((f: any) => ({
          id: f.id,
          name: f.text || f.place_name,
          address: f.place_name,
          category,
          center: f.center as [number, number],
        }));

        setResults(pois);

        // Add markers to map
        const newMarkers = pois.map((poi) => {
          const el = document.createElement("div");
          el.style.cssText = `
            width: 32px; height: 32px; border-radius: 50%;
            background: hsl(var(--primary));
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; cursor: pointer;
          `;
          const catInfo = CATEGORIES.find((c) => c.value === category);
          el.textContent = catInfo?.icon || "📍";

          const popup = new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML(
            `<div style="padding:4px 8px;"><strong style="font-size:13px;">${poi.name}</strong><br/><span style="font-size:11px;color:#888;">${poi.address}</span></div>`
          );

          return new mapboxgl.Marker({ element: el })
            .setLngLat(poi.center)
            .setPopup(popup)
            .addTo(map);
        });

        setMarkers(newMarkers);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [map, center, activeCategory, clearMarkers]
  );

  const handleClear = () => {
    clearMarkers();
    setResults([]);
    setActiveCategory(null);
  };

  return (
    <div className="space-y-3">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => searchCategory(cat.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-foreground border-border hover:bg-muted"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
        {activeCategory && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
          >
            <X size={12} />
            Limpar
          </button>
        )}
        {loading && <Loader2 size={14} className="animate-spin text-muted-foreground self-center" />}
      </div>

      {/* Results list */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
          {results.map((poi) => (
            <button
              key={poi.id}
              onClick={() => map?.flyTo({ center: poi.center, zoom: 16, duration: 800 })}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border hover:bg-muted/60 transition-colors text-left"
            >
              <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{poi.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{poi.address}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapboxPOISearch;
