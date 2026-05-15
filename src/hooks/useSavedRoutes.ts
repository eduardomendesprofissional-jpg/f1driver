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
  favorito: boolean;
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
      .order("favorito", { ascending: false })
      .order("usado_em", { ascending: false })
      .limit(15);
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
    favorito?: boolean;
  }) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("rotas_salvas")
      .select("id, vezes_usado, favorito")
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
          ...(route.favorito !== undefined ? { favorito: route.favorito } : {}),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("rotas_salvas").insert({
        user_id: user.id,
        ...route,
        favorito: route.favorito ?? false,
      });
    }
    fetchRoutes();
  };

  const toggleFavorite = async (route: {
    origem_endereco: string;
    origem_lat: number;
    origem_lng: number;
    destino_endereco: string;
    destino_lat: number;
    destino_lng: number;
  }) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("rotas_salvas")
      .select("id, favorito")
      .eq("user_id", user.id)
      .eq("destino_endereco", route.destino_endereco)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("rotas_salvas")
        .update({ favorito: !existing.favorito })
        .eq("id", existing.id);
    } else {
      // Fallback: check for an existing route by nearby coordinates
      // 0.0005 degrees ≈ 55m — close enough to be the same place
      const { data: nearby } = await supabase
        .from("rotas_salvas")
        .select("id, favorito")
        .eq("user_id", user.id)
        .gte("destino_lat", route.destino_lat - 0.0005)
        .lte("destino_lat", route.destino_lat + 0.0005)
        .gte("destino_lng", route.destino_lng - 0.0005)
        .lte("destino_lng", route.destino_lng + 0.0005)
        .maybeSingle();

      if (nearby) {
        await supabase
          .from("rotas_salvas")
          .update({ favorito: !nearby.favorito })
          .eq("id", nearby.id);
      } else {
        await supabase.from("rotas_salvas").insert({
          user_id: user.id,
          ...route,
          favorito: true,
          vezes_usado: 0,
        });
      }
    }
    fetchRoutes();
  };

  const isFavorite = (destinoEndereco: string) =>
    routes.some((r) => r.destino_endereco === destinoEndereco && r.favorito);

  return { routes, loading, saveRoute, toggleFavorite, isFavorite, refetch: fetchRoutes };
};
