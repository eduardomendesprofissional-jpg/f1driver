import { MapPin, Plus, Trash2, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchCidadesBR = async (): Promise<{ nome: string; uf: string }[]> => {
  const allCidades: { nome: string; uf: string }[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("cidades_brasil")
      .select("nome, uf")
      .eq("ativo", true)
      .order("nome")
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (data && data.length > 0) {
      allCidades.push(...data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return allCidades;
};

const NovaCidade = () => {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [showSugestoes, setShowSugestoes] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: todasCidades = [], isLoading } = useQuery({
    queryKey: ["cidades-brasil"],
    queryFn: fetchCidadesBR,
    staleTime: Infinity,
  });

  const { data: cidades = [], isLoading: loadingCobertura } = useQuery({
    queryKey: ["cidades-cobertura"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cidades_cobertura")
        .select("id, nome, uf")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (cidade: { nome: string; uf: string }) => {
      const { error } = await supabase.from("cidades_cobertura").insert({ nome: cidade.nome, uf: cidade.uf });
      if (error) throw error;
    },
    onSuccess: (_, cidade) => {
      toast.success(`${cidade.nome} - ${cidade.uf} adicionada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["cidades-cobertura"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cidades_cobertura").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cidade removida.");
      queryClient.invalidateQueries({ queryKey: ["cidades-cobertura"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sugestoes =
    busca.trim().length >= 2
      ? todasCidades
          .filter(
            (c) =>
              c.nome.toLowerCase().includes(busca.toLowerCase()) &&
              !cidades.some(
                (cad) => cad.nome.toLowerCase() === c.nome.toLowerCase() && cad.uf === c.uf
              )
          )
          .slice(0, 10)
      : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSugestoes(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelecionar = (cidade: { nome: string; uf: string }) => {
    if (cidades.some((c) => c.nome === cidade.nome && c.uf === cidade.uf)) {
      toast.error("Cidade já cadastrada.");
      return;
    }
    addMutation.mutate(cidade);
    setBusca("");
    setShowSugestoes(false);
  };

  const handleAdicionar = () => {
    if (!busca.trim()) {
      toast.error("Digite o nome da cidade.");
      return;
    }
    const match = todasCidades.find(
      (c) => c.nome.toLowerCase() === busca.trim().toLowerCase()
    );
    if (match) {
      handleSelecionar(match);
    } else {
      toast.error("Cidade não encontrada no banco de dados.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 p-5 text-white">
        <div className="flex items-center gap-2">
          <MapPin size={22} />
          <div>
            <h1 className="text-lg font-bold">Área de Cobertura</h1>
            <p className="text-xs text-white/80">
              Cadastre as cidades onde o aplicativo irá operar.{" "}
              {todasCidades.length > 0 && (
                <span className="font-semibold">({todasCidades.length} cidades disponíveis)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-foreground mb-3">Buscar Nova Cidade</p>
          <div className="flex gap-3">
            <div className="relative flex-1" ref={wrapperRef}>
              {isLoading ? (
                <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary z-10 animate-spin" />
              ) : (
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary z-10" />
              )}
              <Input
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setShowSugestoes(true);
                }}
                onFocus={() => setShowSugestoes(true)}
                onKeyDown={(e) => e.key === "Enter" && handleAdicionar()}
                placeholder={isLoading ? "Carregando cidades..." : "Digite o nome da cidade..."}
                className="pl-10 bg-background border-border"
                disabled={isLoading}
              />
              {showSugestoes && sugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-border bg-popover shadow-lg">
                  <ScrollArea className="max-h-[280px]">
                    {sugestoes.map((s) => (
                      <button
                        key={`${s.nome}-${s.uf}`}
                        type="button"
                        onClick={() => handleSelecionar(s)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm text-popover-foreground hover:bg-accent transition-colors text-left"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin size={14} className="text-primary shrink-0" />
                          <span>{s.nome}</span>
                        </span>
                        <Badge variant="secondary" className="text-xs shrink-0">{s.uf}</Badge>
                      </button>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
            <Button onClick={handleAdicionar} disabled={addMutation.isPending} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8">
              <Plus size={16} /> ADICIONAR
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Cidades Cadastradas ({cidades.length})
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Cidade</TableHead>
                <TableHead className="text-xs font-semibold">Estado (UF)</TableHead>
                <TableHead className="text-xs font-semibold text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingCobertura ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 size={16} className="animate-spin inline mr-2" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </TableCell>
                </TableRow>
              ) : cidades.length > 0 ? (
                cidades.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{c.uf}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Remover cidade",
                            description: `Deseja remover ${c.nome} - ${c.uf} da área de cobertura?`,
                          });
                          if (ok) removeMutation.mutate(c.id);
                        }}
                        disabled={removeMutation.isPending}
                        className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-sm">
                    Nenhuma cidade cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default NovaCidade;
