import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SavedRoute {
  id: string;
  origem_endereco: string;
  origem_lat: number;
  origem_lng: number;
  destino_endereco: string;
  destino_lat: number;
  destino_lng: number;
  usado_em: string;
  vezes_usado: number;
}

export const useSavedRoutes = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutes = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("rotas_salvas")
      .select("*")
      .eq("user_id", user.id)
      .order("usado_em", { ascending: false })
      .limit(10);
    setRoutes((data as SavedRoute[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRoutes();
  }, [user]);

  const saveRoute = async (route: {
    origem_endereco: string;
    origem_lat: number;
    origem_lng: number;
    destino_endereco: string;
    destino_lat: number;
    destino_lng: number;
  }) => {
    if (!user) return;
    // Try to update existing, otherwise insert
    const { data: existing } = await supabase
      .from("rotas_salvas")
      .select("id, vezes_usado")
      .eq("user_id", user.id)
      .eq("destino_endereco", route.destino_endereco)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("rotas_salvas")
        .update({
          vezes_usado: (existing.vezes_usado || 1) + 1,
          usado_em: new Date().toISOString(),
          origem_endereco: route.origem_endereco,
          origem_lat: route.origem_lat,
          origem_lng: route.origem_lng,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("rotas_salvas").insert({
        user_id: user.id,
        ...route,
      });
    }
    fetchRoutes();
  };

  return { routes, loading, saveRoute, refetch: fetchRoutes };
};
