import { DollarSign, Info, Plus, Trash2, Save, Loader2, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CidadeCobertura {
  id: string;
  nome: string;
  uf: string;
}

interface PrecoRow {
  id?: string;
  cidade_id: string;
  categoria: string;
  preco_base: number;
  preco_km: number;
  preco_minuto: number;
  taxa_minima: number;
  ativo: boolean;
  isNew?: boolean;
  isEditing?: boolean;
}

const CATEGORIAS = ["Comum", "Luxo", "Moto", "Van"];

const Precificacao = () => {
  const queryClient = useQueryClient();
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");
  const [precos, setPrecos] = useState<PrecoRow[]>([]);

  const { data: cidades = [], isLoading: loadingCidades } = useQuery({
    queryKey: ["cidades-cobertura"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cidades_cobertura")
        .select("id, nome, uf")
        .order("nome");
      if (error) throw error;
      return data as CidadeCobertura[];
    },
  });

  const { data: precosDB = [], isLoading: loadingPrecos } = useQuery({
    queryKey: ["precificacao", cidadeSelecionada],
    queryFn: async () => {
      if (!cidadeSelecionada) return [];
      const { data, error } = await supabase
        .from("precificacao")
        .select("*")
        .eq("cidade_id", cidadeSelecionada)
        .order("categoria");
      if (error) throw error;
      return data;
    },
    enabled: !!cidadeSelecionada,
  });

  useEffect(() => {
    setPrecos(
      precosDB.map((p) => ({
        id: p.id,
        cidade_id: p.cidade_id,
        categoria: p.categoria,
        preco_base: Number(p.preco_base),
        preco_km: Number(p.preco_km),
        preco_minuto: Number(p.preco_minuto),
        taxa_minima: Number(p.taxa_minima),
        ativo: p.ativo,
        isEditing: false,
      }))
    );
  }, [precosDB]);

  const saveMutation = useMutation({
    mutationFn: async (row: PrecoRow) => {
      const payload = {
        cidade_id: row.cidade_id,
        categoria: row.categoria,
        preco_base: row.preco_base,
        preco_km: row.preco_km,
        preco_minuto: row.preco_minuto,
        taxa_minima: row.taxa_minima,
        ativo: row.ativo,
        updated_at: new Date().toISOString(),
      };
      if (row.id && !row.isNew) {
        const { error } = await supabase.from("precificacao").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("precificacao").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Preço salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["precificacao", cidadeSelecionada] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("precificacao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preço removido!");
      queryClient.invalidateQueries({ queryKey: ["precificacao", cidadeSelecionada] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAddCategoria = () => {
    const usadas = precos.map((p) => p.categoria);
    const disponivel = CATEGORIAS.find((c) => !usadas.includes(c));
    if (!disponivel) {
      toast.error("Todas as categorias já foram adicionadas.");
      return;
    }
    setPrecos([
      ...precos,
      {
        cidade_id: cidadeSelecionada,
        categoria: disponivel,
        preco_base: 5,
        preco_km: 2,
        preco_minuto: 0.5,
        taxa_minima: 8,
        ativo: true,
        isNew: true,
        isEditing: true,
      },
    ]);
  };

  const updateRow = (index: number, field: keyof PrecoRow, value: unknown) => {
    setPrecos((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleSave = (index: number) => {
    const row = precos[index];
    saveMutation.mutate(row);
    updateRow(index, "isEditing", false);
    updateRow(index, "isNew", false);
  };

  const handleDelete = (index: number) => {
    const row = precos[index];
    if (row.id && !row.isNew) {
      deleteMutation.mutate(row.id);
    } else {
      setPrecos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={22} />
          <div>
            <h1 className="text-lg font-bold">Tabela de Preços</h1>
            <p className="text-xs text-white/80">Gerencie a precificação por cidade e categoria de veículo.</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-white/20 hover:bg-white/30 text-white font-bold"
          onClick={() => {
            const el = document.getElementById("tabela-precos");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <Edit2 size={16} /> Editar Tabela de Preços
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Selecionar Cidade</h2>
          </div>

          {loadingCidades ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin" /> Carregando cidades...
            </div>
          ) : cidades.length === 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
              <Info size={14} className="text-amber-400" />
              <p className="text-xs text-amber-300">Nenhuma cidade de cobertura cadastrada. Vá em <strong>Área de Cobertura</strong> para adicionar cidades primeiro.</p>
            </div>
          ) : (
            <Select value={cidadeSelecionada} onValueChange={setCidadeSelecionada}>
              <SelectTrigger className="w-full max-w-sm bg-background border-border">
                <SelectValue placeholder="Escolha uma cidade..." />
              </SelectTrigger>
              <SelectContent>
                {cidades.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} - {c.uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {cidadeSelecionada && (
        <Card id="tabela-precos" className="bg-card border-border">
          <CardContent className="p-0">
            <div className="px-5 py-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Categorias & Preços ({precos.length})
              </p>
              <Button size="sm" onClick={handleAddCategoria} className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs">
                <Plus size={14} /> Adicionar Categoria
              </Button>
            </div>

            {loadingPrecos ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                <Loader2 size={16} className="animate-spin" /> Carregando preços...
              </div>
            ) : precos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma categoria cadastrada para esta cidade.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold">Categoria</TableHead>
                      <TableHead className="text-xs font-semibold">Base (R$)</TableHead>
                      <TableHead className="text-xs font-semibold">Por Km (R$)</TableHead>
                      <TableHead className="text-xs font-semibold">Por Min (R$)</TableHead>
                      <TableHead className="text-xs font-semibold">Taxa Mín (R$)</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {precos.map((row, i) => (
                      <TableRow key={row.id || `new-${i}`}>
                        <TableCell>
                          {row.isEditing ? (
                            <Select value={row.categoria} onValueChange={(v) => updateRow(i, "categoria", v)}>
                              <SelectTrigger className="w-28 h-8 text-xs bg-background border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIAS.map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary" className="text-xs">{row.categoria}</Badge>
                          )}
                        </TableCell>
                        {(["preco_base", "preco_km", "preco_minuto", "taxa_minima"] as const).map((field) => (
                          <TableCell key={field}>
                            {row.isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={row[field]}
                                onChange={(e) => updateRow(i, field, parseFloat(e.target.value) || 0)}
                                className="w-24 h-8 text-xs bg-background border-border"
                              />
                            ) : (
                              <span className="text-sm">{Number(row[field]).toFixed(2)}</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Badge variant={row.ativo ? "default" : "outline"} className="text-xs cursor-pointer" onClick={() => { updateRow(i, "ativo", !row.ativo); updateRow(i, "isEditing", true); }}>
                            {row.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {row.isEditing ? (
                              <Button size="sm" variant="ghost" onClick={() => handleSave(i)} className="text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10" disabled={saveMutation.isPending}>
                                <Save size={14} />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => updateRow(i, "isEditing", true)} className="text-sky-400 hover:text-sky-500 hover:bg-sky-500/10">
                                <Edit2 size={14} />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(i)} className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Precificacao;
