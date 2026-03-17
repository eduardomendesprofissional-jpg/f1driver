import { useState, useEffect } from "react";
import { Car, Users, UserCheck, Headphones, Clock, Star, Trophy, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ corridas: 0, passageiros: 0, motoristas: 0, faturamento: 0 });
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [recentRatings, setRecentRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [ridesRes, passRes, driverRes, ratingsRes] = await Promise.all([
      supabase.from("rides").select("id, status, valor_final, valor, finalizada_em, created_at, motorista_id").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id").eq("tipo", "passageiro"),
      supabase.from("profiles").select("id").eq("tipo", "motorista"),
      supabase.from("ratings").select("id, nota, comentario, created_at, avaliado_id").order("created_at", { ascending: false }).limit(5),
    ]);

    const rides = ridesRes.data || [];
    const finalizadas = rides.filter(r => r.status === "finalizada");
    const faturamento = finalizadas.reduce((s, r) => s + Number(r.valor_final || r.valor || 0), 0);

    setStats({
      corridas: finalizadas.length,
      passageiros: (passRes.data || []).length,
      motoristas: (driverRes.data || []).length,
      faturamento,
    });

    setRecentRatings((ratingsRes.data || []).map(r => ({
      ...r,
      nota: Number(r.nota),
    })));

    // Top drivers by rides count
    const driverCounts: Record<string, number> = {};
    finalizadas.forEach(r => {
      if (r.motorista_id) driverCounts[r.motorista_id] = (driverCounts[r.motorista_id] || 0) + 1;
    });
    const topIds = Object.entries(driverCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (topIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", topIds.map(t => t[0]));
      const profileMap = new Map((profiles || []).map(p => [p.id, p.nome]));
      setTopDrivers(topIds.map(([id, count]) => ({ nome: profileMap.get(id) || "Motorista", corridas: count })));
    }

    // Chart data - last 9 days
    const days: any[] = [];
    for (let i = 8; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      const dayRides = rides.filter(r => r.created_at?.startsWith(dayStr));
      const dayFinalizadas = dayRides.filter(r => r.status === "finalizada");
      const dayCanceladas = dayRides.filter(r => r.status === "cancelada");
      const dayFat = dayFinalizadas.reduce((s, r) => s + Number(r.valor_final || r.valor || 0), 0);
      days.push({ name: dayLabel, faturamento: Math.round(dayFat * 100) / 100, finalizadas: dayFinalizadas.length, canceladas: dayCanceladas.length });
    }
    setChartData(days);
    setLoading(false);
  };

  const statCards = [
    { label: "Corridas Finalizadas", value: stats.corridas, icon: Car, color: "hsl(199, 89%, 48%)" },
    { label: "Passageiros", value: stats.passageiros, icon: Users, color: "hsl(142, 71%, 45%)" },
    { label: "Motoristas", value: stats.motoristas, icon: UserCheck, color: "hsl(25, 95%, 53%)" },
    { label: "Faturamento", value: `R$ ${stats.faturamento.toFixed(2)}`, icon: DollarSign, color: "hsl(210, 100%, 56%)" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: stat.color }}>
                <stat.icon size={22} className="text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Performance dos Últimos 9 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.some(d => d.finalizadas > 0 || d.canceladas > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                <XAxis dataKey="name" stroke="hsl(0 0% 60%)" fontSize={12} />
                <YAxis stroke="hsl(0 0% 60%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 7%)",
                    border: "1px solid hsl(0 0% 18%)",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="faturamento" stroke="hsl(210 100% 56%)" name="Faturamento (R$)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="finalizadas" stroke="hsl(142 71% 45%)" name="Finalizadas" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="canceladas" stroke="hsl(0 72% 51%)" name="Canceladas" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado disponível para o período.</p>
          )}
        </CardContent>
      </Card>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Star size={16} className="text-yellow-500" />
              Avaliações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRatings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação recente.</p>
            ) : recentRatings.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < r.nota ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" />
              Top Motoristas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topDrivers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum motorista registrado.</p>
            ) : topDrivers.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary w-5">{i + 1}º</span>
                  <span className="text-sm font-medium">{d.nome}</span>
                </div>
                <span className="text-xs text-muted-foreground">{d.corridas} corridas</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Resumo Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Média por corrida</span>
              <span className="text-sm font-bold text-primary">
                R$ {stats.corridas > 0 ? (stats.faturamento / stats.corridas).toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Corridas/motorista</span>
              <span className="text-sm font-bold">
                {stats.motoristas > 0 ? (stats.corridas / stats.motoristas).toFixed(1) : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Passageiros/motorista</span>
              <span className="text-sm font-bold">
                {stats.motoristas > 0 ? (stats.passageiros / stats.motoristas).toFixed(1) : "0"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
