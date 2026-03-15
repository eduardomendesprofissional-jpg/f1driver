import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Loader2, Clock, RotateCcw } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import MapboxMap from "@/components/MapboxMap";
import { useMapboxSearch, MapboxPlace } from "@/hooks/useMapboxSearch";
import { useSavedRoutes, SavedRoute } from "@/hooks/useSavedRoutes";

const PassengerHome = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; endereco: string } | null>(null);
  const { results, loading, search, clear } = useMapboxSearch();
  const { routes: savedRoutes, saveRoute } = useSavedRoutes();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Get user location on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
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
    // Save route
    saveRoute({
      origem_endereco: userLocation.endereco,
      origem_lat: userLocation.lat,
      origem_lng: userLocation.lng,
      destino_endereco: place.place_name,
      destino_lat: place.center[1],
      destino_lng: place.center[0],
    });
    navigate("/ride-confirm", {
      state: {
        origem: { endereco: userLocation.endereco, lat: userLocation.lat, lng: userLocation.lng },
        destino: { endereco: place.place_name, lat: place.center[1], lng: place.center[0] },
      },
    });
  };

  const handleSelectSavedRoute = (route: SavedRoute) => {
    if (!userLocation) return;
    // Update saved route usage
    saveRoute({
      origem_endereco: userLocation.endereco,
      origem_lat: userLocation.lat,
      origem_lng: userLocation.lng,
      destino_endereco: route.destino_endereco,
      destino_lat: route.destino_lat,
      destino_lng: route.destino_lng,
    });
    navigate("/ride-confirm", {
      state: {
        origem: { endereco: userLocation.endereco, lat: userLocation.lat, lng: userLocation.lng },
        destino: { endereco: route.destino_endereco, lat: route.destino_lat, lng: route.destino_lng },
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

        {/* Current location */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sua localização</p>
          <div className="flex items-center gap-2 mt-2">
            <MapPin size={14} className="text-primary shrink-0" />
            <p className="text-sm text-foreground truncate">
              {userLocation?.endereco || "Obtendo localização..."}
            </p>
          </div>
        </div>

        {/* Saved routes */}
        {savedRoutes.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Rotas recentes</p>
            <div className="space-y-1">
              {savedRoutes.slice(0, 3).map((route) => (
                <button
                  key={route.id}
                  onClick={() => handleSelectSavedRoute(route)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                >
                  <RotateCcw size={16} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{route.destino_endereco}</p>
                    <p className="text-[10px] text-muted-foreground">{route.vezes_usado}x utilizada</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
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
              {/* Show saved routes when search is empty */}
              {destination.length < 3 && savedRoutes.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Rotas recentes</p>
                  <div className="space-y-1">
                    {savedRoutes.map((route) => (
                      <button
                        key={route.id}
                        onClick={() => handleSelectSavedRoute(route)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                      >
                        <Clock size={16} className="text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{route.destino_endereco}</p>
                          <p className="text-[10px] text-muted-foreground">{route.vezes_usado}x utilizada</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
              ) : destination.length >= 3 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum resultado encontrado.</p>
              ) : savedRoutes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Digite pelo menos 3 caracteres.</p>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav active="home" role="passenger" />
    </div>
  );
};

export default PassengerHome;
