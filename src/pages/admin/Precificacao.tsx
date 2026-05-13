import { DollarSign, Info, Plus, Trash2, Save, Loader2, Edit2, Clock, Calendar } from "lucide-react";
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
import { useConfirm } from "@/components/ConfirmDialogProvider";

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
  hora_inicio: string;
  hora_fim: string;
  dias_semana: number[];
  multiplicador: number;
  ativo: boolean;
  isNew?: boolean;
  isEditing?: boolean;
}

const CATEGORIAS = ["Carro", "Carro Black", "Moto", "Van"];

const DIAS = [
  { value: 0, label: "Dom", short: "D" },
  { value: 1, label: "Seg", short: "S" },
  { value: 2, label: "Ter", short: "T" },
  { value: 3, label: "Qua", short: "Q" },
  { value: 4, label: "Qui", short: "Q" },
  { value: 5, label: "Sex", short: "S" },
  { value: 6, label: "Sáb", short: "S" },
];

const formatDias = (dias: number[]) => {
  if (dias.length === 7) return "Todos os dias";
  if (dias.length === 0) return "Nenhum";
  if (arraysEqual(dias.sort(), [1, 2, 3, 4, 5])) return "Seg–Sex";
  if (arraysEqual(dias.sort(), [0, 6])) return "Fim de semana";
  return dias.map((d) => DIAS[d]?.label).join(", ");
};

const arraysEqual = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const toggleDay = (dias: number[], day: number) =>
  dias.includes(day) ? dias.filter((d) => d !== day) : [...dias, day].sort();

