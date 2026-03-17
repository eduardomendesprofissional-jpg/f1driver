import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, TrendingUp, Car, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DayStat {
  date: string;
  earnings: number;
  rides: number;
  hours: number;
}

const DriverEarnings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [stats, setStats] = useState<DayStat[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    if (!user) return;
    const fetchWeekly = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("rides")
        .select("valor_final, valor, finalizada_em, iniciada_em, gorjeta")
        .eq("motorista_id", user.id)
        .eq("status", "finalizada")
        .gte("finalizada_em", weekStart.toISOString())
        .lte("finalizada_em", weekEnd.toISOString());

      const dayStats: DayStat[] = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayRides = (data || []).filter(
          (r) => r.finalizada_em && format(new Date(r.finalizada_em), "yyyy-MM-dd") === dayStr
        );
        const earnings = dayRides.reduce(
          (sum, r) => sum + Number((r as any).valor_final || r.valor || 0) + Number((r as any).gorjeta || 0),
          0
        );
        const hours = dayRides.reduce((sum, r) => {
          if (r.iniciada_em && r.finalizada_em) {
            return sum + (new Date(r.finalizada_em).getTime() - new Date(r.iniciada_em).getTime()) / 3600000;
          }
          return sum;
        }, 0);
        return { date: dayStr, earnings, rides: dayRides.length, hours: Math.round(hours * 10) / 10 };
      });
      setStats(dayStats);
      setLoading(false);
    };
    fetchWeekly();
  }, [user, weekOffset]);

  const totalEarnings = stats.reduce((s, d) => s + d.earnings, 0);
  const totalRides = stats.reduce((s, d) => s + d.rides, 0);
  const totalHours = stats.reduce((s, d) => s + d.hours, 0);
  const maxEarning = Math.max(...stats.map((d) => d.earnings), 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Resumo Semanal</h1>
      </div>

      {/* Week selector */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setWeekOffset((p) => p + 1)}
          className="text-sm text-primary font-semibold"
        >
          ← Semana anterior
        </button>
        <p className="text-xs text-muted-foreground">
          {format(weekStart, "dd MMM", { locale: ptBR })} – {format(weekEnd, "dd MMM", { locale: ptBR })}
        </p>
        <button
          onClick={() => setWeekOffset((p) => Math.max(0, p - 1))}
          disabled={weekOffset === 0}
          className="text-sm text-primary font-semibold disabled:opacity-30"
        >
          Próxima →
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <DollarSign size={20} className="text-primary mx-auto mb-1" />
          <p className="text-lg font-black text-primary">R$ {totalEarnings.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Ganhos</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Car size={20} className="text-foreground mx-auto mb-1" />
          <p className="text-lg font-black">{totalRides}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Corridas</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Clock size={20} className="text-foreground mx-auto mb-1" />
          <p className="text-lg font-black">{totalHours.toFixed(1)}h</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Online</p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 py-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          <Calendar size={12} className="inline mr-1" /> Ganhos por dia
        </p>
        <div className="flex items-end gap-2 h-40">
          {stats.map((day) => {
            const height = maxEarning > 0 ? (day.earnings / maxEarning) * 100 : 0;
            const dayLabel = format(new Date(day.date), "EEE", { locale: ptBR });
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-primary">
                  {day.earnings > 0 ? `R$${day.earnings.toFixed(0)}` : ""}
                </span>
                <div
                  className="w-full bg-primary/20 rounded-t-lg relative overflow-hidden transition-all"
                  style={{ height: `${Math.max(height, 4)}%` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                    style={{ height: "100%" }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold capitalize">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="px-4 pb-8">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Detalhes diários</p>
        <div className="space-y-2">
          {stats.map((day) => (
            <div key={day.date} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold capitalize">
                  {format(new Date(day.date), "EEEE, dd/MM", { locale: ptBR })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {day.rides} corrida{day.rides !== 1 ? "s" : ""} · {day.hours}h online
                </p>
              </div>
              <span className="text-sm font-bold text-primary">R$ {day.earnings.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings;
