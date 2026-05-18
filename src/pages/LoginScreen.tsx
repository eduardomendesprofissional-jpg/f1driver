import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, Lock, User, Car, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo-f1driver.jpeg";

const ForgotPassword = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) { toast.error("Digite seu e-mail."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("E-mail de recuperação enviado!");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar e-mail.");
    } finally { setLoading(false); }
  };

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="text-sm text-primary hover:underline self-end">
      Esqueci minha senha
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="w-full flex flex-col gap-3 p-4 bg-secondary/60 rounded-2xl border border-border/50">
      <p className="text-sm text-foreground font-semibold">Recuperar senha</p>
      <Input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)}
        className="bg-background/50 border-border h-11 text-foreground placeholder:text-muted-foreground rounded-xl" />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
        <Button type="button" size="sm" onClick={handleReset} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Enviar"}
        </Button>
      </div>
    </motion.div>
  );
};

interface Props {
  forcedRole?: "passageiro" | "motorista";
}

const LoginScreen = ({ forcedRole }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role: "passageiro" | "motorista" =
    forcedRole || (location.pathname.includes("/motorista") ? "motorista" : "passageiro");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const isDriver = role === "motorista";
  const RoleIcon = isDriver ? Car : User;
  const roleLabel = isDriver ? "Motorista" : "Passageiro";
  const otherRoute = isDriver ? "/login" : "/login/motorista";
  const otherLabel = isDriver ? "Sou passageiro" : "Sou motorista";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha todos os campos."); return; }
    if (isSignUp && !acceptedPrivacy) { toast.error("Aceite a Política de Privacidade para continuar."); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { nome, tipo: role },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;

        // Supabase retorna identities vazio quando o e-mail já existe (anti-enumeração)
        const identities = (signUpData.user as any)?.identities;
        if (Array.isArray(identities) && identities.length === 0) {
          toast.error("Este e-mail já está cadastrado. Faça login ou use 'Reenviar confirmação' abaixo.");
          setIsSignUp(false);
          return;
        }
        toast.success("Conta criada! Verifique seu e-mail para confirmar (cheque também a caixa de spam).");
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Validate access against the chosen portal
        const userId = data.user?.id;
        let allowed = false;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("tipo, tem_perfil_passageiro, tem_perfil_motorista")
            .eq("id", userId)
            .maybeSingle();

          if (profile) {
            allowed = isDriver
              ? (!!profile.tem_perfil_motorista || profile.tipo === "motorista")
              : (!!profile.tem_perfil_passageiro || profile.tipo === "passageiro");
          } else {
            // Fallback to metadata when profile row hasn't been created yet
            const metaTipo = data.user?.user_metadata?.tipo;
            allowed = isDriver ? metaTipo === "motorista" : metaTipo !== "motorista";
          }
        }

        if (!allowed) {
          await supabase.auth.signOut();
          toast.error(
            isDriver
              ? "Esta conta não tem perfil de motorista. Entre como passageiro ou cadastre-se como motorista."
              : "Esta conta não tem perfil de passageiro. Entre como motorista ou cadastre-se como passageiro."
          );
          return;
        }

        // Align active role with the portal used
        await supabase.auth.updateUser({ data: { tipo: role } });
        await supabase.from("profiles").update({ tipo: role }).eq("id", userId!);

        navigate(isDriver ? "/driver" : "/passenger");
      }
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (isSignUp && /already|registered|exists/i.test(msg)) {
        toast.error("Este e-mail já tem conta. Faça login e ative o outro perfil em Conta → Trocar perfil.");
      } else {
        toast.error(msg || "Erro ao autenticar.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 safe-top safe-bottom relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full pointer-events-none opacity-[0.06]"
        style={{ background: "radial-gradient(circle, hsl(210 100% 56%) 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm flex flex-col items-center gap-6 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="F1 Driver" className="w-20 h-20 object-contain rounded-2xl shadow-lg" />
          <h1 className="text-xl font-black text-gradient-blue tracking-tight">F1 Driver</h1>
        </div>

        {/* Role badge (locked) */}
        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-semibold">
          <RoleIcon size={18} />
          Acesso de {roleLabel}
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)}
                className="pl-11 bg-secondary/50 border-border/40 h-13 text-foreground placeholder:text-muted-foreground rounded-xl" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
              className="pl-11 bg-secondary/50 border-border/40 h-13 text-foreground placeholder:text-muted-foreground rounded-xl" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input type={showPw ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
              className="pl-11 pr-11 bg-secondary/50 border-border/40 h-13 text-foreground placeholder:text-muted-foreground rounded-xl" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isSignUp && (
            <div className="flex items-start gap-2 mt-1">
              <Checkbox
                id="privacy"
                checked={acceptedPrivacy}
                onCheckedChange={(v) => setAcceptedPrivacy(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="privacy" className="text-xs text-muted-foreground leading-tight">
                Li e aceito a{" "}
                <Link to="/privacy-policy" className="text-primary underline" target="_blank">
                  Política de Privacidade
                </Link>
              </label>
            </div>
          )}

          <Button type="submit" className="w-full h-13 text-base font-bold glow-blue rounded-xl mt-1" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : isSignUp ? `Criar conta de ${roleLabel}` : `Entrar como ${roleLabel}`}
          </Button>

          {!isSignUp && <ForgotPassword />}
          {!isSignUp && (
            <button
              type="button"
              onClick={async () => {
                if (!email) { toast.error("Digite seu e-mail primeiro."); return; }
                setLoading(true);
                try {
                  const { error } = await supabase.auth.resend({
                    type: "signup",
                    email,
                    options: { emailRedirectTo: `${window.location.origin}/` },
                  });
                  if (error) throw error;
                  toast.success("E-mail de confirmação reenviado! Cheque sua caixa de entrada e spam.");
                } catch (err: any) {
                  toast.error(err.message || "Erro ao reenviar e-mail.");
                } finally { setLoading(false); }
              }}
              className="text-sm text-primary hover:underline self-end"
            >
              Reenviar e-mail de confirmação
            </button>
          )}
        </form>

        <p className="text-sm text-muted-foreground">
          {isSignUp ? "Já tem conta? " : "Não tem conta? "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-semibold hover:underline">
            {isSignUp ? "Entrar" : "Criar conta"}
          </button>
        </p>

        <Link to={otherRoute} className="text-xs text-muted-foreground hover:text-primary transition-colors">
          {otherLabel} →
        </Link>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