const Precificacao = () => {
  const queryClient = useQueryClient();
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
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
    queryKey: ["precificacao", cidadeSelecionada, categoriaSelecionada],
    queryFn: async () => {
      if (!cidadeSelecionada || !categoriaSelecionada) return [];
      const { data, error } = await supabase
        .from("precificacao")
        .select("*")
        .eq("cidade_id", cidadeSelecionada)
        .eq("categoria", categoriaSelecionada)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!cidadeSelecionada && !!categoriaSelecionada,
  });

  const { data: categoriasExistentes = [] } = useQuery({
    queryKey: ["precificacao-categorias", cidadeSelecionada],
    queryFn: async () => {
      if (!cidadeSelecionada) return [];
      const { data, error } = await supabase
        .from("precificacao")
        .select("categoria")
        .eq("cidade_id", cidadeSelecionada);
      if (error) throw error;
      const unique = [...new Set(data.map((d: any) => d.categoria))];
      return unique as string[];
    },
    enabled: !!cidadeSelecionada,
  });

  useEffect(() => {
    setPrecos(
      precosDB.map((p: any) => ({
        id: p.id,
        cidade_id: p.cidade_id,
        categoria: p.categoria,
        preco_base: Number(p.preco_base),
        preco_km: Number(p.preco_km),
        preco_minuto: Number(p.preco_minuto),
        taxa_minima: Number(p.taxa_minima),
        hora_inicio: p.hora_inicio || "00:00",
        hora_fim: p.hora_fim || "23:59",
        dias_semana: p.dias_semana ?? [0, 1, 2, 3, 4, 5, 6],
        multiplicador: Number(p.multiplicador ?? 1),
        ativo: p.ativo,
        isEditing: false,
      }))
    );
  }, [precosDB]);

  useEffect(() => {
    setCategoriaSelecionada("");
  }, [cidadeSelecionada]);

  const saveMutation = useMutation({
    mutationFn: async (row: PrecoRow) => {
      const payload = {
        cidade_id: row.cidade_id,
        categoria: row.categoria,
        preco_base: row.preco_base,
        preco_km: row.preco_km,
        preco_minuto: row.preco_minuto,
        taxa_minima: row.taxa_minima,
        hora_inicio: row.hora_inicio,
        hora_fim: row.hora_fim,
        dias_semana: row.dias_semana,
        multiplicador: row.multiplicador,
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
      queryClient.invalidateQueries({ queryKey: ["precificacao"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("precificacao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Faixa de preço removida!");
      queryClient.invalidateQueries({ queryKey: ["precificacao"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAddFaixa = () => {
    setPrecos([
      ...precos,
      {
        cidade_id: cidadeSelecionada,
        categoria: categoriaSelecionada,
        preco_base: 5,
        preco_km: 2,
        preco_minuto: 0.5,
        taxa_minima: 8,
        hora_inicio: "00:00",
        hora_fim: "23:59",
        dias_semana: [0, 1, 2, 3, 4, 5, 6],
        multiplicador: 1.0,
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
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white">
        <div className="flex items-center gap-2">
          <DollarSign size={22} />
          <div>
            <h1 className="text-lg font-bold">Tabela de Preços</h1>
            <p className="text-xs text-white/80">Gerencie a precificação por cidade, categoria, horário e dia da semana.</p>
          </div>
        </div>
      </div>

      {/* Step 1: Select City */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">1</Badge> Selecionar Cidade
          </h2>
          {loadingCidades ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin" /> Carregando cidades...
            </div>
          ) : cidades.length === 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
              <Info size={14} className="text-amber-400" />
              <p className="text-xs text-amber-300">Nenhuma cidade cadastrada. Vá em <strong>Área de Cobertura</strong> primeiro.</p>
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

      {/* Step 2: Select Vehicle Category */}
      {cidadeSelecionada && (
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">2</Badge> Tipo de Veículo
            </h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => {
                const exists = categoriasExistentes.includes(cat);
                const selected = categoriaSelecionada === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSelecionada(cat)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      selected
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-border bg-secondary text-muted-foreground hover:border-emerald-500/50"
                    }`}
                  >
                    {cat}
                    {exists && !selected && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" /> = já possui preços configurados
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Pricing Table */}
      {cidadeSelecionada && categoriaSelecionada && (
        <Card id="tabela-precos" className="bg-card border-border">
          <CardContent className="p-0">
            <div className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Faixas de Preço — {categoriaSelecionada}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Clock size={10} className="inline mr-1" />
                  Horário e dias da semana
                  <Calendar size={10} className="inline ml-2 mr-1" />
                  Multiplicador para pico/noturno
                </p>
              </div>
              <Button size="sm" onClick={handleAddFaixa} className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs">
                <Plus size={14} /> Adicionar Faixa
              </Button>
            </div>

            {loadingPrecos ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                <Loader2 size={16} className="animate-spin" /> Carregando preços...
              </div>
            ) : precos.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm text-muted-foreground">Nenhuma faixa de preço para <strong>{categoriaSelecionada}</strong> nesta cidade.</p>
                <Button size="sm" onClick={handleAddFaixa} variant="outline" className="gap-1 text-xs">
                  <Plus size={14} /> Criar primeira faixa
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold">Dias</TableHead>
                      <TableHead className="text-xs font-semibold">Horário</TableHead>
                      <TableHead className="text-xs font-semibold">Base (R$)</TableHead>
                      <TableHead className="text-xs font-semibold">Por Km (R$)</TableHead>
                      <TableHead className="text-xs font-semibold">Por Min (R$)</TableHead>
                      <TableHead className="text-xs font-semibold">Taxa Mín (R$)</TableHead>
                      <TableHead className="text-xs font-semibold">Multi</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {precos.map((row, i) => (
                      <TableRow key={row.id || `new-${i}`}>
                        {/* Days */}
                        <TableCell>
                          {row.isEditing ? (
                            <div className="flex gap-0.5">
                              {DIAS.map((dia) => {
                                const active = row.dias_semana.includes(dia.value);
                                return (
                                  <button
                                    key={dia.value}
                                    onClick={() => updateRow(i, "dias_semana", toggleDay(row.dias_semana, dia.value))}
                                    className={`w-7 h-7 rounded-md text-[10px] font-bold transition-all ${
                                      active
                                        ? "bg-emerald-500 text-white"
                                        : "bg-secondary text-muted-foreground border border-border"
                                    }`}
                                    title={dia.label}
                                  >
                                    {dia.short}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs">{formatDias(row.dias_semana)}</span>
                          )}
                        </TableCell>
                        {/* Time */}
                        <TableCell>
                          {row.isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="time"
                                value={row.hora_inicio}
                                onChange={(e) => updateRow(i, "hora_inicio", e.target.value)}
                                className="w-24 h-8 text-xs bg-background border-border"
                              />
                              <span className="text-xs text-muted-foreground">–</span>
                              <Input
                                type="time"
                                value={row.hora_fim}
                                onChange={(e) => updateRow(i, "hora_fim", e.target.value)}
                                className="w-24 h-8 text-xs bg-background border-border"
                              />
                            </div>
                          ) : (
                            <span className="text-sm font-mono">
                              {row.hora_inicio} – {row.hora_fim}
                            </span>
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
                          {row.isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={row.multiplicador}
                              onChange={(e) => updateRow(i, "multiplicador", parseFloat(e.target.value) || 1)}
                              className="w-20 h-8 text-xs bg-background border-border"
                            />
                          ) : (
                            <Badge variant={row.multiplicador > 1 ? "destructive" : "secondary"} className="text-xs">
                              {row.multiplicador}x
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={row.ativo ? "default" : "outline"}
                            className="text-xs cursor-pointer"
                            onClick={() => { updateRow(i, "ativo", !row.ativo); updateRow(i, "isEditing", true); }}
                          >
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
