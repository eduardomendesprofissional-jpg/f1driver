import { MapPin, Plus, Trash2, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchCidadesBR = async (): Promise<{ nome: string; uf: string }[]> => {
  const { data, error } = await supabase
    .from("cidades_brasil")
    .select("nome, uf")
    .eq("ativo", true)
    .order("nome");

  if (error) throw error;
  return data || [];
};

const NovaCidade = () => {
  const [cidades, setCidades] = useState<{ nome: string; uf: string }[]>([]);
  const [busca, setBusca] = useState("");
  const [showSugestoes, setShowSugestoes] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: todasCidades = [], isLoading } = useQuery({
    queryKey: ["cidades-brasil"],
    queryFn: fetchCidadesBR,
    staleTime: Infinity,
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
    setCidades([...cidades, cidade]);
    setBusca("");
    setShowSugestoes(false);
    toast.success(`${cidade.nome} - ${cidade.uf} adicionada com sucesso!`);
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

  const handleRemover = (index: number) => {
    const cidade = cidades[index];
    setCidades(cidades.filter((_, i) => i !== index));
    toast.success(`${cidade.nome} removida.`);
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
            <Button onClick={handleAdicionar} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8">
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
              {cidades.length > 0 ? (
                cidades.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{c.uf}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemover(i)}
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
