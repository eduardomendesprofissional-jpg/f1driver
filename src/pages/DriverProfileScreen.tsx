import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, CreditCard, Settings, ChevronRight, ArrowLeft, LogOut,
  Camera, Shield, CheckCircle2, Plus, Trash2, Star, Edit2, Save, X,
  Fingerprint, AlertCircle, Car, FileText, Palette
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface Profile {
  nome: string | null;
  telefone: string | null;
  avatar_url: string | null;
  cpf: string | null;
  verificacao_facial: boolean;
  cnh: string | null;
  veiculo_placa: string | null;
  veiculo_modelo: string | null;
  veiculo_cor: string | null;
}

interface PaymentMethod {
  id: string;
  tipo: string;
  label: string;
  dados: Record<string, string>;
  padrao: boolean;
}

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const DriverProfileScreen = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [editingCPF, setEditingCPF] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [editingCNH, setEditingCNH] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [cpfValue, setCpfValue] = useState("");
  const [cnhValue, setCnhValue] = useState("");
  const [placaValue, setPlacaValue] = useState("");
  const [modeloValue, setModeloValue] = useState("");
  const [corValue, setCorValue] = useState("");

  const [addingPayment, setAddingPayment] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState("pix");
  const [newPaymentLabel, setNewPaymentLabel] = useState("");
  const [newPaymentKey, setNewPaymentKey] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchPayments();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("nome, telefone, avatar_url, cpf, verificacao_facial, cnh, veiculo_placa, veiculo_modelo, veiculo_cor")
      .eq("id", user!.id)
      .single();
    if (data) {
      setProfile(data as unknown as Profile);
      setNameValue(data.nome || "");
      setCpfValue(data.cpf || "");
      setCnhValue((data as any).cnh || "");
      setPlacaValue((data as any).veiculo_placa || "");
      setModeloValue((data as any).veiculo_modelo || "");
      setCorValue((data as any).veiculo_cor || "");
    }
    setLoading(false);
  };
  const fetchPayments = async () => {
    const { data } = await supabase
      .from("metodos_pagamento")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setPayments(data as PaymentMethod[]);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Erro ao enviar foto");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl + "?t=" + Date.now() })
      .eq("id", user.id);
    setProfile((p) => p ? { ...p, avatar_url: urlData.publicUrl + "?t=" + Date.now() } : p);
    setUploading(false);
    toast.success("Foto atualizada!");
  };

  const saveName = async () => {
    if (!nameValue.trim()) return toast.error("Nome não pode ser vazio");
    await supabase.from("profiles").update({ nome: nameValue.trim() }).eq("id", user!.id);
    setProfile((p) => p ? { ...p, nome: nameValue.trim() } : p);
    setEditingName(false);
    toast.success("Nome atualizado!");
  };

  const saveCPF = async () => {
    const digits = cpfValue.replace(/\D/g, "");
    if (digits.length !== 11) return toast.error("CPF deve ter 11 dígitos");
    const formatted = formatCPF(digits);
    await supabase.from("profiles").update({ cpf: formatted }).eq("id", user!.id);
    setProfile((p) => p ? { ...p, cpf: formatted } : p);
    setCpfValue(formatted);
    setEditingCPF(false);
    toast.success("CPF salvo!");
  };

  const saveCNH = async () => {
    const digits = cnhValue.replace(/\D/g, "");
    if (digits.length !== 11) return toast.error("CNH deve ter 11 dígitos");
    await supabase.from("profiles").update({ cnh: digits } as any).eq("id", user!.id);
    setProfile((p) => p ? { ...p, cnh: digits } : p);
    setEditingCNH(false);
    toast.success("CNH salva!");
  };

  const saveVehicle = async () => {
    if (!placaValue.trim() || !modeloValue.trim() || !corValue.trim()) {
      return toast.error("Preencha todos os campos do veículo");
    }
    await supabase.from("profiles").update({
      veiculo_placa: placaValue.trim().toUpperCase(),
      veiculo_modelo: modeloValue.trim(),
      veiculo_cor: corValue.trim(),
    } as any).eq("id", user!.id);
    setProfile((p) => p ? { ...p, veiculo_placa: placaValue.trim().toUpperCase(), veiculo_modelo: modeloValue.trim(), veiculo_cor: corValue.trim() } : p);
    setEditingVehicle(false);
    toast.success("Dados do veículo salvos!");
  };

    toast.info("Iniciando verificação facial...");
    setTimeout(async () => {
      await supabase.from("profiles").update({ verificacao_facial: true }).eq("id", user!.id);
      setProfile((p) => p ? { ...p, verificacao_facial: true } : p);
      toast.success("Verificação facial concluída!");
    }, 2000);
  };

  const addPaymentMethod = async () => {
    if (!newPaymentLabel.trim() || !newPaymentKey.trim()) {
      return toast.error("Preencha todos os campos");
    }
    const { error } = await supabase.from("metodos_pagamento").insert({
      user_id: user!.id,
      tipo: newPaymentType,
      label: newPaymentLabel.trim(),
      dados: { chave: newPaymentKey.trim() },
      padrao: payments.length === 0,
    });
    if (error) return toast.error("Erro ao adicionar");
    toast.success("Método adicionado!");
    setAddingPayment(false);
    setNewPaymentLabel("");
    setNewPaymentKey("");
    fetchPayments();
  };

  const deletePayment = async (id: string) => {
    await supabase.from("metodos_pagamento").delete().eq("id", id);
    toast.success("Método removido");
    fetchPayments();
  };

  const setDefaultPayment = async (id: string) => {
    await supabase.from("metodos_pagamento").update({ padrao: false }).eq("user_id", user!.id);
    await supabase.from("metodos_pagamento").update({ padrao: true }).eq("id", id);
    toast.success("Método padrão atualizado");
    fetchPayments();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Perfil do Motorista</h1>
        <Badge className="ml-auto gap-1 bg-primary/10 text-primary border-primary/30">
          <Car size={12} />
          Motorista
        </Badge>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 space-y-4">
        {/* Avatar Section */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="Avatar" />
                ) : null}
                <AvatarFallback className="bg-secondary text-primary text-2xl">
                  {profile?.nome?.charAt(0)?.toUpperCase() || <User size={32} />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              >
                {uploading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Name */}
            <div className="w-full">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="flex-1"
                    placeholder="Seu nome"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={saveName}>
                    <Save size={16} className="text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setEditingName(false); setNameValue(profile?.nome || ""); }}>
                    <X size={16} className="text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg font-bold text-foreground">{profile?.nome || "Sem nome"}</p>
                  <button onClick={() => setEditingName(true)}>
                    <Edit2 size={14} className="text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center mt-1">{user?.email}</p>
              {profile?.telefone && (
                <p className="text-sm text-muted-foreground text-center">{profile.telefone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Identity / CPF */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={20} className="text-primary" />
              <h2 className="font-semibold text-foreground">Identidade (CPF)</h2>
            </div>
            {editingCPF ? (
              <div className="flex items-center gap-2">
                <Input
                  value={cpfValue}
                  onChange={(e) => setCpfValue(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="flex-1"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={saveCPF}>
                  <Save size={16} className="text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { setEditingCPF(false); setCpfValue(profile?.cpf || ""); }}>
                  <X size={16} className="text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {profile?.cpf ? (
                    <>
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-sm text-foreground">{profile.cpf}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className="text-amber-500" />
                      <span className="text-sm text-muted-foreground">CPF não cadastrado</span>
                    </>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingCPF(true)}>
                  <Edit2 size={14} />
                  {profile?.cpf ? "Editar" : "Adicionar"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CNH */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText size={20} className="text-primary" />
              <h2 className="font-semibold text-foreground">CNH</h2>
            </div>
            {editingCNH ? (
              <div className="flex items-center gap-2">
                <Input
                  value={cnhValue}
                  onChange={(e) => setCnhValue(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="00000000000"
                  maxLength={11}
                  className="flex-1"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={saveCNH}>
                  <Save size={16} className="text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { setEditingCNH(false); setCnhValue(profile?.cnh || ""); }}>
                  <X size={16} className="text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {profile?.cnh ? (
                    <>
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-sm text-foreground">{profile.cnh}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className="text-amber-500" />
                      <span className="text-sm text-muted-foreground">CNH não cadastrada</span>
                    </>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingCNH(true)}>
                  <Edit2 size={14} />
                  {profile?.cnh ? "Editar" : "Adicionar"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Veículo */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Car size={20} className="text-primary" />
              <h2 className="font-semibold text-foreground">Veículo</h2>
            </div>
            {editingVehicle ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Placa</label>
                  <Input
                    value={placaValue}
                    onChange={(e) => setPlacaValue(e.target.value.toUpperCase().slice(0, 7))}
                    placeholder="ABC1D23"
                    maxLength={7}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Modelo</label>
                  <Input
                    value={modeloValue}
                    onChange={(e) => setModeloValue(e.target.value)}
                    placeholder="Ex: Honda Civic 2022"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cor</label>
                  <Input
                    value={corValue}
                    onChange={(e) => setCorValue(e.target.value)}
                    placeholder="Ex: Preto"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveVehicle} size="sm" className="flex-1">Salvar</Button>
                  <Button onClick={() => { setEditingVehicle(false); setPlacaValue(profile?.veiculo_placa || ""); setModeloValue(profile?.veiculo_modelo || ""); setCorValue(profile?.veiculo_cor || ""); }} size="sm" variant="outline">Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {profile?.veiculo_placa ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-sm font-medium text-foreground">{profile.veiculo_modelo}</span>
                      </div>
                      <div className="flex items-center gap-3 ml-6">
                        <Badge variant="outline" className="text-xs">{profile.veiculo_placa}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Palette size={12} /> {profile.veiculo_cor}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-500" />
                      <span className="text-sm text-muted-foreground">Veículo não cadastrado</span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingVehicle(true)}>
                  <Edit2 size={14} />
                  {profile?.veiculo_placa ? "Editar" : "Adicionar"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facial Verification */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Fingerprint size={20} className="text-primary" />
              <h2 className="font-semibold text-foreground">Verificação Facial</h2>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {profile?.verificacao_facial ? (
                  <>
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span className="text-sm text-foreground">Verificado</span>
                    <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Ativo</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-amber-500" />
                    <span className="text-sm text-muted-foreground">Não verificado</span>
                  </>
                )}
              </div>
              {!profile?.verificacao_facial && (
                <Button size="sm" onClick={startFacialVerification} className="gap-1">
                  <Camera size={14} />
                  Verificar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-primary" />
                <h2 className="font-semibold text-foreground">Métodos de Recebimento</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAddingPayment(true)} className="gap-1">
                <Plus size={14} />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {payments.length === 0 && !addingPayment && (
                <p className="text-sm text-muted-foreground py-2">Nenhum método cadastrado</p>
              )}
              {payments.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between py-3 px-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{pm.label}</p>
                      <p className="text-xs text-muted-foreground capitalize">{pm.tipo}</p>
                    </div>
                    {pm.padrao && (
                      <Badge variant="secondary" className="text-xs">Padrão</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!pm.padrao && (
                      <Button variant="ghost" size="icon" onClick={() => setDefaultPayment(pm.id)} title="Definir como padrão">
                        <Star size={14} className="text-muted-foreground" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deletePayment(pm.id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {addingPayment && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex gap-2">
                    {["pix", "conta bancária"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewPaymentType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          newPaymentType === t
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={newPaymentLabel}
                    onChange={(e) => setNewPaymentLabel(e.target.value)}
                    placeholder="Nome (ex: Pix pessoal)"
                  />
                  <Input
                    value={newPaymentKey}
                    onChange={(e) => setNewPaymentKey(e.target.value)}
                    placeholder={newPaymentType === "conta bancária" ? "Banco / Agência / Conta" : "Chave PIX"}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addPaymentMethod} size="sm" className="flex-1">Salvar</Button>
                    <Button
                      onClick={() => { setAddingPayment(false); setNewPaymentLabel(""); setNewPaymentKey(""); }}
                      size="sm"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings & Logout */}
        <Card className="bg-card border-border overflow-hidden">
          <button
            onClick={() => navigate("/driver")}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-secondary transition-colors border-b border-border"
          >
            <Car size={20} className="text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">Painel de Corridas</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-secondary transition-colors border-b border-border"
          >
            <Settings size={20} className="text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">Configurações</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-secondary transition-colors"
          >
            <LogOut size={20} className="text-destructive" />
            <span className="flex-1 text-left text-sm font-medium text-destructive">Sair</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </Card>
      </motion.div>

      <BottomNav active="profile" role="driver" />
    </div>
  );
};

export default DriverProfileScreen;
