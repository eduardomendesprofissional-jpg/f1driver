import { Upload, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface Banner {
  id: number;
  nome: string;
  link: string;
  preview: string;
}

const AnunciosBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!file) { toast.error("Selecione uma imagem."); return; }
    const preview = URL.createObjectURL(file);
    setBanners([...banners, { id: Date.now(), nome: file.name, link, preview }]);
    setLink("");
    setFile(null);
    toast.success("Banner adicionado com sucesso!");
  };

  const handleRemover = (id: number) => {
    setBanners(banners.filter((b) => b.id !== id));
    toast.success("Banner removido.");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-lg font-bold text-primary">Novo Banner (Padrão 1280x400)</h2>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Imagem (GIF, JPG, PNG)</label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Link de Redirecionamento (Opcional)</label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://exemplo.com" className="bg-background border-border" />
            </div>
            <Button onClick={handleUpload} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-8">
              <Upload size={16} /> Upar Anúncio
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h2 className="text-lg font-bold text-emerald-500">Banners Ativos</h2>
          {banners.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">Nenhum banner cadastrado.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                  <img src={b.preview} alt={b.nome} className="w-32 h-10 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.nome}</p>
                    {b.link && <p className="text-xs text-muted-foreground truncate">{b.link}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemover(b.id)} className="text-destructive hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnunciosBanners;
