import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useDriverMilestones, MILESTONES } from "@/hooks/useDriverMilestones";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const DriverAchievements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { achieved, totalRides, loading, getNextMilestone, getRidesUntilNext } = useDriverMilestones();

  const achievedMap = new Map(achieved.map(a => [a.marco_key, a.conquistado_em]));
  const nextMilestone = getNextMilestone();
  const ridesUntilNext = getRidesUntilNext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Minhas Conquistas</h1>
            <p className="text-xs text-muted-foreground">{totalRides} corridas completadas</p>
          </div>
          <div className="ml-auto">
            <Trophy size={24} className="text-primary" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress to next milestone */}
        {nextMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Próximo marco</span>
              <span className="text-2xl">{nextMilestone.icon}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {ridesUntilNext > 0
                ? `${ridesUntilNext} corrida${ridesUntilNext > 1 ? "s" : ""} para "${nextMilestone.title}"`
                : "Você já atingiu este marco!"}
            </p>
            <Progress
              value={Math.min(100, (totalRides / nextMilestone.rides) * 100)}
              className="h-3 rounded-full"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">{totalRides}</span>
              <span className="text-[10px] text-muted-foreground">{nextMilestone.rides.toLocaleString("pt-BR")}</span>
            </div>
          </motion.div>
        )}

        {/* Milestones grid */}
        <div className="space-y-3">
          {MILESTONES.map((m, i) => {
            const isAchieved = achievedMap.has(m.key);
            const date = achievedMap.get(m.key);

            return (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl border p-5 transition-all ${
                  isAchieved
                    ? "bg-card border-primary/30 shadow-lg"
                    : "bg-card/40 border-border/50 opacity-50 grayscale"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-5xl ${!isAchieved ? "grayscale" : ""}`}>{m.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base ${isAchieved ? "text-foreground" : "text-muted-foreground"}`}>
                      {m.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.message}</p>
                    {isAchieved && date && (
                      <p className="text-[10px] text-primary font-semibold mt-1.5">
                        ✅ Conquistado em {new Date(date).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {!isAchieved && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {m.rides <= totalRides ? "Disponível para resgate" : `${m.rides.toLocaleString("pt-BR")} corridas necessárias`}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DriverAchievements;
