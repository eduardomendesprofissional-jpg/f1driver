import { Send, Bell, AlertTriangle, Users, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

const emojis = ["🚗", "😁", "🎁", "🧨", "⭐", "🎊", "🔥", "✅"];

const DispararNotificacao = () => {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleDisparar = () => {
    if (!titulo.trim()) { toast.error("Informe o título da notificação."); return; }
    if (!mensagem.trim()) { toast.error("Escreva a mensagem da notificação."); return; }
    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      toast.success("Notificação disparada com sucesso!");
      setTitulo(""); setMensagem("");
    }, 800);
  };

  const addEmoji = (emoji: string) => {
    setMensagem((prev) => prev + emoji);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border border-l-4 border-l-primary">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Passageiros Inscritos</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
            <Users size={32} className="text-muted-foreground/30" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border border-l-4 border-l-primary">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motoristas Inscritos</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
            <Car size={32} className="text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <span className="text-primary">ℹ</span> O número de inscritos aumenta automaticamente sempre que um usuário abre o aplicativo pela primeira vez e aceita os termos.
      </p>

      <Card className="bg-card border-border border-2 border-dashed border-emerald-500/30">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Send size={20} className="text-primary" />
            <div>
              <h2 className="text-lg font-bold text-primary">Criar Nova Notificação</h2>
              <p className="text-xs text-muted-foreground">Envie alertas, promoções e cupons para a tela do celular dos seus usuários.</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-xs text-amber-200">
              <AlertTriangle size={14} className="inline mr-1" />
              <strong>Atenção:</strong> A notificação será exibida na tela <strong className="text-rose-400">apenas para usuários que estiverem com o aplicativo totalmente fechado</strong>. Quem estiver com o app aberto ou minimizado no momento do disparo não será notificado pelo sistema.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-foreground">Público Alvo</label>
              <Select defaultValue="todos">
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos (0 usuários)</SelectItem>
                  <SelectItem value="passageiros">Passageiros</SelectItem>
                  <SelectItem value="motoristas">Motoristas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-foreground">Título da Mensagem</label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: 🚀 Nova Promoção Liberada!" className="bg-background border-border" />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-start gap-4">
              <label className="text-sm font-medium text-foreground pt-2">Mensagem (Corpo)</label>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Escreva sua mensagem aqui..."
                className="bg-background border-border min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-foreground">Emojis Rápidos:</label>
              <div className="flex gap-2">
                {emojis.map((e, i) => (
                  <button key={i} onClick={() => addEmoji(e)} className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-lg transition-colors">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleDisparar} disabled={enviando} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 h-11">
              <Bell size={16} />
              {enviando ? "Enviando..." : "Disparar Agora"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DispararNotificacao;
