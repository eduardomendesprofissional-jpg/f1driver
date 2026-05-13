import { Loader2, Car, User as UserIcon, ChevronRight } from "lucide-react";
import { useProfileSwitch } from "@/hooks/useProfileSwitch";

interface Props {
  current: "passageiro" | "motorista";
}

const ProfileSwitcher = ({ current }: Props) => {
  const { hasDriver, hasPassenger, switchTo, loading } = useProfileSwitch();
  const target = current === "passageiro" ? "motorista" : "passageiro";
  const targetHas = target === "motorista" ? hasDriver : hasPassenger;

  const Icon = target === "motorista" ? Car : UserIcon;
  const label = targetHas
    ? `Trocar para ${target === "motorista" ? "modo motorista" : "modo passageiro"}`
    : `Ativar perfil de ${target === "motorista" ? "motorista" : "passageiro"}`;

  return (
    <button
      onClick={() => switchTo(target)}
      disabled={loading}
      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-secondary transition-colors border-b border-border disabled:opacity-50"
    >
      <Icon size={20} className="text-primary" />
      <span className="flex-1 text-left text-sm font-medium text-foreground">{label}</span>
      {loading ? <Loader2 size={16} className="animate-spin text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
    </button>
  );
};

export default ProfileSwitcher;
