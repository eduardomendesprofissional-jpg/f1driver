import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import MapboxMap from "@/components/MapboxMap";
import { useMapboxSearch, MapboxPlace } from "@/hooks/useMapboxSearch";

const PassengerHome = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; endereco: string } | null>(null);
  const { results, loading, search, clear } = useMapboxSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Get user location on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoiZmlkcml2ZXIiLCJhIjoiY21tcGJjbmtzMG9wZjJ3cHNsZ3oxaTYzZiJ9.TmAp9KCag5_-gQ0FsgOyJw&language=pt-BR&limit=1`
          );
          const data = await res.json();
          const name = data.features?.[0]?.place_name || "Sua localização";
          setUserLocation({ lat: latitude, lng: longitude, endereco: name });
        } catch {
          setUserLocation({ lat: latitude, lng: longitude, endereco: "Sua localização" });
        }
      },
      () => {
        // Default to Recife
        setUserLocation({ lat: -8.05, lng: -35.73, endereco: "Recife, PE" });
      }
    );
  }, []);

  const handleSearch = (q: string) => {
    setDestination(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(q, userLocation ? [userLocation.lng, userLocation.lat] : undefined);
    }, 350);
  };

  const handleSelectPlace = (place: MapboxPlace) => {
    if (!userLocation) return;
    // Navigate to ride-confirm with origin + destination
    navigate("/ride-confirm", {
      state: {
        origem: { endereco: userLocation.endereco, lat: userLocation.lat, lng: userLocation.lng },
        destino: { endereco: place.place_name, lat: place.center[1], lng: place.center[0] },
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Real Map */}
      <div className="flex-1 relative overflow-hidden">
        <MapboxMap
          className="absolute inset-0 w-full h-full"
          zoom={14}
          center={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
        />
      </div>

      {/* Bottom Search Panel */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-card border-t border-border rounded-t-2xl p-5 pb-24"
      >
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-3 bg-secondary rounded-xl px-4 py-4 text-left"
        >
          <Search size={20} className="text-primary" />
          <span className="text-muted-foreground font-medium">Para onde?</span>
        </button>

        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sua localização</p>
          <p className="text-sm text-muted-foreground text-center py-4">
            {userLocation?.endereco || "Obtendo localização..."}
          </p>
        </div>
      </motion.div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={() => { setSearchOpen(false); clear(); setDestination(""); }} className="text-foreground p-2">✕</button>
                <h2 className="text-lg font-bold">Para onde?</h2>
              </div>
              <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground truncate">
                  {userLocation?.endereco || "Sua localização"}
                </span>
              </div>
              <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
                <MapPin size={14} className="text-primary" />
                <input
                  autoFocus
                  value={destination}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Digite o destino"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {loading && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                    >
                      <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{place.place_name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {destination.length < 3 ? "Digite pelo menos 3 caracteres." : "Nenhum resultado encontrado."}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav active="home" role="passenger" />
    </div>
  );
};

export default PassengerHome;
