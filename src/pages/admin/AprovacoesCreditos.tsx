import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Image, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface DepositRow {
  id: string;
  perfil_id: string;
  valor: number;
  url_comprovante: string | null;
  status: string;
  created_at: string;
  driver_name?: string;
}

const AprovacoesCreditos = () => {
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("extrato_creditos" as any)
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: true });

    const rows = (data as any[]) || [];

    // Fetch driver names
    const ids = [...new Set(rows.map((r: any) => r.perfil_id))];
    let namesMap: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome")
        .in("id", ids);
      (profiles || []).forEach((p: any) => {
        namesMap[p.id] = p.nome || "Sem nome";
      });
    }

    setDeposits(rows.map((r: any) => ({ ...r, driver_name: namesMap[r.perfil_id] || "Sem nome" })));
    setLoading(false);
  };

  const handleAction = async (id: string, newStatus: "aprovado" | "rejeitado") => {
    setProcessing(id);
    const { error } = await supabase
      .from("extrato_creditos" as any)
      .update({ status: newStatus } as any)
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success(newStatus === "aprovado" ? "Depósito aprovado! Saldo atualizado." : "Depósito rejeitado.");
      setDeposits((prev) => prev.filter((d) => d.id !== id));
    }
    setProcessing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aprovações de Créditos</h1>
        <p className="text-sm text-muted-foreground">Depósitos PIX pendentes de conferência</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : deposits.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum depósito pendente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deposits.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{d.driver_name}</p>
                    <p className="text-2xl font-bold text-primary">R$ {Number(d.valor).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  {d.url_comprovante && (
                    <a href={d.url_comprovante} target="_blank" rel="noopener noreferrer">
                      <img
                        src={d.url_comprovante}
                        alt="Comprovante"
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                    </a>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    className="flex-1"
                    onClick={() => handleAction(d.id, "aprovado")}
                    disabled={processing === d.id}
                  >
                    {processing === d.id ? (
                      <Loader2 className="animate-spin mr-1" size={16} />
                    ) : (
                      <CheckCircle2 size={16} className="mr-1" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleAction(d.id, "rejeitado")}
                    disabled={processing === d.id}
                  >
                    <XCircle size={16} className="mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AprovacoesCreditos;
