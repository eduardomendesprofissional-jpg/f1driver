import { useState, useEffect, useCallback, useMemo } from "react";
import { MapPin, Info, Flame, TrendingUp, Clock, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import MapboxMap from "@/components/MapboxMap";
import MapboxPOISearch from "@/components/MapboxPOISearch";
import { supabase } from "@/integrations/supabase/client";
import mapboxgl from "mapbox-gl";

interface RidePoint {
  lat: number;
  lng: number;
  weight: number;
}

interface RegionSummary {
  name: string;
  count: number;
  avgValue: number;
  trend: "up" | "down" | "stable";
}

const MapaCalor = () => {
  const [points, setPoints] = useState<RidePoint[]>([]);
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  const fetchRideData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const daysBack = period === "1d" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const since = new Date(now.getTime() - daysBack * 86400000).toISOString();

    const { data: rides } = await supabase
      .from("rides")
      .select("origem_lat, origem_lng, destino_lat, destino_lng, valor, status, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (!rides || rides.length === 0) {
      setPoints([]);
      setRegions([]);
      setLoading(false);
      return;
    }

    // Build heatmap points from origins (where demand happens)
    const heatPoints: RidePoint[] = rides.map((r) => ({
      lat: r.origem_lat,
      lng: r.origem_lng,
      weight: r.valor ? Math.min(Number(r.valor) / 20, 1) : 0.5,
    }));

    setPoints(heatPoints);

    // Cluster into regions using a simple grid (0.01 degree ≈ 1km)
    const grid: Record<string, { count: number; totalValue: number; lat: number; lng: number }> = {};
    rides.forEach((r) => {
      const key = `${(r.origem_lat * 100).toFixed(0)}_${(r.origem_lng * 100).toFixed(0)}`;
      if (!grid[key]) {
        grid[key] = { count: 0, totalValue: 0, lat: r.origem_lat, lng: r.origem_lng };
      }
      grid[key].count++;
      grid[key].totalValue += Number(r.valor || 0);
    });

    const sortedRegions = Object.values(grid)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((g, i) => ({
        name: `Região ${i + 1} (${g.lat.toFixed(3)}, ${g.lng.toFixed(3)})`,
        count: g.count,
        avgValue: g.count > 0 ? g.totalValue / g.count : 0,
        trend: (g.count > 5 ? "up" : g.count > 2 ? "stable" : "down") as "up" | "down" | "stable",
      }));

    setRegions(sortedRegions);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchRideData();
  }, [fetchRideData]);

  // Add heatmap layer when map is ready and points change
  useEffect(() => {
    if (!mapInstance || points.length === 0) return;

    const sourceId = "ride-heat";
    const layerId = "ride-heatmap";

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: { weight: p.weight },
      })),
    };

    // Remove existing layer/source if any
    if (mapInstance.getLayer(layerId)) mapInstance.removeLayer(layerId);
    if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);

    mapInstance.addSource(sourceId, { type: "geojson", data: geojson });

    mapInstance.addLayer({
      id: layerId,
      type: "heatmap",
      source: sourceId,
      paint: {
        "heatmap-weight": ["get", "weight"],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(0,0,0,0)",
          0.1, "hsl(210, 100%, 60%)",
          0.3, "hsl(160, 80%, 50%)",
          0.5, "hsl(60, 90%, 55%)",
          0.7, "hsl(35, 95%, 55%)",
          1, "hsl(0, 85%, 55%)",
        ],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 20, 15, 40],
        "heatmap-opacity": 0.8,
      },
    });

    // Fit bounds to points
    if (points.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.lng, p.lat]));
      mapInstance.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 1200 });
    } else {
      mapInstance.flyTo({ center: [points[0].lng, points[0].lat], zoom: 13, duration: 1200 });
    }
  }, [mapInstance, points]);

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    setMapInstance(map);
  }, []);

  const trendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp size={14} className="text-green-500" />;
    if (trend === "down") return <TrendingUp size={14} className="text-red-500 rotate-180" />;
    return <Clock size={14} className="text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-orange-500" />
              <h2 className="text-lg font-bold">Mapa de Calor — Demanda</h2>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Regiões com maior concentração de solicitações de corridas.
          </p>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          {loading && points.length === 0 ? (
            <div className="w-full h-[500px] rounded-lg bg-muted flex items-center justify-center">
              <p className="text-muted-foreground animate-pulse">Carregando dados…</p>
            </div>
          ) : points.length === 0 ? (
            <div className="w-full h-[500px] rounded-lg bg-muted flex flex-col items-center justify-center gap-2">
              <MapPin size={32} className="text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma corrida encontrada neste período.</p>
            </div>
          ) : (
            <MapboxMap
              className="w-full h-[500px] rounded-lg overflow-hidden"
              showUserMarker={false}
              onMapReady={handleMapReady}
            />
          )}
        </CardContent>
      </Card>

      {/* Region Stats */}
      {regions.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Regiões com Maior Demanda
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {regions.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.count} corridas · R$ {r.avgValue.toFixed(2)} médio
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {trendIcon(r.trend)}
                    <Badge
                      variant={r.trend === "up" ? "default" : "secondary"}
                      className="text-[10px] px-1.5"
                    >
                      {r.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Legenda</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Baixa</span>
            <div className="flex-1 h-3 rounded-full" style={{
              background: "linear-gradient(to right, hsl(210,100%,60%), hsl(160,80%,50%), hsl(60,90%,55%), hsl(35,95%,55%), hsl(0,85%,55%))"
            }} />
            <span className="text-[10px] text-muted-foreground">Alta</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapaCalor;
