/// <reference types="google.maps" />
import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Info, Flame, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import GoogleMap from "@/components/GoogleMap";
import { supabase } from "@/integrations/supabase/client";

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
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

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

    const heatPoints: RidePoint[] = rides.map((r) => ({
      lat: r.origem_lat,
      lng: r.origem_lng,
      weight: r.valor ? Math.min(Number(r.valor) / 20, 1) : 0.5,
    }));

    setPoints(heatPoints);

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

  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  // Render Google Maps heatmap layer
  useEffect(() => {
    if (!mapInstance || points.length === 0) return;

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    const heatmapData = points.map((p) => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      weight: p.weight,
    }));

    heatmapRef.current = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: mapInstance,
      radius: 30,
      opacity: 0.8,
      gradient: [
        "rgba(59, 130, 246, 0)",
        "rgba(59, 130, 246, 0.6)",
        "rgba(34, 197, 94, 0.7)",
        "rgba(245, 158, 11, 0.8)",
        "rgba(239, 68, 68, 0.9)",
      ],
    });

    if (points.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInstance.fitBounds(bounds, 60);
    } else {
      mapInstance.panTo({ lat: points[0].lat, lng: points[0].lng });
      mapInstance.setZoom(13);
    }

    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    };
  }, [mapInstance, points]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const trendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp size={14} className="text-green-500" />;
    if (trend === "down") return <TrendingUp size={14} className="text-red-500 rotate-180" />;
    return <Clock size={14} className="text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
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

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <GoogleMap
              className="w-full h-[500px] rounded-lg overflow-hidden"
              showUserMarker={false}
              onMapReady={handleMapReady}
            />
            {loading && points.length === 0 && (
              <div className="absolute inset-0 rounded-lg bg-muted/80 flex items-center justify-center z-10">
                <p className="text-muted-foreground animate-pulse">Carregando dados…</p>
              </div>
            )}
            {!loading && points.length === 0 && (
              <div className="absolute inset-0 rounded-lg bg-muted/60 flex flex-col items-center justify-center gap-2 z-10">
                <MapPin size={32} className="text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma corrida encontrada neste período.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
