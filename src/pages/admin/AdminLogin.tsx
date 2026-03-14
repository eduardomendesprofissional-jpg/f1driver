import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo-f1driver.jpeg";

const ADMIN_EMAIL = "admin@f1driver.com";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (email !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        toast.error("Acesso restrito. Este login é apenas para administradores.");
        return;
      }

      navigate("/admin");
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
        <img src={logo} alt="F1 Driver" className="w-24 h-24 object-contain rounded-xl" />

        <div className="flex items-center gap-2 text-primary">
          <Shield size={20} />
          <h1 className="text-lg font-bold text-foreground">Painel Administrativo</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="email"
              placeholder="E-mail do administrador"
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
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Entrar como Admin"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
