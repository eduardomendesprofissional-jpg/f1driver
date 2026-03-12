import { Settings, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

const WhatsPalavrasChave = () => {
  const [novaPalavra, setNovaPalavra] = useState("#MINHACENTRAL");
  const [palavras, setPalavras] = useState<{ palavra: string; categoria: string }[]>([]);

  const handleAdicionar = () => {
    if (novaPalavra.trim()) {
      setPalavras([...palavras, { palavra: novaPalavra.trim(), categoria: "-" }]);
      setNovaPalavra("");
    }
  };

  const handleRemover = (index: number) => {
    setPalavras(palavras.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração Global */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <Settings size={20} />
              Configuração Global
            </div>
          </div>
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina qual categoria atenderá <strong>todas</strong> as solicitações vindas do WhatsApp para este App.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Categoria Padrão</label>
              <Select>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carro">Carro</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-11 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
              ✅ Aplicar a Todos
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Atualiza Vínculos, WhatsApp e Palavras.
            </p>
          </CardContent>
        </Card>

        {/* Palavras Gatilho */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-500 p-4">
            <span className="text-white font-bold">Palavras Gatilho</span>
          </div>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Adicionar Nova Palavra</label>
              <div className="flex gap-3">
                <Input
                  value={novaPalavra}
                  onChange={(e) => setNovaPalavra(e.target.value)}
                  placeholder="#MINHACENTRAL"
                  className="flex-1 bg-background border-border"
                />
                <Button
                  onClick={handleAdicionar}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6"
                >
                  <Plus size={16} />
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-base font-bold text-violet-600 mb-3">Palavras Ativas</h3>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Palavra Chave</TableHead>
                    <TableHead className="text-xs font-semibold">Categoria (ID Div)</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {palavras.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6 text-sm">
                        Nenhuma palavra cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    palavras.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.palavra}</TableCell>
                        <TableCell>{p.categoria}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleRemover(i)} className="text-destructive hover:text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsPalavrasChave;
