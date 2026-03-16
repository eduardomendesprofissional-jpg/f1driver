import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Camera, User, Car, FileText, Shield, Save,
  CheckCircle2, Clock, AlertCircle, Send, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface DriverProfile {
  nome: string | null;
  telefone: string | null;
  avatar_url: string | null;
  cpf: string | null;
  cnh: string | null;
  veiculo_placa: string | null;
  veiculo_modelo: string | null;
  veiculo_cor: string | null;
  status_aprovacao: string;
}

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const STATUS_CONFIG = {
  pendente: {
    label: "Enviar dados",
    icon: Send,
    color: "text-warning",
    bg: "bg-warning/10 border-warning/30",
    description: "Preencha seus dados pessoais e do veículo para enviar para aprovação.",
  },
  em_analise: {
    label: "Em análise",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    description: "Seus dados foram enviados e estão sendo analisados pela equipe.",
  },
  aprovado: {
    label: "Aprovado",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10 border-success/30",
    description: "Seu cadastro foi aprovado! Você pode ficar online e receber corridas.",
  },
};

const DriverSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnh, setCnh] = useState("");
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("nome, telefone, avatar_url, cpf, cnh, veiculo_placa, veiculo_modelo, veiculo_cor, status_aprovacao")
      .eq("id", user!.id)
      .single();
    if (data) {
      const p = data as unknown as DriverProfile;
      setProfile(p);
      setNome(p.nome || "");
      setCpf(p.cpf || "");
      setCnh(p.cnh || "");
      setPlaca(p.veiculo_placa || "");
      setModelo(p.veiculo_modelo || "");
      setCor(p.veiculo_cor || "");
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Imagem deve ter no máximo 2MB");
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar foto"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setProfile((p) => p ? { ...p, avatar_url: url } : p);
    setUploading(false);
    toast.success("Foto atualizada!");
  };

  const handleSubmit = async () => {
    if (!nome.trim()) return toast.error("Nome é obrigatório");
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) return toast.error("CPF deve ter 11 dígitos");
    const cnhDigits = cnh.replace(/\D/g, "");
    if (cnhDigits.length !== 11) return toast.error("CNH deve ter 11 dígitos");
    if (!placa.trim() || !modelo.trim() || !cor.trim()) return toast.error("Preencha todos os dados do veículo");

    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      nome: nome.trim(),
      cpf: formatCPF(cpfDigits),
      cnh: cnhDigits,
      veiculo_placa: placa.trim().toUpperCase(),
      veiculo_modelo: modelo.trim(),
      veiculo_cor: cor.trim(),
      status_aprovacao: "em_analise",
    } as any).eq("id", user!.id);

    setSaving(false);
    if (error) return toast.error("Erro ao salvar dados");
    toast.success("Dados enviados para análise!");
    setProfile((p) => p ? { ...p, status_aprovacao: "em_analise" } : p);
  };

  const status = (profile?.status_aprovacao || "pendente") as keyof typeof STATUS_CONFIG;
  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
  const StatusIcon = statusInfo.icon;
  const isEditable = status === "pendente";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-lg z-10 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Configurações</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-4 mt-4">
        {/* Status Banner */}
        <Card className={`border ${statusInfo.bg}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.bg}`}>
              <StatusIcon size={24} className={statusInfo.color} />
            </div>
            <div className="flex-1">
              <p className={`font-bold text-sm ${statusInfo.color}`}>{statusInfo.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{statusInfo.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status Steps */}
        <div className="flex items-center gap-2 px-2">
          {(["pendente", "em_analise", "aprovado"] as const).map((step, i) => {
            const stepConfig = STATUS_CONFIG[step];
            const StepIcon = stepConfig.icon;
            const isActive = step === status;
            const isPast = (status === "em_analise" && step === "pendente") ||
              (status === "aprovado" && (step === "pendente" || step === "em_analise"));
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive || isPast ? stepConfig.bg + " border" : "bg-secondary border border-border"
                  }`}>
                    <StepIcon size={18} className={isActive || isPast ? stepConfig.color : "text-muted-foreground"} />
                  </div>
                  <p className={`text-[10px] mt-1 font-medium text-center ${
                    isActive ? stepConfig.color : "text-muted-foreground"
                  }`}>{stepConfig.label}</p>
                </div>
                {i < 2 && (
                  <div className={`h-0.5 w-full mx-1 mt-[-16px] rounded ${
                    isPast || (isActive && step !== "pendente") ? "bg-primary" : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Avatar */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-20 h-20">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
                <AvatarFallback className="bg-secondary text-primary text-xl">
                  {nome?.charAt(0)?.toUpperCase() || <User size={28} />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md"
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </CardContent>
        </Card>

        {/* Personal Data */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} className="text-primary" />
              <h2 className="font-semibold text-sm">Dados Pessoais</h2>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome completo</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={!isEditable} placeholder="Seu nome completo" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">CPF</label>
              <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} disabled={!isEditable} placeholder="000.000.000-00" maxLength={14} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">CNH</label>
              <Input value={cnh} onChange={(e) => setCnh(e.target.value.replace(/\D/g, "").slice(0, 11))} disabled={!isEditable} placeholder="00000000000" maxLength={11} />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Data */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Car size={18} className="text-primary" />
              <h2 className="font-semibold text-sm">Dados do Veículo</h2>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Placa</label>
              <Input value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase().slice(0, 7))} disabled={!isEditable} placeholder="ABC1D23" maxLength={7} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Modelo</label>
              <Input value={modelo} onChange={(e) => setModelo(e.target.value)} disabled={!isEditable} placeholder="Ex: Honda Civic 2022" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cor</label>
              <Input value={cor} onChange={(e) => setCor(e.target.value)} disabled={!isEditable} placeholder="Ex: Preto" />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        {isEditable && (
          <Button className="w-full h-12 font-bold text-base" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
            Enviar para aprovação
          </Button>
        )}

        {status === "em_analise" && (
          <p className="text-xs text-center text-muted-foreground px-4">
            Seus dados estão em análise. Você será notificado quando forem aprovados.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default DriverSettings;
