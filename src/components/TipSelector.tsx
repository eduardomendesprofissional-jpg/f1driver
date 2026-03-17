import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TipSelectorProps {
  rideId: string;
  onTipSent?: () => void;
}

const tipOptions = [2, 5, 10];

const TipSelector = ({ rideId, onTipSent }: TipSelectorProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const value = selected || Number(custom);
    if (!value || value <= 0) {
      toast.error("Selecione ou digite um valor de gorjeta.");
      return;
    }
    setSending(true);
    const { error } = await supabase
      .from("rides")
      .update({ gorjeta: value } as any)
      .eq("id", rideId);
    setSending(false);
    if (error) {
      toast.error("Erro ao enviar gorjeta.");
    } else {
      toast.success(`Gorjeta de R$ ${value.toFixed(2)} enviada! 🎉`);
      setSent(true);
      onTipSent?.();
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <Heart size={18} className="text-green-500 fill-green-500" />
        <span className="text-sm font-semibold text-green-500">Gorjeta enviada! Obrigado! 💚</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Heart size={12} /> Gorjeta para o motorista
      </p>
      <div className="flex gap-2">
        {tipOptions.map((val) => (
          <button
            key={val}
            onClick={() => { setSelected(val); setCustom(""); }}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              selected === val
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            }`}
          >
            R$ {val}
          </button>
        ))}
        <div className="flex-1">
          <input
            type="number"
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
            placeholder="Outro"
            className="w-full h-full bg-secondary text-center rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30 px-2"
          />
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={sending || (!selected && !custom)}
        className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-bold text-sm disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} />}
        {sending ? "Enviando..." : "Enviar gorjeta"}
      </button>
    </div>
  );
};

export default TipSelector;
