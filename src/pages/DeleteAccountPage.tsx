import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, ArrowLeft, CheckCircle2, ShieldAlert, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logo from "@/assets/logo-f1driver.jpeg";

const DeleteAccountPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Step: login -> confirm -> done
  const [step, setStep] = useState<"login" | "confirm" | "done">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<string>("");

  useEffect(() => {
    if (!authLoading && user) {
      setEmail(user.email ?? "");
      setStep("confirm");
    }
  }, [authLoading, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Informe e-mail e senha da conta a excluir.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStep("confirm");
    } catch (err: any) {
      toast.error(err.message || "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user && step !== "confirm") return;
    if (confirmation !== "EXCLUIR") {
      toast.error("Digite EXCLUIR para confirmar.");
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const uid = sessionData.user?.id;
      if (!uid) throw new Error("Sessão expirada. Faça login novamente.");

      // Captura tipo (motorista/passageiro) para a mensagem final
      const { data: prof } = await supabase
        .from("profiles")
        .select("tipo")
        .eq("id", uid)
        .maybeSingle();
      if (prof?.tipo) setTipo(prof.tipo);

      const { error } = await supabase.rpc("delete_user_data", { p_user_id: uid });
      if (error) throw error;

      await supabase.auth.signOut();
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir conta.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Voltar</span>
          </button>
          <img src={logo} alt="F1 Driver" className="w-10 h-10 rounded-xl object-contain" />
        </div>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={32} className="text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Excluir minha conta</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Você pode solicitar a exclusão da sua conta F1 Driver — válido para passageiros e
            motoristas — diretamente nesta página.
          </p>
        </div>

        {/* Aviso de 14 dias */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex gap-3">
          <ShieldAlert size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/90 leading-relaxed">
            <strong className="text-primary">A exclusão pode ser revogada em até 14 dias.</strong>{" "}
            Durante esse período, basta entrar em contato pelo suporte que sua conta e seus dados
            serão restaurados. Após 14 dias, a remoção é definitiva.
          </div>
        </div>

        {/* STEP: LOGIN */}
        {step === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Entre com a conta que deseja excluir:
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-9"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Entrar para excluir
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Não lembra a senha?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary underline"
              >
                Recuperar acesso
              </button>
            </p>
          </form>
        )}

        {/* STEP: CONFIRM */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-foreground/90 leading-relaxed space-y-2">
              <p><strong className="text-destructive">O que será removido:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Perfil, nome, foto, CPF e dados pessoais</li>
                <li>Histórico de corridas e entregas</li>
                <li>Avaliações, conversas e indicações</li>
                <li>Saldo, contas bancárias e métodos de pagamento</li>
                <li>Dados de motorista (CNH, veículo, saldo de crédito) se houver</li>
              </ul>
            </div>

            {email && (
              <p className="text-xs text-muted-foreground text-center">
                Conta: <strong className="text-foreground">{email}</strong>
              </p>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Digite <strong className="text-foreground">EXCLUIR</strong> para confirmar:
              </Label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                placeholder="EXCLUIR"
                className="text-center font-mono tracking-widest"
              />
            </div>

            <div className="space-y-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || confirmation !== "EXCLUIR"}
                className="w-full"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Excluir minha conta agora
              </Button>
              <Button variant="ghost" onClick={() => navigate(-1)} className="w-full">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* STEP: DONE */}
        {step === "done" && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h2 className="text-xl font-bold">Conta excluída</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sua conta {tipo ? <strong className="text-foreground">de {tipo}</strong> : null} foi
              removida do F1 Driver com sucesso.
            </p>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs text-foreground/90 leading-relaxed text-left">
              <strong className="text-primary block mb-1">Mudou de ideia?</strong>
              Você tem até <strong>14 dias</strong> para solicitar a reversão da exclusão pelo
              suporte:{" "}
              <a
                href="mailto:suporte@f1driver.com"
                className="text-primary underline"
              >
                suporte@f1driver.com
              </a>
              . Após esse período, a remoção é permanente.
            </div>
            <Button className="w-full" onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center pt-4">
          F1 Driver · Política de exclusão de conta conforme exigências de Google Play e LGPD.
        </p>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
