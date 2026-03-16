import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Loader2, Clock, RotateCcw, Map } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import GoogleMap from "@/components/GoogleMap";
import LocationPermissionBanner from "@/components/LocationPermissionBanner";
import NearbyPlaces from "@/components/NearbyPlaces";
import SafetyTips from "@/components/SafetyTips";
import MapPicker from "@/components/MapPicker";
import { useGoogleSearch, GooglePlace } from "@/hooks/useGoogleSearch";
import { useSavedRoutes, SavedRoute } from "@/hooks/useSavedRoutes";
import { useGeolocation } from "@/hooks/useGeolocation";

const PassengerHome = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const { position, endereco, permission, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
  const { results, loading, search, clear } = useGoogleSearch();
  const { routes: savedRoutes, saveRoute } = useSavedRoutes();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = (q: string) => {
    setDestination(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(q, position ? [position.lng, position.lat] : undefined);
    }, 350);
  };

  const handleSelectPlace = async (place: GooglePlace) => {
    if (!position || !endereco) return;
    if (place.blocked) {
      const { toast } = await import("sonner");
      toast.error("Destino acima de 25 km. Escolha um destino mais próximo.");
      return;
    }
    saveRoute({
      origem_endereco: endereco,
      origem_lat: position.lat,
      origem_lng: position.lng,
      destino_endereco: place.place_name,
      destino_lat: place.center[1],
      destino_lng: place.center[0],
    });
    navigate("/ride-confirm", {
      state: {
        origem: { endereco, lat: position.lat, lng: position.lng },
        destino: { endereco: place.place_name, lat: place.center[1], lng: place.center[0] },
      },
    });
  };

  const handleMapPickerConfirm = (lat: number, lng: number, addr: string) => {
    if (!position || !endereco) return;
    setMapPickerOpen(false);
    setSearchOpen(false);
    saveRoute({
      origem_endereco: endereco,
      origem_lat: position.lat,
      origem_lng: position.lng,
      destino_endereco: addr,
      destino_lat: lat,
      destino_lng: lng,
    });
    navigate("/ride-confirm", {
      state: {
        origem: { endereco, lat: position.lat, lng: position.lng },
        destino: { endereco: addr, lat, lng },
      },
    });
  };

  const handleSelectNearby = (place: { name: string; address: string; center: [number, number] }) => {
    if (!position || !endereco) return;
    saveRoute({
      origem_endereco: endereco,
      origem_lat: position.lat,
      origem_lng: position.lng,
      destino_endereco: place.address,
      destino_lat: place.center[1],
      destino_lng: place.center[0],
    });
    navigate("/ride-confirm", {
      state: {
        origem: { endereco, lat: position.lat, lng: position.lng },
        destino: { endereco: place.address, lat: place.center[1], lng: place.center[0] },
      },
    });
  };

  const handleSelectSavedRoute = (route: SavedRoute) => {
    if (!position || !endereco) return;
    saveRoute({
      origem_endereco: endereco,
      origem_lat: position.lat,
      origem_lng: position.lng,
      destino_endereco: route.destino_endereco,
      destino_lat: route.destino_lat,
      destino_lng: route.destino_lng,
    });
    navigate("/ride-confirm", {
      state: {
        origem: { endereco, lat: position.lat, lng: position.lng },
        destino: { endereco: route.destino_endereco, lat: route.destino_lat, lng: route.destino_lng },
      },
    });
  };

  const showPermissionBanner = permission !== "granted";

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <GoogleMap
          className="absolute inset-0 w-full h-full"
          zoom={15}
          center={position ? [position.lng, position.lat] : undefined}
        />
        {showPermissionBanner && (
          <LocationPermissionBanner
            permission={permission as any}
            loading={geoLoading}
            error={geoError}
            onRequest={requestLocation}
          />
        )}
      </div>

      {/* Bottom Panel - Uber style */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-card border-t border-border rounded-t-3xl p-5 pb-24 shadow-[0_-4px_30px_rgba(0,0,0,0.15)]"
      >
        {/* Search bar */}
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-3 bg-secondary rounded-xl px-4 py-4 text-left"
        >
          <Search size={20} className="text-primary" />
          <span className="text-muted-foreground font-medium">Para onde?</span>
        </button>

        {/* Current location */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-sm text-foreground truncate">
              {geoLoading ? "Obtendo localização..." : endereco || "Localização não disponível"}
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

        {/* Nearby Establishments */}
        <div className="mt-5">
          <NearbyPlaces
            userPosition={position}
            onSelectPlace={handleSelectNearby}
          />
        </div>

        {/* Safety Tips */}
        <div className="mt-5">
          <SafetyTips role="passenger" />
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
                  {endereco || "Localização não disponível"}
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
              {/* Selecionar no mapa */}
              <button
                onClick={() => setMapPickerOpen(true)}
                className="w-full flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 mt-2"
              >
                <Map size={18} className="text-primary" />
                <span className="text-sm text-primary font-semibold">Selecionar no mapa</span>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
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
                      disabled={place.blocked}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${
                        place.blocked
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <MapPin size={18} className={`mt-0.5 shrink-0 ${place.blocked ? "text-destructive" : "text-primary"}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground">{place.place_name}</span>
                        {place.blocked && (
                          <p className="text-[10px] text-destructive font-medium">Acima de 25 km — indisponível</p>
                        )}
                      </div>
                      {place.distance && (
                        <span className={`text-[10px] font-medium shrink-0 ${place.blocked ? "text-destructive" : "text-muted-foreground"}`}>{place.distance}</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : destination.length >= 3 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum resultado encontrado.</p>
              ) : null}

              {/* Nearby places inside search overlay */}
              {destination.length < 3 && (
                <div className="mt-4">
                  <NearbyPlaces
                    userPosition={position}
                    onSelectPlace={handleSelectNearby}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Picker Overlay */}
      <AnimatePresence>
        {mapPickerOpen && (
          <MapPicker
            initialCenter={position ? [position.lng, position.lat] : undefined}
            userPosition={position}
            onConfirm={handleMapPickerConfirm}
            onClose={() => setMapPickerOpen(false)}
          />
        )}
      </AnimatePresence>

      <BottomNav active="home" role="passenger" />
    </div>
  );
};

export default PassengerHome;
