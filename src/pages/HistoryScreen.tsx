import { motion } from "framer-motion";
import { MapPin, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const rides = [
  { id: 1, date: "09 Mar 2026", dest: "Shopping Iguatemi", value: "R$ 18,50", status: "concluída" as const },
  { id: 2, date: "08 Mar 2026", dest: "Aeroporto Internacional", value: "R$ 42,00", status: "concluída" as const },
  { id: 3, date: "07 Mar 2026", dest: "Rodoviária Central", value: "R$ 25,00", status: "cancelada" as const },
  { id: 4, date: "06 Mar 2026", dest: "Hospital São Lucas", value: "R$ 15,80", status: "concluída" as const },
  { id: 5, date: "05 Mar 2026", dest: "Universidade Federal", value: "R$ 12,00", status: "concluída" as const },
];

const HistoryScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Histórico de corridas</h1>
      </div>

      <div className="px-4 space-y-3">
        {rides.map((ride, i) => (
          <motion.div
            key={ride.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <MapPin size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{ride.dest}</p>
              <p className="text-xs text-muted-foreground">{ride.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{ride.value}</p>
              <div className="flex items-center gap-1 justify-end">
                {ride.status === "concluída" ? (
                  <CheckCircle size={12} className="text-success" />
                ) : (
                  <XCircle size={12} className="text-destructive" />
                )}
                <span className={`text-xs ${ride.status === "concluída" ? "text-success" : "text-destructive"}`}>
                  {ride.status}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav active="history" role="passenger" />
    </div>
  );
};

export default HistoryScreen;
