import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const DeleteAccountPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const handleDelete = async () => {
    if (!user) return;
    if (confirmation !== "EXCLUIR") {
      toast.error("Digite EXCLUIR para confirmar.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.rpc("delete_user_data", { p_user_id: user.id });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Conta excluída com sucesso.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir conta.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={32} className="text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Excluir Minha Conta</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            <strong className="text-destructive">Esta ação é irreversível.</strong> Todos os seus dados
            serão apagados permanentemente, incluindo perfil, histórico de corridas,
            avaliações e dados financeiros.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Digite <strong className="text-foreground">EXCLUIR</strong> para confirmar:
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
            placeholder="EXCLUIR"
            className="text-center font-mono"
          />
        </div>

        <div className="space-y-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmation !== "EXCLUIR"}
            className="w-full"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Excluir Permanentemente
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)} className="w-full">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
