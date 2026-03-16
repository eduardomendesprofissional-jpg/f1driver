import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Package, MapPin, Search, Loader2, Scale,
  Ruler, CreditCard, Banknote, QrCode, ChevronRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoogleSearch, GooglePlace } from "@/hooks/useGoogleSearch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { MAPBOX_TOKEN } from "@/lib/mapbox";

const TAMANHOS = [
  { id: "pequeno", label: "Pequeno", desc: "Até 30cm, cabe na mão", icon: "📦", multiplicador: 1 },
  { id: "medio", label: "Médio", desc: "Até 50cm, cabe no banco", icon: "📫", multiplicador: 1.3 },
  { id: "grande", label: "Grande", desc: "Até 1m, porta-malas", icon: "🗳️", multiplicador: 1.7 },
];

const PAGAMENTOS = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "card", label: "Cartão", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
];

type Step = "package" | "coleta" | "entrega" | "resumo";

const EnvioNovo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Form state
  const [step, setStep] = useState<Step>("package");
  const [descricao, setDescricao] = useState("");
  const [peso, setPeso] = useState("1");
  const [tamanho, setTamanho] = useState("pequeno");

  // Address state
  const [searchingField, setSearchingField] = useState<"coleta" | "entrega" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { results, loading: searching, search, clear } = useGoogleSearch();

  const [coleta, setColeta] = useState<{ endereco: string; lat: number; lng: number } | null>(null);
  const [entrega, setEntrega] = useState<{ endereco: string; lat: number; lng: number } | null>(null);

  // Pricing
  const [estimativa, setEstimativa] = useState<{ distancia_km: number; valor: number } | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [pagamento, setPagamento] = useState("pix");
  const [criando, setCriando] = useState(false);

  // Use current location for coleta by default
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&language=pt-BR&limit=1`
          );
          const data = await res.json();
          const name = data.features?.[0]?.place_name || "Sua localização";
          setColeta({ lat: latitude, lng: longitude, endereco: name });
        } catch {
          setColeta({ lat: latitude, lng: longitude, endereco: "Sua localização" });
        }
      },
      () => {}
    );
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(q, coleta ? [coleta.lng, coleta.lat] : undefined);
    }, 350);
  };

  const handleSelectPlace = (place: GooglePlace) => {
    const addr = { endereco: place.place_name, lat: place.center[1], lng: place.center[0] };
    if (searchingField === "coleta") {
      setColeta(addr);
    } else {
      setEntrega(addr);
    }
    setSearchingField(null);
    setSearchQuery("");
    clear();
  };

  // Calculate pricing when both addresses are set
  const calcularPreco = async () => {
    if (!coleta || !entrega) return;
    setCalculando(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coleta.lng},${coleta.lat};${entrega.lng},${entrega.lat}?access_token=${MAPBOX_TOKEN}&overview=false`
      );
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) {
        toast.error("Não foi possível calcular a rota.");
        return;
      }
      const distancia_km = Math.round((route.distance / 1000) * 10) / 10;

      const pesoNum = parseFloat(peso) || 1;
      const tamInfo = TAMANHOS.find(t => t.id === tamanho) || TAMANHOS[0];
      const base = 8;
      const perKm = 2.5;
      const weightSurcharge = pesoNum > 5 ? (pesoNum - 5) * 1.5 : 0;
      let valor = (base + perKm * distancia_km + weightSurcharge) * tamInfo.multiplicador;
      valor = Math.max(valor, 12);
      valor = Math.round(valor * 100) / 100;

      setEstimativa({ distancia_km, valor });
    } catch {
      toast.error("Erro ao calcular rota.");
    } finally {
      setCalculando(false);
    }
  };

  useEffect(() => {
    if (step === "resumo" && coleta && entrega && !estimativa) {
      calcularPreco();
    }
  }, [step]);

  const handleCriarEnvio = async () => {
    if (!user || !coleta || !entrega || !estimativa) return;
    if (!descricao.trim()) return toast.error("Descreva o pacote");
    setCriando(true);
    const { error } = await supabase.from("envios" as any).insert({
      user_id: user.id,
      descricao: descricao.trim(),
      peso_kg: parseFloat(peso) || 1,
      tamanho,
      coleta_endereco: coleta.endereco,
      coleta_lat: coleta.lat,
      coleta_lng: coleta.lng,
      entrega_endereco: entrega.endereco,
      entrega_lat: entrega.lat,
      entrega_lng: entrega.lng,
      distancia_km: estimativa.distancia_km,
      valor: estimativa.valor,
      forma_pagamento: pagamento,
    });
    setCriando(false);
    if (error) {
      toast.error("Erro ao criar envio.");
      console.error(error);
      return;
    }

    // Send push notification to nearby online drivers
    try {
      const { data: onlineDrivers } = await supabase
        .from("driver_locations")
        .select("driver_id")
        .eq("online", true)
        .limit(10);

      if (onlineDrivers?.length) {
        await Promise.all(
          onlineDrivers.map(({ driver_id }) =>
            supabase.functions.invoke("send-push-notification", {
              body: {
                user_id: driver_id,
                title: "📦 Novo envio disponível!",
                body: `De ${coleta.endereco} → ${entrega.endereco} | R$ ${estimativa.valor.toFixed(2)}`,
                data: { type: "envio" },
              },
            }).catch(() => {})
          )
        );
      }
    } catch {
      // Non-blocking, envio was already created
    }

    toast.success("Envio criado com sucesso!");
    navigate("/envios");
  };

  const canProceedPackage = descricao.trim().length > 0;
  const canProceedColeta = !!coleta;
  const canProceedEntrega = !!entrega;

  const nextStep = () => {
    if (step === "package" && canProceedPackage) setStep("coleta");
    else if (step === "coleta" && canProceedColeta) setStep("entrega");
    else if (step === "entrega" && canProceedEntrega) setStep("resumo");
  };

  const prevStep = () => {
    if (step === "resumo") setStep("entrega");
    else if (step === "entrega") setStep("coleta");
    else if (step === "coleta") setStep("package");
    else navigate("/envios");
  };

  const stepIndex = ["package", "coleta", "entrega", "resumo"].indexOf(step);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button onClick={prevStep} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Novo Envio</h1>
      </div>

      {/* Progress */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {["Pacote", "Coleta", "Entrega", "Resumo"].map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full transition-colors ${i <= stepIndex ? "bg-primary" : "bg-secondary"}`} />
              <p className={`text-[10px] mt-1 text-center ${i <= stepIndex ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Package Details */}
          {step === "package" && (
            <motion.div key="package" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-primary" />
                  <h2 className="font-semibold text-foreground">Dados do pacote</h2>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Descrição do conteúdo</label>
                  <Input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Documentos, eletrônicos, roupas..."
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
                    <Scale size={12} /> Peso estimado (kg)
                  </label>
                  <Input
                    type="number"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    min="0.1"
                    max="30"
                    step="0.5"
                    placeholder="1"
                  />
                  {parseFloat(peso) > 5 && (
                    <p className="text-[10px] text-amber-500 mt-1">Acréscimo por peso acima de 5kg</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                    <Ruler size={12} /> Tamanho
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TAMANHOS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTamanho(t.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          tamanho === t.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary"
                        }`}
                      >
                        <span className="text-2xl">{t.icon}</span>
                        <span className={`text-xs font-semibold ${tamanho === t.id ? "text-primary" : "text-muted-foreground"}`}>
                          {t.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Pickup Address */}
          {step === "coleta" && (
            <motion.div key="coleta" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <h2 className="font-semibold text-foreground">Endereço de coleta</h2>
                </div>

                {coleta ? (
                  <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      <p className="text-sm text-foreground truncate">{coleta.endereco}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSearchingField("coleta")}>
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setSearchingField("coleta")}
                  >
                    <Search size={16} />
                    Buscar endereço de coleta
                  </Button>
                )}

                <p className="text-xs text-muted-foreground">
                  O motorista buscará o pacote neste endereço.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Delivery Address */}
          {step === "entrega" && (
            <motion.div key="entrega" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-destructive" />
                  <h2 className="font-semibold text-foreground">Endereço de entrega</h2>
                </div>

                {entrega ? (
                  <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      <p className="text-sm text-foreground truncate">{entrega.endereco}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSearchingField("entrega")}>
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setSearchingField("entrega")}
                  >
                    <Search size={16} />
                    Buscar endereço de entrega
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Summary */}
          {step === "resumo" && (
            <motion.div key="resumo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Route summary */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h2 className="font-semibold text-foreground">Resumo do envio</h2>

                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <div className="w-px h-8 bg-border" />
                    <MapPin size={14} className="text-destructive" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Coleta</p>
                      <p className="text-sm font-semibold truncate">{coleta?.endereco}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Entrega</p>
                      <p className="text-sm font-semibold truncate">{entrega?.endereco}</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Package info */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Pacote</p>
                    <p className="text-sm font-semibold">{TAMANHOS.find(t => t.id === tamanho)?.label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="text-sm font-semibold">{peso} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distância</p>
                    <p className="text-sm font-semibold">
                      {calculando ? "..." : estimativa ? `${estimativa.distancia_km} km` : "—"}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Valor do envio</p>
                  {calculando ? (
                    <Loader2 className="animate-spin text-primary mx-auto mt-1" size={24} />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      R$ {estimativa?.valor?.toFixed(2) || "—"}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pagamento</p>
                <div className="flex gap-3">
                  {PAGAMENTOS.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setPagamento(pm.id)}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        pagamento === pm.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary"
                      }`}
                    >
                      <pm.icon size={20} className={pagamento === pm.id ? "text-primary" : "text-muted-foreground"} />
                      <span className={`text-xs font-semibold ${pagamento === pm.id ? "text-primary" : "text-muted-foreground"}`}>
                        {pm.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Conteúdo</p>
                <p className="text-sm text-foreground">{descricao}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action */}
      <div className="p-4 bg-card border-t border-border">
        {step === "resumo" ? (
          <Button
            className="w-full h-14 text-base font-bold"
            onClick={handleCriarEnvio}
            disabled={criando || calculando || !estimativa}
          >
            {criando ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
            {criando ? "Criando envio..." : `Confirmar envio • R$ ${estimativa?.valor?.toFixed(2) || "..."}`}
          </Button>
        ) : (
          <Button
            className="w-full h-14 text-base font-bold gap-2"
            onClick={nextStep}
            disabled={
              (step === "package" && !canProceedPackage) ||
              (step === "coleta" && !canProceedColeta) ||
              (step === "entrega" && !canProceedEntrega)
            }
          >
            Continuar <ChevronRight size={18} />
          </Button>
        )}
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchingField && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSearchingField(null); clear(); setSearchQuery(""); }}
                  className="text-foreground p-2"
                >
                  ✕
                </button>
                <h2 className="text-lg font-bold">
                  {searchingField === "coleta" ? "Endereço de coleta" : "Endereço de entrega"}
                </h2>
              </div>
              <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
                <MapPin size={14} className="text-primary" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Digite o endereço"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {searching && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                    >
                      <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{place.place_name}</span>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 3 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum resultado encontrado.</p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Digite pelo menos 3 caracteres.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnvioNovo;
