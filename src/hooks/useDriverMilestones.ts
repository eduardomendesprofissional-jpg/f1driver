import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import confetti from "canvas-confetti";

export interface Milestone {
  key: string;
  rides: number;
  icon: string;
  title: string;
  message: string;
  hasWhatsapp: boolean;
}

export const MILESTONES: Milestone[] = [
  { key: "first", rides: 1, icon: "🏁", title: "Primeira Corrida", message: "Você completou sua primeira corrida! Bem vindo ao time!", hasWhatsapp: false },
  { key: "bronze", rides: 10, icon: "🥉", title: "10 Corridas", message: "10 corridas completadas! Você está pegando o jeito!", hasWhatsapp: false },
  { key: "silver", rides: 100, icon: "🥈", title: "100 Corridas", message: "100 corridas! Você é um motorista experiente!", hasWhatsapp: false },
  { key: "gold", rides: 500, icon: "🥇", title: "500 Corridas", message: "500 corridas! Você é um veterano das estradas!", hasWhatsapp: false },
  { key: "legend", rides: 1000, icon: "🏆", title: "1.000 Corridas", message: "1.000 corridas! Você é lenda! Entre em contato com o suporte para retirar seu prêmio!", hasWhatsapp: true },
  { key: "diamond", rides: 10000, icon: "💎", title: "10.000 Corridas", message: "10.000 corridas! Nível Diamond! Entre em contato com o suporte para retirar seu prêmio especial!", hasWhatsapp: true },
];

export interface AchievedMilestone {
  marco_key: string;
  conquistado_em: string;
}

export const useDriverMilestones = () => {
  const { user } = useAuth();
  const [achieved, setAchieved] = useState<AchievedMilestone[]>([]);
  const [totalRides, setTotalRides] = useState(0);
  const [pendingMilestone, setPendingMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [achievedRes, ridesRes] = await Promise.all([
      supabase.from("driver_conquistas").select("marco_key, conquistado_em").eq("driver_id", user.id),
      supabase.from("rides").select("id", { count: "exact", head: true }).eq("motorista_id", user.id).eq("status", "finalizada"),
    ]);

    const achievedData = (achievedRes.data || []) as AchievedMilestone[];
    const count = ridesRes.count || 0;

    setAchieved(achievedData);
    setTotalRides(count);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const checkMilestones = useCallback(async (currentRideCount?: number) => {
    if (!user) return;
    const count = currentRideCount ?? totalRides;
    const achievedKeys = new Set(achieved.map(a => a.marco_key));

    for (const m of MILESTONES) {
      if (count >= m.rides && !achievedKeys.has(m.key)) {
        // Insert achievement
        const { error } = await supabase.from("driver_conquistas").insert({
          driver_id: user.id,
          marco_key: m.key,
        } as any);

        if (!error) {
          setPendingMilestone(m);
          // Fire confetti
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } }), 300);
          // Refresh data
          await fetchData();
          break; // Show one at a time
        }
      }
    }
  }, [user, totalRides, achieved, fetchData]);

  const dismissMilestone = useCallback(() => setPendingMilestone(null), []);

  const getNextMilestone = useCallback(() => {
    const achievedKeys = new Set(achieved.map(a => a.marco_key));
    return MILESTONES.find(m => !achievedKeys.has(m.key)) || null;
  }, [achieved]);

  const getRidesUntilNext = useCallback(() => {
    const next = getNextMilestone();
    if (!next) return 0;
    return Math.max(0, next.rides - totalRides);
  }, [getNextMilestone, totalRides]);

  return {
    achieved,
    totalRides,
    loading,
    pendingMilestone,
    checkMilestones,
    dismissMilestone,
    getNextMilestone,
    getRidesUntilNext,
    fetchData,
  };
};
