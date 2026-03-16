import { useState } from "react";
import { Phone, MessageCircle, Shield, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUPPORT_PHONE = "5581991397867";

const EmergencyFAB = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-28 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <>
            {/* Call 190 */}
            <motion.a
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ delay: 0.05 }}
              href="tel:190"
              className="flex items-center gap-2 bg-destructive text-destructive-foreground rounded-full pl-3 pr-4 py-2.5 shadow-lg"
            >
              <Phone size={16} />
              <span className="text-xs font-bold">Ligar 190</span>
            </motion.a>

            {/* WhatsApp Support */}
            <motion.a
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              href={`https://wa.me/${SUPPORT_PHONE}?text=Preciso de ajuda urgente!`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-success text-white rounded-full pl-3 pr-4 py-2.5 shadow-lg"
            >
              <MessageCircle size={16} />
              <span className="text-xs font-bold">Suporte WhatsApp</span>
            </motion.a>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
          open
            ? "bg-muted text-muted-foreground rotate-45"
            : "bg-destructive text-destructive-foreground"
        }`}
      >
        {open ? <X size={22} /> : <Shield size={22} />}
      </button>
    </div>
  );
};

export default EmergencyFAB;
