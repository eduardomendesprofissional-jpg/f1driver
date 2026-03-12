import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AnunciosBanners = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-lg font-bold text-primary">Novo Banner (Padrão 1280x400)</h2>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Imagem (GIF, JPG, PNG)</label>
              <Input type="file" accept="image/*" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Link de Redirecionamento (Opcional)</label>
              <Input placeholder="https://exemplo.com" className="bg-background border-border" />
            </div>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-8">
              <Upload size={16} />
              Upar Anúncio
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h2 className="text-lg font-bold text-emerald-500">Banners Ativos</h2>
          <p className="text-sm text-muted-foreground mt-2">Nenhum banner cadastrado.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnunciosBanners;
