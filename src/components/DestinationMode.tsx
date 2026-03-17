import { useState } from "react";
import { MapPin, Navigation, X, Power } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleSearch, GooglePlace } from "@/hooks/useGoogleSearch";
import { toast } from "sonner";
import { useRef } from "react";

interface DestinationModeProps {
  active: boolean;
  destinationAddress?: string;
  onToggle: (active: boolean, lat?: number, lng?: number, address?: string) => void;
}

const DestinationMode = ({ active, destinationAddress, onToggle }: DestinationModeProps) => {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState("");
  const { results, loading, search, clear } = useGoogleSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(q);
    }, 350);
  };

  const handleSelect = async (place: GooglePlace) => {
    if (!user || place.blocked) return;
    const lat = place.center[1];
    const lng = place.center[0];

    await (supabase.from("driver_locations").update({
      destino_modo_ativo: true,
      destino_lat: lat,
      destino_lng: lng,
      destino_endereco: place.place_name,
    } as any).eq("driver_id", user.id) as any);

    onToggle(true, lat, lng, place.place_name);
    setShowPicker(false);
    setQuery("");
    clear();
    toast.success("Modo destino ativado! Você receberá corridas na direção do seu destino.");
  };

  const handleDeactivate = async () => {
    if (!user) return;
    await (supabase.from("driver_locations").update({
      destino_modo_ativo: false,
      destino_lat: null,
      destino_lng: null,
      destino_endereco: null,
    } as any).eq("driver_id", user.id) as any);

    onToggle(false);
    toast.info("Modo destino desativado.");
  };

  return (
    <>
      {active ? (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2.5">
          <Navigation size={14} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-primary font-semibold uppercase">Modo Destino</p>
            <p className="text-xs truncate">{destinationAddress || "Ativo"}</p>
          </div>
          <button
            onClick={handleDeactivate}
            className="p-1.5 rounded-lg bg-destructive/10 text-destructive"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground transition-all active:scale-95 w-full"
        >
          <Navigation size={14} className="text-primary" />
          Modo Destino
        </button>
      )}

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 flex items-end justify-center"
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 space-y-4 max-h-[70vh]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Navigation size={20} className="text-primary" />
                  Modo Destino
                </h3>
                <button onClick={() => setShowPicker(false)} className="p-2 rounded-lg bg-secondary">
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                Defina um destino e receba apenas corridas que vão nessa direção.
              </p>

              <input
                autoFocus
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar destino..."
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />

              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handleSelect(place)}
                    disabled={place.blocked}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-secondary rounded-lg text-xs disabled:opacity-40"
                  >
                    <MapPin size={12} className="text-primary shrink-0" />
                    <span className="truncate">{place.place_name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DestinationMode;
