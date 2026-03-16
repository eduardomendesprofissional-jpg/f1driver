import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, MapPin, Phone, Loader2, CheckCircle2, Clock, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { loadMapsLibrary } from "@/lib/google-maps";

interface EnvioData {
  id: string;
  descricao: string;
  tamanho: string;
  peso_kg: number;
  coleta_endereco: string;
  coleta_lat: number;
  coleta_lng: number;
  entrega_endereco: string;
  entrega_lat: number;
  entrega_lng: number;
  distancia_km: number | null;
  valor: number | null;
  status: string;
  motorista_id: string | null;
  forma_pagamento: string;
  created_at: string;
}

interface DriverInfo {
  nome: string | null;
  telefone: string | null;
  veiculo_modelo: string | null;
  veiculo_placa: string | null;
  veiculo_cor: string | null;
}

const statusSteps = [
  { key: "pendente", label: "Aguardando coleta", icon: Clock },
  { key: "coletado", label: "Em trânsito", icon: Truck },
  { key: "entregue", label: "Entregue", icon: CheckCircle2 },
];

const EnvioTracking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [envio, setEnvio] = useState<EnvioData | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const coletaMarkerRef = useRef<google.maps.Marker | null>(null);
  const entregaMarkerRef = useRef<google.maps.Marker | null>(null);

  // Fetch envio data
  const fetchEnvio = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("envios" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      const envioData = data as unknown as EnvioData;
      setEnvio(envioData);

      // Fetch driver profile if assigned
      if (envioData.motorista_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome, telefone, veiculo_modelo, veiculo_placa, veiculo_cor")
          .eq("id", envioData.motorista_id)
          .maybeSingle();
        if (profile) setDriver(profile as DriverInfo);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEnvio();
  }, [fetchEnvio]);

  // Subscribe to envio status changes
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`envio-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "envios", filter: `id=eq.${id}` },
        (payload) => {
          const updated = payload.new as unknown as EnvioData;
          setEnvio(updated);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Subscribe to driver location
  useEffect(() => {
    if (!envio?.motorista_id) return;

    // Initial fetch
    const fetchLoc = async () => {
      const { data } = await supabase
        .from("driver_locations")
        .select("lat, lng")
        .eq("driver_id", envio.motorista_id!)
        .eq("online", true)
        .maybeSingle();
      if (data) {
        setDriverLat(data.lat);
        setDriverLng(data.lng);
      }
    };
    fetchLoc();

    const channel = supabase
      .channel(`driver-loc-${envio.motorista_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_locations",
          filter: `driver_id=eq.${envio.motorista_id}`,
        },
        (payload) => {
          const loc = payload.new as any;
          if (loc?.lat && loc?.lng) {
            setDriverLat(loc.lat);
            setDriverLng(loc.lng);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [envio?.motorista_id]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !envio) return;

    loadMapsLibrary().then(() => {
      if (!mapContainer.current || mapRef.current) return;

      const map = new google.maps.Map(mapContainer.current, {
        center: { lat: envio.coleta_lat, lng: envio.coleta_lng },
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        ],
      });

      // Coleta marker
      coletaMarkerRef.current = new google.maps.Marker({
        map,
        position: { lat: envio.coleta_lat, lng: envio.coleta_lng },
        title: "Coleta: " + envio.coleta_endereco,
        label: { text: "📦", fontSize: "16px" },
      });

      // Entrega marker
      entregaMarkerRef.current = new google.maps.Marker({
        map,
        position: { lat: envio.entrega_lat, lng: envio.entrega_lng },
        title: "Entrega: " + envio.entrega_endereco,
        label: { text: "📍", fontSize: "16px" },
      });

      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: envio.coleta_lat, lng: envio.coleta_lng });
      bounds.extend({ lat: envio.entrega_lat, lng: envio.entrega_lng });
      map.fitBounds(bounds, 60);

      mapRef.current = map;
    });

    return () => {
      mapRef.current = null;
    };
  }, [envio]);

  // Update driver marker in real-time
  useEffect(() => {
    if (!mapRef.current || driverLat === null || driverLng === null) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([driverLng, driverLat]);
    } else {
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:hsl(142,71%,45%);border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="font-size:16px;">🚗</span></div>`;
      driverMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([driverLng, driverLat])
        .addTo(mapRef.current);
    }
  }, [driverLat, driverLng]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!envio) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Envio não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/envios")}>Voltar</Button>
      </div>
    );
  }

  const currentStepIdx = statusSteps.findIndex((s) => s.key === envio.status);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 z-10 relative">
        <button onClick={() => navigate("/envios")} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Rastrear Envio</h1>
      </div>

      {/* Map */}
      <div className="relative h-[45vh] min-h-[280px]">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {!envio.motorista_id && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-2 mx-4">
              <Loader2 className="animate-spin text-primary mx-auto" size={24} />
              <p className="text-sm font-semibold">Aguardando motorista aceitar</p>
              <p className="text-xs text-muted-foreground">Assim que um motorista aceitar, você poderá rastrear em tempo real</p>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="flex-1 bg-card border-t border-border rounded-t-3xl -mt-4 z-10 relative p-4 space-y-4 overflow-y-auto">

        {/* Status Progress */}
        <div className="flex items-center justify-between px-2">
          {statusSteps.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = i <= currentStepIdx && envio.status !== "cancelado";
            return (
              <div key={step.key} className="flex flex-col items-center gap-1 flex-1 relative">
                {i > 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-0.5 ${
                      i <= currentStepIdx && envio.status !== "cancelado" ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <StepIcon size={14} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Package info */}
        <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <span className="text-sm font-semibold">{envio.descricao}</span>
            </div>
            <span className="text-sm font-bold text-primary">R$ {Number(envio.valor || 0).toFixed(2)}</span>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{envio.tamanho}</span>
            <span>•</span>
            <span>{envio.peso_kg} kg</span>
            {envio.distancia_km && (
              <>
                <span>•</span>
                <span>{envio.distancia_km} km</span>
              </>
            )}
          </div>
        </div>

        {/* Addresses */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Coleta</p>
              <p className="text-xs text-foreground">{envio.coleta_endereco}</p>
            </div>
          </div>
          <div className="ml-3 w-px h-4 bg-border" />
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={12} className="text-destructive" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Entrega</p>
              <p className="text-xs text-foreground">{envio.entrega_endereco}</p>
            </div>
          </div>
        </div>

        {/* Driver info */}
        {driver && (
          <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Motorista</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{driver.nome || "Motorista"}</p>
                <p className="text-xs text-muted-foreground">
                  {[driver.veiculo_modelo, driver.veiculo_cor, driver.veiculo_placa].filter(Boolean).join(" • ")}
                </p>
              </div>
              {driver.telefone && (
                <a href={`tel:${driver.telefone}`}>
                  <Button size="icon" variant="outline" className="rounded-full w-10 h-10">
                    <Phone size={16} />
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        {envio.status === "entregue" && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
            <CheckCircle2 size={28} className="text-success mx-auto mb-2" />
            <p className="text-sm font-bold text-success">Entrega concluída!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvioTracking;
