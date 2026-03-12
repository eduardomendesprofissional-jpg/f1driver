import { motion } from "framer-motion";
import { MapPin, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

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

      <div className="px-4">
        <p className="text-sm text-muted-foreground text-center py-12">Nenhuma corrida registrada.</p>
      </div>

      <BottomNav active="history" role="passenger" />
    </div>
  );
};

export default HistoryScreen;
