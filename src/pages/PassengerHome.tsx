import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Loader2, Clock, RotateCcw, Map, Car, Package, Navigation } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import GoogleMap from "@/components/GoogleMap";
import LocationPermissionBanner from "@/components/LocationPermissionBanner";

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

  const serviceButtons = [
    { icon: Car, label: "Corrida", action: () => setSearchOpen(true) },
    { icon: Package, label: "Envio", action: () => navigate("/envios/novo") },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Full-screen Map */}
      <div className="absolute inset-0">
        <GoogleMap
          className="w-full h-full"
          zoom={15}
          center={position ? [position.lng, position.lat] : undefined}
        />
      </div>

      {/* Permission Banner */}
      {showPermissionBanner && (
        <div className="absolute top-4 left-4 right-4 z-30">
          <LocationPermissionBanner
            permission={permission as any}
            loading={geoLoading}
            error={geoError}
            onRequest={requestLocation}
          />
        </div>
      )}

      {/* Current location pill - floating */}
      {!showPermissionBanner && endereco && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-5 left-4 right-4 z-20"
        >
          <div className="flex items-center gap-2.5 bg-card/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg border border-border/50">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Navigation size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sua localização</p>
              <p className="text-xs text-foreground truncate font-medium">
                {geoLoading ? "Obtendo localização..." : endereco}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom Sheet - inDrive style */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card/95 backdrop-blur-xl border-t border-border/50 rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.3)]"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="px-5 pb-28">
            {/* Search button - inDrive style prominent */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-3.5 bg-primary rounded-2xl px-5 py-4 text-left group transition-all active:scale-[0.98] shadow-lg"
              style={{ boxShadow: '0 4px 20px hsl(210 100% 56% / 0.35)' }}
            >
              <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Search size={18} className="text-primary-foreground" />
              </div>
              <span className="text-primary-foreground font-semibold text-[15px]">Para onde vamos?</span>
            </button>

            {/* Service categories */}
            <div className="flex gap-3 mt-4">
              {serviceButtons.map((svc) => (
                <button
                  key={svc.label}
                  onClick={svc.action}
                  className="flex-1 flex flex-col items-center gap-2 bg-secondary/80 hover:bg-secondary rounded-2xl py-4 transition-all active:scale-[0.97]"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
                    <svc.icon size={22} className="text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{svc.label}</span>
                </button>
              ))}
            </div>

            {/* Recent routes */}
            {savedRoutes.length > 0 && (
              <div className="mt-5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Recentes</p>
                <div className="space-y-1">
                  {savedRoutes.slice(0, 3).map((route) => (
                    <button
                      key={route.id}
                      onClick={() => handleSelectSavedRoute(route)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 transition-all active:scale-[0.98] text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <RotateCcw size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate font-medium">{route.destino_endereco}</p>
                        <p className="text-[10px] text-muted-foreground">{route.vezes_usado}x utilizada</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            {/* Header */}
            <div className="p-4 pb-2 space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSearchOpen(false); clear(); setDestination(""); }}
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                >
                  ✕
                </button>
                <h2 className="text-lg font-bold text-foreground">Para onde?</h2>
              </div>

              {/* Origin display */}
              <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3">
                <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20" />
                <span className="text-sm text-muted-foreground truncate">
                  {endereco || "Localização não disponível"}
                </span>
              </div>

              {/* Destination input */}
              <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3 ring-2 ring-primary/30">
                <MapPin size={16} className="text-primary shrink-0" />
                <input
                  autoFocus
                  value={destination}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Digite o destino"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {loading && <Loader2 size={16} className="animate-spin text-primary" />}
              </div>

              {/* Map picker button */}
              <button
                onClick={() => setMapPickerOpen(true)}
                className="w-full flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 transition-all active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Map size={16} className="text-primary" />
                </div>
                <span className="text-sm text-primary font-semibold">Selecionar no mapa</span>
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 px-4 pb-4 overflow-y-auto">
              {/* Saved routes when not searching */}
              {destination.length < 3 && savedRoutes.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Rotas recentes</p>
                  <div className="space-y-1">
                    {savedRoutes.map((route) => (
                      <button
                        key={route.id}
                        onClick={() => handleSelectSavedRoute(route)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-all active:scale-[0.98] text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <Clock size={14} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate font-medium">{route.destino_endereco}</p>
                          <p className="text-[10px] text-muted-foreground">{route.vezes_usado}x utilizada</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search results */}
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                      disabled={place.blocked}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                        place.blocked
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-secondary active:scale-[0.98]"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        place.blocked ? "bg-destructive/10" : "bg-secondary"
                      }`}>
                        <MapPin size={16} className={place.blocked ? "text-destructive" : "text-primary"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground font-medium">{place.place_name}</span>
                        {place.blocked && (
                          <p className="text-[10px] text-destructive font-semibold mt-0.5">Acima de 25 km — indisponível</p>
                        )}
                      </div>
                      {place.distance && (
                        <span className={`text-[10px] font-semibold shrink-0 mt-1 ${place.blocked ? "text-destructive" : "text-muted-foreground"}`}>
                          {place.distance}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : destination.length >= 3 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Search size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhum resultado encontrado</p>
                </div>
              ) : null}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Picker */}
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
