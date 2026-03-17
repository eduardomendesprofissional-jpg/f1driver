import { useState, useRef, useCallback } from "react";
import { Search, X, MapPin } from "lucide-react";
import { useGoogleSearch, GooglePlace } from "@/hooks/useGoogleSearch";

interface DriverMapSearchProps {
  userPosition?: { lat: number; lng: number } | null;
  onSelectPlace: (lat: number, lng: number, address: string) => void;
}

const DriverMapSearch = ({ userPosition, onSelectPlace }: DriverMapSearchProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading, search, clear } = useGoogleSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(value, userPosition ? [userPosition.lng, userPosition.lat] : undefined);
    }, 350);
  }, [userPosition, search]);

  const handleSelect = (place: GooglePlace) => {
    setQuery(place.place_name);
    setOpen(false);
    clear();
    onSelectPlace(place.center[1], place.center[0], place.place_name);
  };

  const handleClear = () => {
    setQuery("");
    setOpen(false);
    clear();
  };

  return (
    <div className="absolute top-3 left-3 right-3 z-20">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4fc3f7]" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Buscar endereço ou estabelecimento..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm text-white placeholder:text-white/40 bg-[#0a0f1e]/90 backdrop-blur-md border border-[#1e3a6e] focus:border-[#4fc3f7] focus:outline-none transition-colors"
        />
        {query && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="mt-1.5 bg-[#0a0f1e]/95 backdrop-blur-md border border-[#1e3a6e] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
          {results.map((place) => (
            <button
              key={place.id}
              onClick={() => !place.blocked && handleSelect(place)}
              disabled={place.blocked}
              className={`w-full flex items-start gap-2.5 px-3 py-2.5 transition-colors text-left ${
                place.blocked
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#1e3a6e]/40"
              }`}
            >
              <MapPin size={14} className={`mt-0.5 shrink-0 ${place.blocked ? "text-red-400" : "text-[#4fc3f7]"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white font-semibold truncate">{place.text}</p>
                {place.category && (
                  <p className="text-[10px] text-[#4fc3f7]/80 truncate">{place.category}</p>
                )}
                <p className="text-[11px] text-white/60 truncate">
                  {place.place_name !== place.text ? place.place_name : ""}
                </p>
                {place.blocked && (
                  <p className="text-[10px] text-red-400 font-medium">Acima de 100 km</p>
                )}
              </div>
              {place.distance && (
                <span className={`text-[10px] font-medium shrink-0 whitespace-nowrap ${place.blocked ? "text-red-400" : "text-[#4fc3f7]"}`}>{place.distance}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && loading && (
        <div className="mt-1.5 bg-[#0a0f1e]/95 backdrop-blur-md border border-[#1e3a6e] rounded-xl p-3 text-center">
          <p className="text-xs text-white/50">Buscando...</p>
        </div>
      )}
    </div>
  );
};

export default DriverMapSearch;
