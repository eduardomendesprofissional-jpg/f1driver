import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo-f1driver.jpeg";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"passenger" | "driver">("passenger");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(mode === "passenger" ? "/passenger" : "/driver");
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

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
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

          <Button type="submit" className="w-full h-12 text-base font-bold glow-blue">
            Entrar
          </Button>
        </form>

        <button className="flex items-center gap-3 w-full h-12 px-4 rounded-lg bg-secondary border border-border justify-center font-semibold text-sm text-foreground hover:bg-muted transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </button>

        <p className="text-sm text-muted-foreground">
          Não tem conta?{" "}
          <button className="text-primary font-semibold hover:underline">Criar conta</button>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
