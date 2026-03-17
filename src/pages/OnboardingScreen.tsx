import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, FileText, Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MAPBOX_TOKEN, MAPBOX_DARK_STYLE } from "@/lib/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// CPF mask
const maskCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

// Date mask
const maskDate = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
};

// CPF validation
const validateCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  if (rem !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  return rem === parseInt(digits[10]);
};

// Age validation
const isOver18 = (dateStr: string): boolean => {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return false;
  const [dd, mm, yyyy] = parts.map(Number);
  const birth = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
};

const StepName = ({ nome, setNome, onNext }: { nome: string; setNome: (v: string) => void; onNext: () => void }) => (
  <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex flex-col gap-6 w-full">
    <div className="flex flex-col gap-2">
      <User className="text-primary" size={32} />
      <h1 className="text-2xl font-bold text-foreground">Como podemos te chamar?</h1>
      <p className="text-muted-foreground text-sm">Seu nome será visível para motoristas e passageiros.</p>
    </div>
    <Input
      placeholder="Nome completo"
      value={nome}
      onChange={(e) => setNome(e.target.value)}
      className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
    />
    <Button onClick={onNext} disabled={!nome.trim()} className="h-12 font-bold">
      Continuar
    </Button>
  </motion.div>
);

const StepAddress = ({ endereco, setEndereco, onNext }: { endereco: string; setEndereco: (v: string) => void; onNext: () => void }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_DARK_STYLE,
      center: [-49.27, -25.43],
      zoom: 14,
      interactive: false,
    });
    mapRef.current = map;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setCenter([longitude, latitude]);
        new mapboxgl.Marker({ color: "#3b82f6" }).setLngLat([longitude, latitude]).addTo(map);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data.display_name) setEndereco(data.display_name);
        } catch { /* ignore */ }
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true }
    );

    return () => { map.remove(); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <MapPin className="text-primary" size={32} />
        <h1 className="text-2xl font-bold text-foreground">Confirme seu endereço</h1>
        <p className="text-muted-foreground text-sm">Usamos sua localização para encontrar motoristas próximos.</p>
      </div>
      <div ref={mapContainer} className="w-full h-40 rounded-xl overflow-hidden border border-border" />
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="animate-spin" size={16} /> Detectando localização...
        </div>
      ) : (
        <Input
          placeholder="Seu endereço"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      )}
      <Button onClick={onNext} disabled={!endereco.trim()} className="h-12 font-bold">
        Confirmar Endereço
      </Button>
    </motion.div>
  );
};

const StepDocuments = ({ cpf, setCpf, nascimento, setNascimento, onNext }: {
  cpf: string; setCpf: (v: string) => void;
  nascimento: string; setNascimento: (v: string) => void;
  onNext: () => void;
}) => {
  const handleNext = () => {
    const rawCpf = cpf.replace(/\D/g, "");
    if (rawCpf.length !== 11 || !validateCPF(cpf)) {
      toast.error("CPF inválido.");
      return;
    }
    if (!isOver18(nascimento)) {
      toast.error("Você precisa ter pelo menos 18 anos.");
      return;
    }
    onNext();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <FileText className="text-primary" size={32} />
        <h1 className="text-2xl font-bold text-foreground">Seus dados pessoais</h1>
        <p className="text-muted-foreground text-sm">Precisamos de alguns dados para sua segurança.</p>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">CPF</label>
          <Input
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(maskCPF(e.target.value))}
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Data de Nascimento</label>
          <Input
            placeholder="00/00/0000"
            value={nascimento}
            onChange={(e) => setNascimento(maskDate(e.target.value))}
            className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            inputMode="numeric"
          />
        </div>
      </div>
      <Button onClick={handleNext} disabled={cpf.replace(/\D/g, "").length < 11 || nascimento.length < 10} className="h-12 font-bold">
        Continuar
      </Button>
    </motion.div>
  );
};

const StepUserType = ({ tipo, setTipo, onFinish, loading }: {
  tipo: string; setTipo: (v: string) => void; onFinish: () => void; loading: boolean;
}) => (
  <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex flex-col gap-6 w-full">
    <div className="flex flex-col gap-2">
      <Car className="text-primary" size={32} />
      <h1 className="text-2xl font-bold text-foreground">Como você vai usar o app?</h1>
      <p className="text-muted-foreground text-sm">Você poderá alterar isso depois.</p>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => setTipo("motorista")}
        className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
          tipo === "motorista"
            ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(210_100%_56%/0.2)]"
            : "border-border bg-secondary hover:border-muted-foreground/30"
        }`}
      >
        <span className="text-4xl">🚗</span>
        <span className="font-semibold text-foreground">Motorista</span>
        <span className="text-xs text-muted-foreground text-center">Quero oferecer corridas</span>
      </button>
      <button
        onClick={() => setTipo("passageiro")}
        className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
          tipo === "passageiro"
            ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(210_100%_56%/0.2)]"
            : "border-border bg-secondary hover:border-muted-foreground/30"
        }`}
      >
        <span className="text-4xl">🧍</span>
        <span className="font-semibold text-foreground">Passageiro</span>
        <span className="text-xs text-muted-foreground text-center">Quero solicitar corridas</span>
      </button>
    </div>
    <Button onClick={onFinish} disabled={!tipo || loading} className="h-12 font-bold">
      {loading ? <Loader2 className="animate-spin" size={20} /> : "Finalizar Cadastro"}
    </Button>
  </motion.div>
);

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [tipo, setTipo] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = [
    { icon: User, label: "Nome" },
    { icon: MapPin, label: "Endereço" },
    { icon: FileText, label: "Dados" },
    { icon: Car, label: "Tipo" },
  ];

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({
        nome,
        endereco,
        cpf: cpf.replace(/\D/g, ""),
        data_nascimento: nascimento,
        tipo,
        onboarding_completo: true,
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Cadastro concluído!");
      navigate(tipo === "motorista" ? "/driver" : "/passenger");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">Etapa {step + 1} de {steps.length}</span>
          <span className="text-xs text-primary font-semibold">{steps[step].label}</span>
        </div>
        <Progress value={((step + 1) / steps.length) * 100} className="h-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === 0 && <StepName key="name" nome={nome} setNome={setNome} onNext={() => setStep(1)} />}
            {step === 1 && <StepAddress key="address" endereco={endereco} setEndereco={setEndereco} onNext={() => setStep(2)} />}
            {step === 2 && <StepDocuments key="docs" cpf={cpf} setCpf={setCpf} nascimento={nascimento} setNascimento={setNascimento} onNext={() => setStep(3)} />}
            {step === 3 && <StepUserType key="type" tipo={tipo} setTipo={setTipo} onFinish={handleFinish} loading={loading} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
