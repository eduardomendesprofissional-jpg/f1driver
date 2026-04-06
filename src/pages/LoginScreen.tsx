import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Car, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [mode, setMode] = useState<"passenger" | "driver">("passenger");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Preencha todos os campos."); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { nome, tipo: mode === "passenger" ? "passageiro" : "motorista" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Navigate based on user metadata type
        const tipo = data.user?.user_metadata?.tipo;
        navigate(tipo === "motorista" ? "/driver" : "/passenger");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar.");
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
        className="w-full max-w-sm flex flex-col items-center gap-7 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="F1 Driver" className="w-20 h-20 object-contain rounded-2xl shadow-lg" />
          <h1 className="text-xl font-black text-gradient-blue tracking-tight">F1 Driver</h1>
        </div>

        {/* Mode Toggle */}
        <div className="flex w-full rounded-2xl bg-secondary/60 p-1 gap-1 border border-border/30">
          {[
            { key: "passenger" as const, icon: User, label: "Passageiro" },
            { key: "driver" as const, icon: Car, label: "Motorista" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === m.key
                  ? "bg-primary text-primary-foreground shadow-lg glow-blue"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <m.icon size={16} /> {m.label}
            </button>
          ))}
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

          <Button type="submit" className="w-full h-13 text-base font-bold glow-blue rounded-xl mt-1" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : isSignUp ? "Criar Conta" : "Entrar"}
          </Button>

          {!isSignUp && <ForgotPassword />}
        </form>

        <p className="text-sm text-muted-foreground">
          {isSignUp ? "Já tem conta? " : "Não tem conta? "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-semibold hover:underline">
            {isSignUp ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
