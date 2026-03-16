import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, ArrowLeft, Plus, MapPin, Clock, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";

interface Envio {
  id: string;
  descricao: string;
  tamanho: string;
  peso_kg: number;
  coleta_endereco: string;
  entrega_endereco: string;
  distancia_km: number | null;
  valor: number | null;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "bg-amber-500/10 text-amber-600 border-amber-300", icon: Clock },
  coletado: { label: "Coletado", color: "bg-blue-500/10 text-blue-600 border-blue-300", icon: Package },
  entregue: { label: "Entregue", color: "bg-green-500/10 text-green-600 border-green-300", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

const EnviosScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchEnvios = async () => {
      const { data } = await supabase
        .from("envios" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setEnvios(data as unknown as Envio[]);
      setLoading(false);
    };
    fetchEnvios();
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Envios</h1>
      </div>

      <div className="px-4 space-y-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/envios/novo")}
          className="w-full flex items-center gap-4 p-4 bg-primary/10 border border-primary/30 rounded-2xl"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Package size={24} className="text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">Novo envio</p>
            <p className="text-xs text-muted-foreground">Envie pacotes de forma rápida e segura</p>
          </div>
          <Plus size={20} className="text-primary" />
        </motion.button>

        <div className="pt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Seus envios</p>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : envios.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum envio registrado.</p>
          ) : (
            <div className="space-y-3">
              {envios.map((envio, i) => {
                const cfg = statusConfig[envio.status] || statusConfig.pendente;
                const StatusIcon = cfg.icon;
                return (
                  <motion.div
                    key={envio.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/envios/${envio.id}`)}
                    className="bg-card border border-border rounded-xl p-4 space-y-2 cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-primary" />
                        <span className="text-sm font-semibold text-foreground">{envio.descricao}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                        <StatusIcon size={10} className="mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-center gap-0.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="w-px h-4 bg-border" />
                        <MapPin size={10} className="text-destructive" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{envio.coleta_endereco}</p>
                        <p className="text-xs text-muted-foreground truncate">{envio.entrega_endereco}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span>{envio.tamanho} • {envio.peso_kg}kg</span>
                        {envio.distancia_km && <span>{envio.distancia_km} km</span>}
                      </div>
                      <span className="text-sm font-bold text-primary">
                        R$ {Number(envio.valor || 0).toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      {new Date(envio.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="envios" role="passenger" />
    </div>
  );
};

export default EnviosScreen;
