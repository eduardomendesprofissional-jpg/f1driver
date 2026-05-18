import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Chrome, Menu, PlusSquare, CheckCircle2, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    num: 1,
    icon: Chrome,
    title: "Abra o Chrome",
    desc: "Acesse o Painel Administrativo pelo navegador Chrome no seu celular Android.",
  },
  {
    num: 2,
    icon: Menu,
    title: "Toque no menu (⋮)",
    desc: "No canto superior direito do Chrome, toque nos três pontinhos para abrir as opções.",
  },
  {
    num: 3,
    icon: PlusSquare,
    title: "Adicionar à tela inicial",
    desc: "Role o menu e toque em 'Adicionar à tela inicial' ou 'Instalar app'.",
  },
  {
    num: 4,
    icon: CheckCircle2,
    title: "Confirme a instalação",
    desc: "Toque em 'Adicionar' ou 'Instalar'. O ícone do F1 Driver Admin aparecerá na sua tela inicial.",
  },
];

const AdminInstallGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-4 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-base font-bold">Salvar Painel Admin</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Monitor className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Acesse em um toque</h2>
          <p className="text-sm text-muted-foreground">
            Salve o Painel Administrativo F1 Driver na tela inicial do seu Android para acesso rápido, sem digitar URL.
          </p>
        </motion.div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50 border border-border"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Passo {step.num}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-0.5">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Pronto! Agora o Painel Admin funciona como um app nativo, com ícone próprio e acesso offline.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminInstallGuide;
