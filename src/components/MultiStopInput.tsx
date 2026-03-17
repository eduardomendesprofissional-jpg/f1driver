import { useState, useRef } from "react";
import { Plus, MapPin, X, GripVertical } from "lucide-react";
import { useGoogleSearch, GooglePlace } from "@/hooks/useGoogleSearch";

export interface StopPoint {
  endereco: string;
  lat: number;
  lng: number;
}

interface MultiStopInputProps {
  stops: StopPoint[];
  onStopsChange: (stops: StopPoint[]) => void;
  userPosition?: { lat: number; lng: number };
  maxStops?: number;
}

const MultiStopInput = ({ stops, onStopsChange, userPosition, maxStops = 3 }: MultiStopInputProps) => {
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const { results, loading, search, clear } = useGoogleSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(q, userPosition ? [userPosition.lng, userPosition.lat] : undefined);
    }, 350);
  };

  const handleSelectPlace = (place: GooglePlace) => {
    if (place.blocked) return;
    const newStop: StopPoint = {
      endereco: place.place_name,
      lat: place.center[1],
      lng: place.center[0],
    };
    const updated = [...stops];
    if (addingIndex !== null && addingIndex < stops.length) {
      updated[addingIndex] = newStop;
    } else {
      updated.push(newStop);
    }
    onStopsChange(updated);
    setAddingIndex(null);
    setQuery("");
    clear();
  };

  const removeStop = (index: number) => {
    onStopsChange(stops.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {stops.map((stop, i) => (
        <div key={i} className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
          <GripVertical size={14} className="text-muted-foreground shrink-0" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="flex-1 text-xs truncate">{stop.endereco}</span>
          <button onClick={() => removeStop(i)} className="p-1 rounded-md hover:bg-muted">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>
      ))}

      {addingIndex !== null && (
        <div className="space-y-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar parada..."
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          {results.length > 0 && (
            <div className="bg-card border border-border rounded-xl max-h-40 overflow-y-auto">
              {results.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  disabled={place.blocked}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-secondary text-xs disabled:opacity-40"
                >
                  <MapPin size={12} className="text-primary shrink-0" />
                  <span className="truncate">{place.place_name}</span>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => { setAddingIndex(null); setQuery(""); clear(); }} className="text-xs text-muted-foreground">
            Cancelar
          </button>
        </div>
      )}

      {stops.length < maxStops && addingIndex === null && (
        <button
          onClick={() => setAddingIndex(stops.length)}
          className="flex items-center gap-2 text-xs font-semibold text-primary py-2 transition-all active:scale-95"
        >
          <Plus size={14} />
          Adicionar parada
        </button>
      )}
    </div>
  );
};

export default MultiStopInput;
