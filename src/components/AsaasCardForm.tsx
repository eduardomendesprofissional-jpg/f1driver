import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AsaasCardFormProps {
  onSuccess?: (data: { token: string; last4: string; brand: string }) => void;
  onCancel?: () => void;
}

const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
};

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length > 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  if (digits.length > 6) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  if (digits.length > 3) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  return digits;
};

const detectBrand = (number: string): string => {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(n)) return "elo";
  if (/^(606282|3841)/.test(n)) return "hipercard";
  return "";
};

const brandColors: Record<string, string> = {
  visa: "text-blue-500",
  mastercard: "text-orange-500",
  amex: "text-blue-400",
  elo: "text-yellow-500",
  hipercard: "text-red-500",
};

const brandNames: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  elo: "Elo",
  hipercard: "Hipercard",
};

const AsaasCardForm = ({ onSuccess, onCancel }: AsaasCardFormProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [showCvv, setShowCvv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const brand = detectBrand(cardNumber);
  const isValid =
    cardNumber.replace(/\s/g, "").length >= 13 &&
    holderName.trim().length >= 3 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    cpf.replace(/\D/g, "").length === 11;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    try {
      const [expiryMonth, expiryYear] = expiry.split("/");

      const { data, error } = await supabase.functions.invoke("asaas-tokenize-card", {
        body: {
          holder_name: holderName.toUpperCase(),
          card_number: cardNumber.replace(/\s/g, ""),
          expiry_month: expiryMonth,
          expiry_year: `20${expiryYear}`,
          cvv,
          holder_cpf: cpf.replace(/\D/g, ""),
          holder_email: email || undefined,
          holder_phone: phone || undefined,
          postal_code: postalCode || undefined,
          address_number: addressNumber || undefined,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erro ao tokenizar cartão");
      }

      setSuccess(true);
      toast.success("Cartão salvo com segurança!");
      onSuccess?.({
        token: data.credit_card_token,
        last4: data.last4,
        brand: data.brand,
      });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar cartão");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <p className="text-lg font-bold text-foreground">Cartão salvo!</p>
        <p className="text-sm text-muted-foreground text-center">
          Seus dados estão protegidos. Apenas um token seguro foi armazenado.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Card Preview */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-secondary via-card to-secondary border border-border/30"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/3 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <CreditCard size={28} className="text-muted-foreground" />
            {brand && (
              <span className={`text-sm font-bold ${brandColors[brand] || "text-muted-foreground"}`}>
                {brandNames[brand] || brand}
              </span>
            )}
          </div>
          <p className="text-xl font-mono tracking-[0.2em] text-foreground mb-6">
            {cardNumber || "•••• •••• •••• ••••"}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Titular
              </p>
              <p className="text-sm font-semibold text-foreground uppercase truncate max-w-[200px]">
                {holderName || "NOME NO CARTÃO"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Validade
              </p>
              <p className="text-sm font-semibold text-foreground font-mono">
                {expiry || "MM/AA"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Card Number */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Número do cartão
        </Label>
        <div className="relative">
          <Input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="0000 0000 0000 0000"
            className="h-12 pl-4 pr-12 font-mono text-base bg-secondary/30 border-border/40 focus:border-primary/60"
            maxLength={19}
            inputMode="numeric"
          />
          {brand && (
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${brandColors[brand]}`}>
              {brandNames[brand]}
            </span>
          )}
        </div>
      </div>

      {/* Holder Name */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Nome impresso no cartão
        </Label>
        <Input
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          placeholder="NOME COMO NO CARTÃO"
          className="h-12 uppercase bg-secondary/30 border-border/40 focus:border-primary/60"
        />
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Validade
          </Label>
          <Input
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            className="h-12 font-mono bg-secondary/30 border-border/40 focus:border-primary/60"
            maxLength={5}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            CVV
          </Label>
          <div className="relative">
            <Input
              type={showCvv ? "text" : "password"}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="•••"
              className="h-12 pr-10 font-mono bg-secondary/30 border-border/40 focus:border-primary/60"
              maxLength={4}
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => setShowCvv(!showCvv)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCvv ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* CPF */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          CPF do titular
        </Label>
        <Input
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          placeholder="000.000.000-00"
          className="h-12 bg-secondary/30 border-border/40 focus:border-primary/60"
          maxLength={14}
          inputMode="numeric"
        />
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            CEP <span className="text-muted-foreground/50">(opcional)</span>
          </Label>
          <Input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="00000000"
            className="h-12 bg-secondary/30 border-border/40 focus:border-primary/60"
            maxLength={8}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Nº <span className="text-muted-foreground/50">(opcional)</span>
          </Label>
          <Input
            value={addressNumber}
            onChange={(e) => setAddressNumber(e.target.value)}
            placeholder="123"
            className="h-12 bg-secondary/30 border-border/40 focus:border-primary/60"
          />
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/5 border border-green-500/10">
        <Lock size={14} className="text-green-500" />
        <p className="text-xs text-green-400">
          Seus dados são criptografados e tokenizados. Não armazenamos número do cartão ou CVV.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <Button
          type="submit"
          className="w-full h-13 text-base font-bold rounded-xl"
          disabled={!isValid || loading}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Tokenizando...
            </>
          ) : (
            <>
              <Lock size={16} className="mr-2" />
              Salvar cartão com segurança
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};

export default AsaasCardForm;
