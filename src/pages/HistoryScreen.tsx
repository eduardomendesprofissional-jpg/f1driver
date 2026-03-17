import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CheckCircle2, XCircle, ArrowLeft, Clock, Car, DollarSign, Loader2, Star, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";

interface Ride {
  id: string;
  origem_endereco: string;
  destino_endereco: string;
  status: string;
  valor: number | null;
  valor_final: number | null;
  categoria: string;
  forma_pagamento: string;
  created_at: string;
  finalizada_em: string | null;
  cancelada_em: string | null;
  distancia_km: number | null;
  duracao_real_min: number | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  finalizada: { label: "Finalizada", color: "bg-success/10 text-success border-success/30", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
  no_show: { label: "No-show", color: "bg-amber-500/10 text-amber-600 border-amber-300", icon: XCircle },
  em_andamento: { label: "Em andamento", color: "bg-primary/10 text-primary border-primary/30", icon: Car },
  solicitada: { label: "Solicitada", color: "bg-muted text-muted-foreground border-border", icon: Clock },
  aceita: { label: "Aceita", color: "bg-blue-500/10 text-blue-600 border-blue-300", icon: Car },
  aguardando: { label: "Aguardando", color: "bg-amber-500/10 text-amber-600 border-amber-300", icon: Clock },
};

const HistoryScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todas" | "finalizada" | "cancelada">("todas");

  useEffect(() => {
    if (!user) return;
    const fetchRides = async () => {
      const { data } = await supabase
        .from("rides")
        .select("id, origem_endereco, destino_endereco, status, valor, valor_final, categoria, forma_pagamento, created_at, finalizada_em, cancelada_em, distancia_km, duracao_real_min")
        .or(`passageiro_id.eq.${user.id},motorista_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setRides(data as Ride[]);
      setLoading(false);
    };
    fetchRides();
  }, [user]);

  const filtered = filter === "todas" ? rides : rides.filter(r => r.status === filter);
  const totalGasto = rides.filter(r => r.status === "finalizada").reduce((s, r) => s + Number(r.valor_final || r.valor || 0), 0);
  const totalCorridas = rides.filter(r => r.status === "finalizada").length;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary press-sm">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Histórico</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Car size={20} className="text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{totalCorridas}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Corridas</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <DollarSign size={20} className="text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-primary">R$ {totalGasto.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total gasto</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 pb-3">
        {([["todas", "Todas"], ["finalizada", "Finalizadas"], ["cancelada", "Canceladas"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Clock size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma corrida encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((ride, i) => {
                const cfg = STATUS_CONFIG[ride.status] || STATUS_CONFIG.solicitada;
                const StatusIcon = cfg.icon;
                const valor = ride.valor_final || ride.valor || 0;
                return (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-2xl p-4 space-y-3 press-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Car size={16} className="text-primary" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold capitalize text-foreground">{ride.categoria}</span>
                          <p className="text-[10px] text-muted-foreground">{formatDate(ride.created_at)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.color}`}>
                        <StatusIcon size={10} />
                        {cfg.label}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center gap-0.5 mt-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <div className="w-px h-5 bg-border" />
                        <MapPin size={11} className="text-destructive" />
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <p className="text-xs text-foreground truncate">{ride.origem_endereco}</p>
                        <p className="text-xs text-muted-foreground truncate">{ride.destino_endereco}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        {ride.distancia_km && <span>{ride.distancia_km} km</span>}
                        {ride.duracao_real_min && <span>{ride.duracao_real_min} min</span>}
                        <span className="capitalize">{ride.forma_pagamento}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        R$ {Number(valor).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNav active="history" role="passenger" />
    </div>
  );
};

export default HistoryScreen;
