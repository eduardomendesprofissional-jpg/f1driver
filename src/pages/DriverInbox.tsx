import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, Check, CheckCheck, Loader2, Inbox, Gift, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
}

const TIPO_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  corrida: { icon: Bell, color: "text-primary", bg: "bg-primary/10" },
  envio: { icon: Gift, color: "text-success", bg: "bg-success/10" },
  alerta: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  geral: { icon: Info, color: "text-muted-foreground", bg: "bg-secondary" },
};

const DriverInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotificacoes();

    const channel = supabase
      .channel("notificacoes-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notificacoes",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotificacoes((prev) => [payload.new as Notificacao, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotificacoes = async () => {
    const { data } = await supabase
      .from("notificacoes" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotificacoes(data as any);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notificacoes" as any).update({ lida: true } as any).eq("id", id);
    setNotificacoes((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n));
  };

  const markAllRead = async () => {
    const unread = notificacoes.filter((n) => !n.lida);
    if (unread.length === 0) return;
    for (const n of unread) {
      await supabase.from("notificacoes" as any).update({ lida: true } as any).eq("id", n.id);
    }
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    toast.success("Todas marcadas como lidas");
  };

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Agora";
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-lg z-10 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Caixa de Entrada</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} não lida{unreadCount > 1 ? "s" : ""}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary">
            <CheckCheck size={16} className="mr-1" /> Ler todas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <BellOff size={28} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Nenhuma notificação ainda</p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          <AnimatePresence initial={false}>
            {notificacoes.map((notif, i) => {
              const config = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.geral;
              const Icon = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={`border cursor-pointer transition-all ${
                      notif.lida ? "border-border opacity-60" : "border-primary/30 bg-primary/5"
                    }`}
                    onClick={() => !notif.lida && markAsRead(notif.id)}
                  >
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                        <Icon size={18} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{notif.titulo}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(notif.created_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.mensagem}</p>
                      </div>
                      {!notif.lida && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default DriverInbox;
