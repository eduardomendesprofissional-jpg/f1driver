import { Car, Users, UserCheck, Headphones, Clock, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const stats = [
  { label: "Corridas Finalizadas", value: 0, icon: Car, color: "hsl(199, 89%, 48%)" },
  { label: "Novos Passageiros", value: 0, icon: Users, color: "hsl(142, 71%, 45%)" },
  { label: "Novos Motoristas", value: 0, icon: UserCheck, color: "hsl(25, 95%, 53%)" },
  { label: "Suporte Pendente", value: 0, icon: Headphones, color: "hsl(0, 72%, 51%)" },
];

const chartData: { name: string; faturamento: number; finalizadas: number; canceladas: number }[] = [];

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: stat.color }}
              >
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
          <CardTitle className="text-base font-semibold">Performance dos Últimos 9 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
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
                <Line type="monotone" dataKey="finalizadas" stroke="hsl(142 71% 45%)" name="Corridas Finalizadas" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="canceladas" stroke="hsl(0 72% 51%)" name="Canceladas" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado disponível.</p>
          )}
        </CardContent>
      </Card>

      {/* Monitoramento de Turnos */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            Monitoramento de Turnos
          </CardTitle>
          <p className="text-xs text-muted-foreground">ℹ O registro é gerado quando o motorista abre ou fecha o app.</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro recente.</p>
        </CardContent>
      </Card>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Headphones size={16} />
              Suporte Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum chamado recente.</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Star size={16} className="text-yellow-500" />
              Avaliações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação recente.</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" />
              Top Motoristas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum motorista registrado.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
