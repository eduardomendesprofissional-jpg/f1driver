import { Tag, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

const CuponsCriar = () => {
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("percentual");
  const [valor, setValor] = useState("");
  const [limite, setLimite] = useState("");
  const [inicio, setInicio] = useState("");
  const [expiracao, setExpiracao] = useState("");

  const handleCriar = () => {
    if (!codigo.trim()) { toast.error("Informe o código do cupom."); return; }
    if (!valor.trim()) { toast.error("Informe o valor do desconto."); return; }
    toast.success(`Cupom "${codigo.toUpperCase()}" criado com sucesso!`);
    setCodigo(""); setValor(""); setLimite(""); setInicio(""); setExpiracao("");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Criar Novo Cupom</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código do Cupom</label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: PROMO10" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Desconto</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor do Desconto</label>
              <Input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex: 10" type="number" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Limite de Usos</label>
              <Input value={limite} onChange={(e) => setLimite(e.target.value)} placeholder="Ex: 100" type="number" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Início</label>
              <Input value={inicio} onChange={(e) => setInicio(e.target.value)} type="date" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Expiração</label>
              <Input value={expiracao} onChange={(e) => setExpiracao(e.target.value)} type="date" className="bg-background border-border" />
            </div>
          </div>

          <Button onClick={handleCriar} className="w-full h-11 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
            <Plus size={16} /> Criar Cupom
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CuponsCriar;
