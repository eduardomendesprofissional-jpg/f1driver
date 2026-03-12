import { Store, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

const EstabelecimentosCadastrar = () => {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleCadastrar = () => {
    if (!nome.trim()) { toast.error("Informe o nome do estabelecimento."); return; }
    if (!telefone.trim()) { toast.error("Informe o telefone."); return; }

    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      toast.success(`"${nome}" cadastrado com sucesso!`);
      setNome(""); setTelefone(""); setEmail(""); setCnpj(""); setEndereco(""); setObs("");
    }, 600);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Cadastrar Estabelecimento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Estabelecimento</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Restaurante Sabor" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone</label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" type="email" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CNPJ</label>
              <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Endereço</label>
              <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade - UF" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações</label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Informações adicionais..." className="bg-background border-border min-h-[80px]" />
            </div>
          </div>

          <Button onClick={handleCadastrar} disabled={enviando} className="w-full h-11 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
            <Plus size={16} />
            {enviando ? "Cadastrando..." : "Cadastrar Estabelecimento"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstabelecimentosCadastrar;
