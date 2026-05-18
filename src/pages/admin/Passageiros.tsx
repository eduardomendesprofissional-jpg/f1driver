import { useState, useEffect } from "react";
import { Search, User, Eye, Loader2, Mail, Phone, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, printTable } from "@/lib/table-utils";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmDialogProvider";
import CreateUserDialog from "@/components/admin/CreateUserDialog";

interface PassengerProfile {
  id: string;
  nome: string | null;
  telefone: string | null;
  avatar_url: string | null;
  cpf: string | null;
  onboarding_completo: boolean;
  created_at: string;
  email?: string;
  total_rides?: number;
}

const headers = [
  { key: "nome", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "telefone", label: "Telefone" },
  { key: "created_at", label: "Cadastro" },
];

const Passageiros = () => {
  const [passageiros, setPassageiros] = useState<PassengerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<PassengerProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const confirm = useConfirm();

  const handleDelete = async (p: PassengerProfile) => {
    const ok = await confirm({
      title: "Excluir passageiro",
      description: `Tem certeza que deseja excluir ${p.nome || "este passageiro"}? Todos os dados (corridas, avaliações, pagamentos) serão removidos permanentemente.`,
      confirmText: "Excluir",
    });
    if (!ok) return;
    setDeletingId(p.id);
    const { error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: p.id } });
    setDeletingId(null);
    if (error) return toast.error("Erro ao excluir: " + error.message);
    toast.success("Passageiro excluído");
    setPassageiros((prev) => prev.filter((x) => x.id !== p.id));
    setSelected(null);
  };

  useEffect(() => {
    fetchPassageiros();
  }, []);

  const fetchPassageiros = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, telefone, avatar_url, cpf, onboarding_completo, created_at")
      .eq("tipo", "passageiro")
      .order("created_at", { ascending: false });
    if (!error && data) setPassageiros(data as PassengerProfile[]);
    setLoading(false);
  };

  const filtered = passageiros.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || [p.nome, p.cpf, p.telefone].some(v => v?.toLowerCase().includes(q));
  });

  const total = passageiros.length;
  const comOnboarding = passageiros.filter(p => p.onboarding_completo).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{comOnboarding}</p>
            <p className="text-xs text-muted-foreground">Onboarding completo</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{total - comOnboarding}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary">Passageiros Registrados</h2>
            <p className="text-sm text-muted-foreground">Gerencie os passageiros da plataforma.</p>
          </div>

          <div className="flex items-center justify-between px-5 py-3 gap-2 flex-wrap">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToCSV(filtered as any, headers, "passageiros")}>CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => printTable(filtered as any, headers, "Passageiros")}>Print</Button>
              <CreateUserDialog tipo="passageiro" onCreated={fetchPassageiros} />
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-48 h-8 text-xs" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Passageiro</TableHead>
                  <TableHead className="text-xs font-semibold">CPF</TableHead>
                  <TableHead className="text-xs font-semibold">Telefone</TableHead>
                  <TableHead className="text-xs font-semibold">Cadastro</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum passageiro encontrado.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          {p.avatar_url ? <AvatarImage src={p.avatar_url} /> : null}
                          <AvatarFallback className="text-xs bg-secondary">{p.nome?.charAt(0)?.toUpperCase() || "P"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{p.nome || "Sem nome"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.cpf || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.telefone || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.onboarding_completo ? "default" : "secondary"} className="text-[10px]">
                        {p.onboarding_completo ? "Ativo" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setSelected(p)}>
                          <Eye size={14} /> Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                        >
                          {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><User size={18} /> Dados do Passageiro</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  {selected.avatar_url ? <AvatarImage src={selected.avatar_url} /> : null}
                  <AvatarFallback className="bg-secondary text-primary text-lg">{selected.nome?.charAt(0)?.toUpperCase() || "P"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-foreground">{selected.nome || "Sem nome"}</p>
                  <Badge variant={selected.onboarding_completo ? "default" : "secondary"} className="text-[10px] mt-1">
                    {selected.onboarding_completo ? "Ativo" : "Pendente"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">CPF:</span> <span className="font-medium">{selected.cpf || "—"}</span></div>
                <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{selected.telefone || "—"}</span></div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Calendar size={12} /> Cadastro:</span>
                <span className="font-medium ml-5">{new Date(selected.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Passageiros;
