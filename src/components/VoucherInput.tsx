import { useState } from "react";
import { Ticket, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface VoucherInputProps {
  onApply: (voucherId: string, valor: number, empresaNome: string) => void;
}

const VoucherInput = ({ onApply }: VoucherInputProps) => {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<{ empresa: string; valor: number } | null>(null);

  const handleApply = async () => {
    if (!code.trim() || !user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("vouchers_corporativos")
        .select("*")
        .eq("codigo", code.trim().toUpperCase())
        .eq("ativo", true)
        .single() as any);

      if (error || !data) {
        toast.error("Voucher inválido ou expirado.");
        setLoading(false);
        return;
      }

      if (data.validade && new Date(data.validade) < new Date()) {
        toast.error("Voucher expirado.");
        setLoading(false);
        return;
      }

      const remaining = data.valor_limite - data.valor_usado;
      if (remaining <= 0) {
        toast.error("Voucher sem saldo disponível.");
        setLoading(false);
        return;
      }

      setApplied({ empresa: data.empresa_nome, valor: remaining });
      onApply(data.id, remaining, data.empresa_nome);
      toast.success(`Voucher ${data.empresa_nome} aplicado! Saldo: R$ ${remaining.toFixed(2)}`);
    } catch {
      toast.error("Erro ao validar voucher.");
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
        <Ticket size={16} className="text-green-500" />
        <div className="flex-1">
          <p className="text-xs font-bold text-green-500">{applied.empresa}</p>
          <p className="text-[10px] text-muted-foreground">Saldo: R$ {applied.valor.toFixed(2)}</p>
        </div>
        <button
          onClick={() => { setApplied(null); setCode(""); }}
          className="p-1 rounded-md hover:bg-muted"
        >
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-3">
        <Ticket size={14} className="text-muted-foreground shrink-0" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Voucher corporativo"
          className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <button
        onClick={handleApply}
        disabled={!code.trim() || loading}
        className="px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs disabled:opacity-50 flex items-center gap-1"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Aplicar
      </button>
    </div>
  );
};

export default VoucherInput;
