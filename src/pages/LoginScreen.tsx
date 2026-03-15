import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Car, Loader2 } from "lucide-react";
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
    if (!email) {
      toast.error("Digite seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar e-mail.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-primary hover:underline self-end"
      >
        Esqueci minha senha
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-secondary rounded-lg">
      <p className="text-sm text-foreground font-medium">Recuperar senha</p>
      <Input
        type="email"
        placeholder="Seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-background border-border h-10 text-foreground placeholder:text-muted-foreground"
      />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleReset} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Enviar"}
        </Button>
      </div>
    </div>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome,
              tipo: mode === "passenger" ? "passageiro" : "motorista",
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate(mode === "passenger" ? "/passenger" : "/driver");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        <img src={logo} alt="F1 Driver" className="w-32 h-32 object-contain rounded-xl" />

        {/* Mode Toggle */}
        <div className="flex w-full rounded-lg bg-secondary p-1 gap-1">
          <button
            onClick={() => setMode("passenger")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold transition-all ${
              mode === "passenger" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <User size={16} /> Passageiro
          </button>
          <button
            onClick={() => setMode("driver")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold transition-all ${
              mode === "driver" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Car size={16} /> Motorista
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="pl-10 bg-secondary border-border h-12 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-secondary border-border h-12 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-secondary border-border h-12 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-bold glow-blue" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : isSignUp ? "Criar Conta" : "Entrar"}
          </Button>

          {!isSignUp && (
            <ForgotPassword />
          )}
        </form>

        <p className="text-sm text-muted-foreground">
          {isSignUp ? "Já tem conta? " : "Não tem conta? "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-semibold hover:underline"
          >
            {isSignUp ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
