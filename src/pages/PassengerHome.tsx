import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Clock, Star, Navigation } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import MapboxMap from "@/components/MapboxMap";

const PassengerHome = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [destination, setDestination] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Real Map */}
      <div className="flex-1 relative overflow-hidden">
        <MapboxMap className="absolute inset-0 w-full h-full" zoom={14} />
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recentes</p>
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum destino recente.</p>
        </div>
      </motion.div>

      {/* Search Overlay */}
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSearchOpen(false)} className="text-foreground p-2">✕</button>
              <h2 className="text-lg font-bold">Para onde?</h2>
            </div>
            <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Sua localização</span>
            </div>
            <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
              <MapPin size={14} className="text-primary" />
              <input
                autoFocus
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Digite o destino"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex-1 p-4">
            <p className="text-sm text-muted-foreground text-center py-8">Digite um destino para buscar.</p>
          </div>
        </motion.div>
      )}

      <BottomNav active="home" role="passenger" />
    </div>
  );
};

export default PassengerHome;
