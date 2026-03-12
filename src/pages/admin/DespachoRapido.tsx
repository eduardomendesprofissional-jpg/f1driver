import { Send, MapPin, Navigation, Car, MessageSquare, User, Phone, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { toast } from "sonner";

const DespachoRapido = () => {
  const [categoria, setCategoria] = useState("carro");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [observacao, setObservacao] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSolicitar = () => {
    if (!origem.trim()) { toast.error("Informe o endereço de origem."); return; }
    if (!destino.trim()) { toast.error("Informe o endereço de destino."); return; }
    if (!nome.trim()) { toast.error("Informe o nome do passageiro."); return; }

    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      toast.success("Solicitação enviada com sucesso! Aguardando motorista.");
      setOrigem(""); setDestino(""); setObservacao(""); setNome(""); setTelefone("");
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-sidebar rounded-xl p-5">
        <div className="flex items-center gap-3">
          <Send size={22} className="text-primary" />
          <div>
            <h1 className="text-lg font-bold">Nova Solicitação</h1>
            <p className="text-xs text-muted-foreground">Preencha os dados para chamar um motorista manualmente.</p>
          </div>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-5 md:p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Rota e Localização</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Endereço de Origem</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                  <Input value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="Digite a origem..." className="pl-10 pr-10 bg-background border-border" />
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Endereço de Destino</label>
                <div className="relative">
                  <Navigation size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                  <Input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Digite o destino..." className="pl-10 pr-10 bg-background border-border" />
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Car size={16} className="text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Detalhes da Corrida</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Categoria do Veículo</label>
                <div className="relative">
                  <Car size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary z-10" />
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger className="pl-10 bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carro">Carro</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Referência / Observação</label>
                <div className="relative">
                  <MessageSquare size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                  <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: Portão azul, esperar na esquina..." className="pl-10 bg-background border-border" />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Dados do Passageiro</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do passageiro" className="pl-10 bg-background border-border" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                  <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="pl-10 bg-background border-border" />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <Button onClick={handleSolicitar} disabled={enviando} className="w-full h-12 text-sm font-bold uppercase tracking-wider gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
            <Send size={18} />
            {enviando ? "Enviando..." : "Solicitar Agora"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DespachoRapido;
