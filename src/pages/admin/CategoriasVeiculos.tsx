import { GripVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { toast } from "sonner";
import carIcon from "@/assets/car-3d.png";
import { useConfirm } from "@/components/ConfirmDialogProvider";

interface Categoria {
  id: number;
  nome: string;
  iconeIndex: number;
}

const CategoriasVeiculos = () => {
  const confirm = useConfirm();
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [categorias, setCategorias] = useState<Categoria[]>([
    { id: 1, nome: "Carro", iconeIndex: 0 },
  ]);

  const handleSalvar = () => {
    if (!nomeCategoria.trim()) { toast.error("Informe o nome da categoria."); return; }
    if (categorias.some((c) => c.nome.toLowerCase() === nomeCategoria.trim().toLowerCase())) {
      toast.error("Categoria já existe."); return;
    }
    setCategorias([...categorias, { id: Date.now(), nome: nomeCategoria.trim(), iconeIndex: selectedIcon }]);
    setNomeCategoria("");
    toast.success(`Categoria "${nomeCategoria.trim()}" criada!`);
  };

  const handleEliminar = async (id: number) => {
    const cat = categorias.find((c) => c.id === id);
    const ok = await confirm({
      title: "Remover categoria",
      description: `Deseja remover a categoria "${cat?.nome}"?`,
    });
    if (!ok) return;
    setCategorias(categorias.filter((c) => c.id !== id));
    toast.success(`"${cat?.nome}" removida.`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-base font-bold text-primary">1. Nome da Categoria</h2>
            <Input value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)} placeholder="Ex: Económico, Black, Entrega..." className="bg-background border-border" />
            <Button onClick={handleSalvar} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Salvar Categoria
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-base font-bold text-rose-400">2. Selecione o Ícone</h2>
            <div className="grid grid-cols-8 gap-2 max-h-[200px] overflow-y-auto">
              {Array.from({ length: 24 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIcon(i)}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                    i === selectedIcon ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={carIcon} alt="" className="w-8 h-8 object-contain" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-emerald-500">Categorias Ativas (Arraste para reordenar)</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="text-xs font-semibold">ID Div</TableHead>
                  <TableHead className="text-xs font-semibold">Ícone</TableHead>
                  <TableHead className="text-xs font-semibold">Nome</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.length > 0 ? categorias.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell><GripVertical size={14} className="text-muted-foreground cursor-grab" /></TableCell>
                    <TableCell className="text-sm font-medium">{cat.id}</TableCell>
                    <TableCell><img src={carIcon} alt={cat.nome} className="w-10 h-10 object-contain" /></TableCell>
                    <TableCell className="text-sm font-medium">{cat.nome}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEliminar(cat.id)} className="text-xs text-rose-400 border-rose-400 hover:bg-rose-500/10">
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">Nenhuma categoria cadastrada.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoriasVeiculos;
