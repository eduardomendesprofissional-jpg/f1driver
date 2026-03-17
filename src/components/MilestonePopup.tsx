import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Milestone } from "@/hooks/useDriverMilestones";

interface MilestonePopupProps {
  milestone: Milestone | null;
  driverName?: string;
  onDismiss: () => void;
}

const MilestonePopup = ({ milestone, driverName, onDismiss }: MilestonePopupProps) => {
  if (!milestone) return null;

  const whatsappMsg = encodeURIComponent(
    `Olá! Sou motorista do F1 Driver e acabei de atingir ${milestone.rides.toLocaleString("pt-BR")} corridas! Gostaria de retirar meu prêmio 🏆`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMsg}`;

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-7xl mb-4"
            >
              {milestone.icon}
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-1">Parabéns{driverName ? `, ${driverName}` : ""}!</h2>
            <h3 className="text-lg font-semibold text-primary mb-3">{milestone.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{milestone.message}</p>

            {milestone.hasWhatsapp && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block mb-3">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl">
                  💬 Falar com Suporte
                </Button>
              </a>
            )}

            <Button variant="outline" onClick={onDismiss} className="w-full rounded-xl">
              Fechar
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MilestonePopup;
