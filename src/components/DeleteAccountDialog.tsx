import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onDeleted: () => void;
}

const DeleteAccountDialog = ({ open, onOpenChange, userId, onDeleted }: Props) => {
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== "EXCLUIR") {
      toast.error("Digite EXCLUIR para confirmar.");
      return;
    }
    setLoading(true);
    try {
      // Call the database function to delete all user data
      const { error } = await supabase.rpc("delete_user_data", { p_user_id: userId });
      if (error) throw error;

      // Sign out
      await supabase.auth.signOut();
      toast.success("Conta excluída com sucesso.");
      onDeleted();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="items-center text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-1">
            <AlertTriangle size={28} className="text-destructive" />
          </div>
          <AlertDialogTitle>Excluir Minha Conta</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">
            <strong className="text-destructive">Esta ação é irreversível.</strong> Todos os seus dados 
            serão apagados permanentemente, incluindo perfil, histórico de corridas, 
            avaliações e dados financeiros.
          </AlertDialogDescription>
        </AlertDialogHeader>
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
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmation !== "EXCLUIR"}
            className="w-full"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Excluir Permanentemente
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Cancelar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
