import { Shield, AlertTriangle, Eye, MapPin, Lock, Users, Phone } from "lucide-react";

const SUPPORT_PHONE = "5581991397867";

interface SafetyTipsProps {
  role: "passenger" | "driver";
}

const passengerTips = [
  { icon: Eye, text: "Confira a placa, modelo e cor do veículo antes de entrar" },
  { icon: MapPin, text: "Compartilhe sua viagem em tempo real com alguém de confiança" },
  { icon: Lock, text: "Sempre entre e saia pelo lado da calçada" },
  { icon: Users, text: "Nunca embarque se houver outro passageiro desconhecido" },
  { icon: Phone, text: "Em caso de emergência, ligue 190 (Polícia)" },
];

const driverTips = [
  { icon: Eye, text: "Confirme o nome do passageiro antes de iniciar a viagem" },
  { icon: MapPin, text: "Mantenha o GPS sempre ativo e a rota visível" },
  { icon: Lock, text: "Mantenha as portas travadas durante a corrida" },
  { icon: AlertTriangle, text: "Evite aceitar corridas em locais com pouca iluminação" },
  { icon: Phone, text: "Em caso de emergência, ligue 190 (Polícia)" },
];

const SafetyTips = ({ role }: SafetyTipsProps) => {
  const tips = role === "passenger" ? passengerTips : driverTips;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-primary" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Dicas de segurança
        </p>
      </div>
      <div className="space-y-2">
        {tips.map((tip, i) => {
          const TipIcon = tip.icon;
          return (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/50">
              <TipIcon size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed">{tip.text}</p>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => window.open(`https://wa.me/${SUPPORT_PHONE}?text=Olá, preciso de ajuda!`, "_blank")}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-semibold hover:bg-success/20 transition-colors"
      >
        <Phone size={14} />
        Suporte via WhatsApp
      </button>
    </div>
  );
};

export default SafetyTips;
