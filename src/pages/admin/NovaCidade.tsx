import { MapPin, Plus, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const CIDADES_BR = [
  "Aracaju - SE","Belém - PA","Belo Horizonte - MG","Boa Vista - RR","Brasília - DF",
  "Campo Grande - MS","Cuiabá - MT","Curitiba - PR","Florianópolis - SC","Fortaleza - CE",
  "Goiânia - GO","João Pessoa - PB","Macapá - AP","Maceió - AL","Manaus - AM",
  "Natal - RN","Palmas - TO","Porto Alegre - RS","Porto Velho - RO","Recife - PE",
  "Rio Branco - AC","Rio de Janeiro - RJ","Salvador - BA","São Luís - MA","São Paulo - SP",
  "Teresina - PI","Vitória - ES","Campinas - SP","Santos - SP","Guarulhos - SP",
  "São Bernardo do Campo - SP","Osasco - SP","Santo André - SP","Ribeirão Preto - SP",
  "Sorocaba - SP","São José dos Campos - SP","Uberlândia - MG","Contagem - MG",
  "Juiz de Fora - MG","Betim - MG","Montes Claros - MG","Niterói - RJ","São Gonçalo - RJ",
  "Duque de Caxias - RJ","Nova Iguaçu - RJ","Petrópolis - RJ","Volta Redonda - RJ",
  "Londrina - PR","Maringá - PR","Ponta Grossa - PR","Cascavel - PR","Foz do Iguaçu - PR",
  "Joinville - SC","Blumenau - SC","Chapecó - SC","Caxias do Sul - RS","Pelotas - RS",
  "Santa Maria - RS","Canoas - RS","Novo Hamburgo - RS","Aparecida de Goiânia - GO",
  "Anápolis - GO","Camaçari - BA","Feira de Santana - BA","Vitória da Conquista - BA",
  "Ilhéus - BA","Lauro de Freitas - BA","Jaboatão dos Guararapes - PE","Olinda - PE",
  "Caruaru - PE","Petrolina - PE","Paulista - PE","Caucaia - CE","Maracanaú - CE",
  "Sobral - CE","Juazeiro do Norte - CE","Parnamirim - RN","Mossoró - RN",
  "Campina Grande - PB","Imperatriz - MA","São José de Ribamar - MA","Ananindeua - PA",
  "Marabá - PA","Santarém - PA","Macaé - RJ","Cabo Frio - RJ","Angra dos Reis - RJ",
  "Bauru - SP","Piracicaba - SP","Jundiaí - SP","Franca - SP","Taubaté - SP",
  "Praia Grande - SP","São José do Rio Preto - SP","Presidente Prudente - SP",
  "Marília - SP","Araraquara - SP","Limeira - SP","Americana - SP","Mogi das Cruzes - SP",
  "Diadema - SP","Carapicuíba - SP","Itaquaquecetuba - SP","Suzano - SP","Taboão da Serra - SP",
  "Barueri - SP","Embu das Artes - SP","Cotia - SP","Indaiatuba - SP","Hortolândia - SP",
  "Rondonópolis - MT","Várzea Grande - MT","Sinop - MT","Dourados - MS","Três Lagoas - MS",
  "Rio Verde - GO","Luziânia - GO","Águas Lindas de Goiás - GO","Valparaíso de Goiás - GO",
  "Arapiraca - AL","Serra - ES","Vila Velha - ES","Cariacica - ES","Linhares - ES",
];

const NovaCidade = () => {
  const [cidades, setCidades] = useState<{ nome: string; uf: string }[]>([]);
  const [busca, setBusca] = useState("");
  const [showSugestoes, setShowSugestoes] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const sugestoes = busca.trim().length >= 2
    ? CIDADES_BR.filter((c) =>
        c.toLowerCase().includes(busca.toLowerCase()) &&
        !cidades.some((cad) => {
          const nome = c.split(" - ")[0];
          return cad.nome.toLowerCase() === nome.toLowerCase();
        })
      ).slice(0, 8)
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

  const handleSelecionar = (cidade: string) => {
    const parts = cidade.split(" - ");
    const nome = parts[0];
    const uf = parts[1] || "BR";
    setCidades([...cidades, { nome, uf }]);
    setBusca("");
    setShowSugestoes(false);
    toast.success(`${nome} adicionada com sucesso!`);
  };

  const handleAdicionar = () => {
    if (!busca.trim()) {
      toast.error("Digite o nome da cidade.");
      return;
    }
    const parts = busca.trim().split(" - ");
    const nome = parts[0] || busca.trim();
    const uf = parts[1] || "BR";
    if (cidades.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      toast.error("Cidade já cadastrada.");
      return;
    }
    setCidades([...cidades, { nome, uf }]);
    setBusca("");
    setShowSugestoes(false);
    toast.success(`${nome} adicionada com sucesso!`);
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
            <p className="text-xs text-white/80">Cadastre as cidades onde o aplicativo irá operar.</p>
          </div>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-foreground mb-3">Buscar Nova Cidade</p>
          <div className="flex gap-3">
            <div className="relative flex-1" ref={wrapperRef}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary z-10" />
              <Input
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setShowSugestoes(true);
                }}
                onFocus={() => setShowSugestoes(true)}
                onKeyDown={(e) => e.key === "Enter" && handleAdicionar()}
                placeholder="Digite o nome da cidade... (Ex: São Paulo)"
                className="pl-10 bg-background border-border"
              />
              {showSugestoes && sugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-border bg-popover shadow-lg">
                  <ScrollArea className="max-h-[240px]">
                    {sugestoes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSelecionar(s)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-popover-foreground hover:bg-accent transition-colors text-left"
                      >
                        <MapPin size={14} className="text-primary shrink-0" />
                        <span>{s}</span>
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
          <div className="px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Cidades Cadastradas</p>
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
              {cidades.length > 0 ? cidades.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{c.uf}</Badge></TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => handleRemover(i)} className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10">
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-sm">Nenhuma cidade cadastrada.</TableCell>
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
