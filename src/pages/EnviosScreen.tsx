import { motion } from "framer-motion";
import { Package, ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const EnviosScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Envios</h1>
      </div>

      <div className="px-4 space-y-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/passenger")}
          className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package size={24} className="text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">Enviar encomenda</p>
            <p className="text-xs text-muted-foreground">Envie pacotes de forma rápida e segura</p>
          </div>
          <Plus size={20} className="text-muted-foreground" />
        </motion.button>

        <div className="pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Envios recentes</p>
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum envio registrado.</p>
        </div>
      </div>

      <BottomNav active="envios" role="passenger" />
    </div>
  );
};

export default EnviosScreen;
