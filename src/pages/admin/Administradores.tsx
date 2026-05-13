import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Trash2, Pencil, X, Check, Camera } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialogProvider";

interface Admin {
  id: string;
  user_id: string;
  nome: string;
  foto_url: string | null;
  funcao: string;
  created_at: string;
}

const funcoes = ["Administrador", "Gerente", "Suporte", "Financeiro", "Operações"];

const Administradores = () => {
  const confirm = useConfirm();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("Administrador");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editFuncao, setEditFuncao] = useState("");

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("administradores")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setAdmins(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadFoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `admin-photos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome do administrador");
      return;
    }
    setSaving(true);

    let fotoUrl: string | null = null;
    if (fotoFile) {
      fotoUrl = await uploadFoto(fotoFile);
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("administradores").insert({
      user_id: user?.id || "",
      nome: nome.trim(),
      funcao,
      foto_url: fotoUrl,
    });

    if (error) {
      toast.error("Erro ao cadastrar administrador");
    } else {
      toast.success("Administrador cadastrado com sucesso!");
      setNome("");
      setFuncao("Administrador");
      setFotoFile(null);
      setFotoPreview(null);
      fetchAdmins();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, nome: string) => {
    const ok = await confirm({
      title: "Remover administrador",
      description: `Deseja remover ${nome}? Esta ação não pode ser desfeita.`,
    });
    if (!ok) return;
    const { error } = await supabase.from("administradores").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover administrador");
    } else {
      toast.success("Administrador removido");
      fetchAdmins();
    }
  };

  const startEdit = (admin: Admin) => {
    setEditingId(admin.id);
    setEditNome(admin.nome);
    setEditFuncao(admin.funcao);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("administradores")
      .update({ nome: editNome, funcao: editFuncao })
      .eq("id", editingId);
    if (error) {
      toast.error("Erro ao atualizar");
    } else {
      toast.success("Atualizado com sucesso!");
      setEditingId(null);
      fetchAdmins();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administradores</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os administradores do sistema
        </p>
      </div>

      {/* Form */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            Cadastrar Novo Administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo upload */}
            <div className="flex items-center gap-4">
              <label className="relative cursor-pointer group">
                <Avatar className="h-16 w-16 border-2 border-dashed border-border group-hover:border-primary transition-colors">
                  {fotoPreview ? (
                    <AvatarImage src={fotoPreview} />
                  ) : (
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <Camera size={20} />
                    </AvatarFallback>
                  )}
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoChange}
                />
              </label>
              <div className="text-sm text-muted-foreground">
                Clique para adicionar foto
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  placeholder="Nome do administrador"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="funcao">Função</Label>
                <Select value={funcao} onValueChange={setFuncao}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {funcoes.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Cadastrando..." : "Cadastrar Administrador"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">
            Administradores Cadastrados ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum administrador cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    {admin.foto_url ? (
                      <AvatarImage src={admin.foto_url} />
                    ) : null}
                    <AvatarFallback className="bg-primary/15 text-primary text-sm">
                      {getInitials(admin.nome)}
                    </AvatarFallback>
                  </Avatar>

                  {editingId === admin.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Select value={editFuncao} onValueChange={setEditFuncao}>
                        <SelectTrigger className="h-9 w-full sm:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {funcoes.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={saveEdit}>
                          <Check size={16} className="text-green-500" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingId(null)}>
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{admin.nome}</p>
                        <p className="text-xs text-muted-foreground">{admin.funcao}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(admin)}>
                          <Pencil size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(admin.id, admin.nome)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Administradores;
