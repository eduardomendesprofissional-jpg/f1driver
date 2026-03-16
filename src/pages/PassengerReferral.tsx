import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Gift, Users, CheckCircle, Clock, Share2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface Indicacao {
  id: string;
  referred_email: string;
  status: string;
  bonus_valor: number;
  created_at: string;
}

const PassengerReferral = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [codigoIndicacao, setCodigoIndicacao] = useState("");
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailConvite, setEmailConvite] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("codigo_indicacao")
      .eq("id", user!.id)
      .single();

    if (profile) {
      let code = (profile as any).codigo_indicacao;
      if (!code) {
        code = `F1-${user!.id.slice(0, 6).toUpperCase()}`;
        await supabase.from("profiles").update({ codigo_indicacao: code } as any).eq("id", user!.id);
      }
      setCodigoIndicacao(code);
    }

    const { data: refs } = await supabase
      .from("indicacoes" as any)
      .select("*")
      .eq("referrer_id", user!.id)
      .order("created_at", { ascending: false });
    if (refs) setIndicacoes(refs as any);
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codigoIndicacao);
    toast.success("Código copiado!");
  };

  const shareCode = () => {
    const text = `🚗 Use meu código ${codigoIndicacao} para se cadastrar no F1Driver e ganhe um bônus na sua primeira corrida!`;
    if (navigator.share) {
      navigator.share({ title: "Indique e Ganhe - F1Driver", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Texto copiado para compartilhar!");
    }
  };

  const sendInvite = async () => {
    if (!emailConvite.trim() || !emailConvite.includes("@")) {
      return toast.error("Digite um e-mail válido");
    }
    setSending(true);
    const { error } = await supabase.from("indicacoes" as any).insert({
      referrer_id: user!.id,
      referred_email: emailConvite.trim().toLowerCase(),
    } as any);
    setSending(false);
    if (error) {
      if (error.code === "23505") return toast.error("Este e-mail já foi indicado");
      return toast.error("Erro ao enviar convite");
    }
    toast.success("Convite registrado!");
    setEmailConvite("");
    fetchData();
  };

  const totalGanho = indicacoes.filter((i) => i.status === "concluida").reduce((acc, i) => acc + Number(i.bonus_valor), 0);
  const pendentes = indicacoes.filter((i) => i.status === "pendente").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-lg z-10 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Indique e Ganhe</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-4 mt-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Gift size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">Ganhe R$ 10,00 por indicação!</h2>
            <p className="text-sm text-muted-foreground">
              Convide amigos para o F1Driver. Quando completarem a primeira corrida, vocês dois ganham!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Seu código</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary rounded-xl px-4 py-3 text-center">
                <span className="text-xl font-bold tracking-widest text-primary">{codigoIndicacao}</span>
              </div>
              <Button variant="outline" size="icon" onClick={copyCode} className="h-12 w-12 border-primary/30">
                <Copy size={18} className="text-primary" />
              </Button>
            </div>
            <Button className="w-full h-11 font-bold" onClick={shareCode}>
              <Share2 size={16} className="mr-2" />
              Compartilhar
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-3 text-center">
              <Users size={20} className="mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">{indicacoes.length}</p>
              <p className="text-[10px] text-muted-foreground">Indicações</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3 text-center">
              <Clock size={20} className="mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold">{pendentes}</p>
              <p className="text-[10px] text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3 text-center">
              <CheckCircle size={20} className="mx-auto text-success mb-1" />
              <p className="text-lg font-bold text-success">R$ {totalGanho.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">Ganhos</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Convidar por e-mail</p>
            <div className="flex gap-2">
              <Input
                placeholder="email@exemplo.com"
                value={emailConvite}
                onChange={(e) => setEmailConvite(e.target.value)}
                type="email"
              />
              <Button onClick={sendInvite} disabled={sending} className="shrink-0">
                {sending ? <Loader2 size={16} className="animate-spin" /> : "Enviar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {indicacoes.length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Histórico</p>
              {indicacoes.map((ind) => (
                <div key={ind.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{ind.referred_email}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(ind.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant={ind.status === "concluida" ? "default" : "secondary"} className="text-[10px]">
                    {ind.status === "pendente" ? "Pendente" : "Concluída"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>

      <BottomNav active="profile" role="passenger" />
    </div>
  );
};

export default PassengerReferral;
